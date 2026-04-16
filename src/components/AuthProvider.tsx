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
      // 1. Buscar perfil básico na tabela "users"
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth:Profile] ❌ Erro ao buscar usuário:', profileError.message);
      }

      // Fallback para criação automática se o perfil não existir
      if (!profile && authUser) {
        console.warn('[Auth:Profile] ⚠️ Perfil não encontrado. Criando registro...');
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
        
        if (!insertError) profile = newProfile;
      }

      // 2. Buscar cargos (RBAC) em duas etapas para evitar travamentos de relacionamento
      let rolesList: string[] = [];
      try {
        // Etapa A: Buscar IDs de cargos na tabela de ligação
        const { data: userRolesData, error: urError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', userId);

        if (urError) throw urError;

        if (userRolesData && userRolesData.length > 0) {
          const roleIds = userRolesData.map(ur => ur.role_id);
          
          // Etapa B: Buscar nomes dos cargos na tabela roles
          const { data: rolesData, error: rError } = await supabase
            .from('roles')
            .select('name')
            .in('id', roleIds);
          
          if (rError) throw rError;
          rolesList = rolesData?.map(r => r.name) || [];
        }
      } catch (e: any) {
        console.warn('[Auth:Profile] ⚠️ Falha ao buscar cargos RBAC:', e.message);
      }

      // Mesclar cargo fixo da coluna 'role' do perfil
      if (profile?.role && !rolesList.includes(profile.role)) {
        rolesList.push(profile.role);
      }
      
      setRoles(rolesList);

      // 3. Buscar permissões baseadas nos cargos encontrados
      if (profile) {
        let mergedPermissions = {};
        try {
          if (rolesList.length > 0) {
            const { data: permissionsData } = await supabase
              .from('roles')
              .select('permissions')
              .in('name', rolesList);
            
            mergedPermissions = permissionsData?.reduce((acc, curr) => ({
              ...acc,
              ...(curr.permissions || {})
            }), {}) || {};
          }
        } catch (e: any) {
          console.warn('[Auth:Profile] ⚠️ Erro ao carregar permissões:', e.message);
        }

        setUserProfile({ ...profile, permissions: mergedPermissions });
        console.log('%c[Auth:Profile] ✅ Sincronização concluída.', 'color: #10b981; font-weight: bold');
      }
    } catch (err) {
      console.error('[Auth:Profile] 💥 Erro crítico no fetchUserProfile:', err);
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
            await fetchUserProfile(initialSession.user.id, initialSession.user);
          }
        }
      } catch (error) {
        console.error('[Auth:Init] Erro:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id, currentSession.user);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
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
    try {
      setLoading(true);
      await supabase.auth.signOut();
    } catch (error) {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
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