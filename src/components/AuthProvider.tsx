"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  roles: string[];
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
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
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // 1. Buscar perfil básico do usuário
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth] Erro ao buscar perfil:', profileError.message);
      }

      // 2. Buscar cargos vinculados ao usuário
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('[Auth] Erro ao buscar roles:', rolesError.message);
      }

      const rolesList = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
      setRoles(rolesList);

      if (profile) {
        // 3. Buscar permissões baseadas nos cargos
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .in('name', rolesList);
        
        const mergedPermissions = roleData?.reduce((acc, curr) => ({
          ...acc,
          ...(curr.permissions || {})
        }), {}) || {};

        setUserProfile({ ...profile, permissions: mergedPermissions });
      }
    } catch (err) {
      console.error('[Auth] Erro crítico em fetchUserProfile:', err);
      // Falhas no perfil não devem resetar a sessão, apenas manter o perfil como null
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            // Chamada em segundo plano: NÃO usamos await aqui
            fetchUserProfile(initialSession.user.id);
          }
        }
      } catch (error) {
        console.error('[Auth] Erro na inicialização da sessão:', error);
      } finally {
        if (mounted) {
          // Libera a interface imediatamente
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[Auth] Evento detectado: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            // Chamada em segundo plano: NÃO usamos await aqui
            fetchUserProfile(currentSession.user.id);
          }
          // Libera a interface imediatamente após definir o usuário
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setRoles([]);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
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
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth] Erro ao sair:', error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id);
  };

  const hasPermission = (permission: string) => {
    if (roles.includes('admin')) return true;
    return !!userProfile?.permissions?.[permission];
  };

  const value = {
    session,
    user,
    userProfile,
    roles,
    isAdmin: roles.includes('admin'),
    isTeacher: roles.includes('teacher'),
    isStudent: roles.includes('student'),
    loading,
    signOut,
    refreshProfile,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-muted-foreground animate-pulse font-medium">Carregando portal...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};