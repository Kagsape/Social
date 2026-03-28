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
    
    try {
      // 1. Tenta buscar o perfil
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);

      let profile = data && data.length > 0 ? data[0] : null;

      // 2. Se não existir ou der erro de permissão, tenta criar/garantir que existe
      if (!profile) {
        console.log('[AuthProvider] Perfil não encontrado ou erro de acesso. Tentando criar/recuperar...');
        
        const defaultRole = currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student';
        
        const { data: newProfile, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: defaultRole,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' })
          .select('*')
          .single();
        
        if (upsertError) {
          console.error('[AuthProvider] Erro ao fazer upsert do perfil:', upsertError);
          // Se falhar o banco, usamos um perfil em memória para não travar
          profile = {
            id: userId,
            name: currentUser.email?.split('@')[0] || 'Usuário',
            role: defaultRole,
            email: currentUser.email,
            permissions: {}
          };
        } else {
          profile = newProfile;
        }
      }

      // 3. Carregar permissões do cargo
      if (profile && profile.role) {
        profile.permissions = {};
        try {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permissions')
            .eq('name', profile.role)
            .maybeSingle();
          
          if (roleData) profile.permissions = roleData.permissions || {};
        } catch (e) {
          console.warn('[AuthProvider] Erro ao carregar permissões do cargo:', e);
        }
      }

      // 4. Garantia final para o Admin Principal
      if (currentUser.email === CHIEF_ADMIN_EMAIL) {
        profile = { ...profile, role: 'admin' };
      }

      setUserProfile(profile);
      console.log('[AuthProvider] Perfil final definido:', profile);
    } catch (error) {
      console.error('[AuthProvider] Erro geral no fetchUserProfile:', error);
    } finally {
      setLoading(false);
      isFetchingProfile.current = false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      console.log('[AuthProvider] Inicializando...');
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
        
        console.log('[AuthProvider] Mudança de estado:', event);
        
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