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
    
    console.log('[AuthProvider] Buscando perfil para:', userId);
    
    // Timeout de segurança: se demorar mais de 5 segundos, libera o carregamento
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn('[AuthProvider] Timeout na busca de perfil, liberando interface');
        setLoading(false);
      }
    }, 5000);

    try {
      // Usando uma query mais simples (select com limit) que costuma ser mais estável
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .limit(1);

      const profile = data && data.length > 0 ? data[0] : null;

      if (error) {
        console.error('[AuthProvider] Erro na query de perfil:', error);
        throw error;
      }

      let finalProfile = profile;

      if (!finalProfile) {
        console.log('[AuthProvider] Criando perfil inicial...');
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : (currentUser.user_metadata?.role || 'student')
          })
          .select('*')
          .single();
        
        if (!insertError) finalProfile = newProfile;
      }

      // Carregar permissões se houver cargo
      if (finalProfile?.role) {
        finalProfile.permissions = {};
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        if (roleData) finalProfile.permissions = roleData.permissions || {};
      }

      if (currentUser.email === CHIEF_ADMIN_EMAIL) {
        finalProfile = { ...finalProfile, role: 'admin' };
      }

      setUserProfile(finalProfile);
      console.log('[AuthProvider] Perfil carregado com sucesso');
    } catch (error) {
      console.error('[AuthProvider] Falha crítica ao carregar perfil:', error);
      // Fallback para não travar o usuário
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

    // Inicialização única
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
        
        console.log('[AuthProvider] Auth State Change:', event);
        
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser && event !== 'INITIAL_SESSION') {
          setLoading(true);
          await fetchUserProfile(currentUser.id, currentUser);
        } else if (!currentUser) {
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