"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const isFetchingProfile = useRef(false);

  const CHIEF_ADMIN_EMAIL = 'xakatosh66@gmail.com';

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    if (isFetchingProfile.current) return;
    isFetchingProfile.current = true;
    
    console.log('[AuthProvider] Iniciando busca de perfil para:', userId);
    
    // TIMEOUT DE SEGURANÇA: Se em 3 segundos o banco não responder, libera o app
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('[AuthProvider] O banco de dados demorou demais. Liberando acesso de emergência.');
        setUserProfile({
          id: userId,
          name: currentUser.email?.split('@')[0] || 'Usuário',
          role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
          email: currentUser.email,
          permissions: {}
        });
        setLoading(false);
      }
    }, 3000);

    try {
      // Tenta buscar o perfil com um limite de tempo implícito
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let profile = data;

      if (!profile) {
        console.log('[AuthProvider] Perfil não existe. Criando...');
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student'
          })
          .select('*')
          .single();
        
        if (!createError) profile = newProfile;
      }

      // Carregar permissões
      if (profile) {
        profile.permissions = {};
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', profile.role)
          .maybeSingle();
        
        if (roleData) profile.permissions = roleData.permissions || {};
        
        if (currentUser.email === CHIEF_ADMIN_EMAIL) {
          profile.role = 'admin';
        }
        
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('[AuthProvider] Erro ao carregar perfil, usando dados locais:', err);
      setUserProfile({
        id: userId,
        name: currentUser.email?.split('@')[0] || 'Usuário',
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email,
        permissions: {}
      });
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      isFetchingProfile.current = false;
    }
  }, [loading]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchUserProfile(initialSession.user.id, initialSession.user);
      } else {
        setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          if (currentUser) {
            setLoading(true);
            await fetchUserProfile(currentUser.id, currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      await fetchUserProfile(user.id, user);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};