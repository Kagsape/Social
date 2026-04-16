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

  const fetchUserProfile = useCallback(async (userId: string, authUser?: User) => {
    console.log(`%c[Auth:Profile] 🔄 Iniciando sincronização para: ${userId}`, 'color: #3b82f6; font-weight: bold');
    try {
      // 1. Buscar perfil básico
      console.log('[Auth:Profile] 🔍 Buscando na tabela "users"...');
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth:Profile] ❌ Erro ao buscar usuário:', profileError.message);
      }

      // 2. Fallback para usuários sem registro na tabela users
      if (!profile && authUser) {
        console.warn('[Auth:Profile] ⚠️ Perfil não encontrado no banco. Tentando criar registro automático...');
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
            email: authUser.email,
            role: authUser.user_metadata?.role || 'student',
            avatar_url: authUser.user_metadata?.avatar_url
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('[Auth:Profile] ❌ Falha ao criar perfil automático:', insertError.message);
        } else {
          console.log('[Auth:Profile] ✅ Perfil automático criado com sucesso.');
          profile = newProfile;
        }
      }

      // 3. Buscar cargos (RBAC)
      console.log('[Auth:Profile] 🔍 Buscando cargos (RBAC)...');
      let rolesList: string[] = [];
      try {
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('roles(name)')
          .eq('user_id', userId);
        
        if (rolesError) throw rolesError;
        rolesList = userRoles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [];
        console.log('[Auth:Profile] 🎭 Cargos encontrados via RBAC:', rolesList);
      } catch (e: any) {
        console.warn('[Auth:Profile] ⚠️ Tabela user_roles inacessível ou erro:', e.message);
      }

      // Mesclar cargo fixo do perfil
      if (profile?.role && !rolesList.includes(profile.role)) {
        rolesList.push(profile.role);
        console.log('[Auth:Profile] ➕ Cargo do perfil mesclado:', profile.role);
      }
      
      setRoles(rolesList);

      if (profile) {
        // 4. Buscar permissões
        console.log('[Auth:Profile] 🔍 Mapeando permissões detalhadas...');
        let mergedPermissions = {};
        try {
          const { data: roleData } = await supabase
            .from('roles')
            .select('permissions')
            .in('name', rolesList);
          
          mergedPermissions = roleData?.reduce((acc, curr) => ({
            ...acc,
            ...(curr.permissions || {})
          }), {}) || {};
          console.log('[Auth:Profile] 🛡️ Permissões carregadas:', Object.keys(mergedPermissions).length);
        } catch (e: any) {
          console.warn('[Auth:Profile] ⚠️ Erro ao carregar permissões:', e.message);
        }

        setUserProfile({ ...profile, permissions: mergedPermissions });
        console.log('%c[Auth:Profile] ✅ Sincronização concluída com sucesso.', 'color: #10b981; font-weight: bold');
      } else {
        console.error('[Auth:Profile] ❌ Falha crítica: Perfil não pôde ser carregado nem criado.');
      }
    } catch (err) {
      console.error('[Auth:Profile] 💥 Erro catastrófico na sincronização:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log('%c[Auth:Init] 🚀 Inicializando AuthProvider...', 'color: #8b5cf6; font-weight: bold');
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[Auth:Init] ❌ Erro ao recuperar sessão inicial:', sessionError.message);
        }

        if (mounted) {
          if (initialSession) {
            console.log('[Auth:Init] 🔑 Sessão ativa encontrada para:', initialSession.user.email);
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchUserProfile(initialSession.user.id, initialSession.user);
          } else {
            console.log('[Auth:Init] ℹ️ Nenhuma sessão ativa encontrada.');
          }
        }
      } catch (error) {
        console.error('[Auth:Init] ❌ Erro inesperado na inicialização:', error);
      } finally {
        if (mounted) {
          console.log('[Auth:Init] 🏁 Finalizando estado de carregamento.');
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`%c[Auth:Event] 🔔 Evento: ${event}`, 'color: #f59e0b; font-weight: bold');
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id, currentSession.user);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth:Event] 🚪 Usuário saiu do sistema.');
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setRoles([]);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION' && !currentSession) {
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
    console.log('[Auth:Action] 📤 Iniciando logout...');
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('[Auth:Action] ❌ Erro ao sair:', error);
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    console.log('[Auth:Action] 🔄 Atualizando perfil manualmente...');
    if (user) await fetchUserProfile(user.id, user);
  };

  const isChiefAdmin = user?.email === 'xakatosh66@gmail.com';

  const hasPermission = (permission: string) => {
    if (isChiefAdmin || roles.includes('admin')) return true;
    return !!userProfile?.permissions?.[permission];
  };

  const value = {
    session,
    user,
    userProfile,
    roles,
    isAdmin: roles.includes('admin') || isChiefAdmin,
    isTeacher: roles.includes('teacher') || isChiefAdmin,
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
            <p className="text-muted-foreground animate-pulse font-medium">Sincronizando acessos...</p>
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