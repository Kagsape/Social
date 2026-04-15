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
    console.log(`[Auth:Profile] Iniciando busca de perfil para: ${userId}`);
    try {
      // 1. Buscar perfil básico do usuário
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth:Profile] Erro na tabela users:', profileError.message);
      } else {
        console.log('[Auth:Profile] Dados básicos carregados:', profile ? 'Sim' : 'Não encontrado');
      }

      // 2. Buscar cargos vinculados ao usuário
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('[Auth:Profile] Erro na tabela user_roles:', rolesError.message);
      }

      const rolesList = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
      console.log('[Auth:Profile] Cargos identificados:', rolesList);
      setRoles(rolesList);

      if (profile) {
        // 3. Buscar permissões baseadas nos cargos
        const { data: roleData, error: permError } = await supabase
          .from('roles')
          .select('permissions')
          .in('name', rolesList);
        
        if (permError) {
          console.error('[Auth:Profile] Erro ao buscar permissões:', permError.message);
        }

        const mergedPermissions = roleData?.reduce((acc, curr) => ({
          ...acc,
          ...(curr.permissions || {})
        }), {}) || {};

        console.log('[Auth:Profile] Permissões mescladas com sucesso');
        setUserProfile({ ...profile, permissions: mergedPermissions });
      }
    } catch (err) {
      console.error('[Auth:Profile] Erro crítico inesperado:', err);
    } finally {
      console.log('[Auth:Profile] Finalizado processo de segundo plano');
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log('[Auth:Init] Iniciando verificação de sessão...');
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth:Init] Erro ao recuperar sessão inicial:', sessionError.message);
        }

        if (mounted) {
          if (initialSession) {
            console.log('[Auth:Init] Sessão encontrada para:', initialSession.user.email);
            setSession(initialSession);
            setUser(initialSession.user);
            fetchUserProfile(initialSession.user.id);
          } else {
            console.log('[Auth:Init] Nenhuma sessão ativa encontrada');
          }
        }
      } catch (error) {
        console.error('[Auth:Init] Erro fatal na inicialização:', error);
      } finally {
        if (mounted) {
          console.log('[Auth:Init] Liberando interface (setLoading: false)');
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[Auth:Event] Evento detectado: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          console.log('[Auth:Event] Usuário autenticado:', currentSession?.user?.email);
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            fetchUserProfile(currentSession.user.id);
          }
          
          console.log('[Auth:Event] Liberando interface após login/refresh');
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth:Event] Usuário deslogado');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setRoles([]);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          console.log('[Auth:Event] Sessão inicial processada');
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
    console.log('[Auth:Action] Iniciando logout...');
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth:Action] Erro ao deslogar:', error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('[Auth:Action] Atualizando perfil manualmente...');
      await fetchUserProfile(user.id);
    }
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