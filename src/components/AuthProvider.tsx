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
    console.log('[Auth] Buscando perfil para:', userId);
    try {
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth] Erro ao buscar perfil:', profileError.message);
      }

      // Criação automática do perfil na tabela 'users' se não existir
      if (!profile && authUser) {
        console.log('[Auth] Perfil não encontrado, criando...');
        const metadata = authUser.user_metadata;
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: metadata?.name || authUser.email?.split('@')[0],
            email: authUser.email,
            role: metadata?.role || 'student',
            student_id: metadata?.student_id || null,
            teacher_id: metadata?.teacher_id || null,
            avatar_url: metadata?.avatar_url
          })
          .select()
          .single();
        
        if (insertError) {
          console.error('[Auth] Erro ao criar perfil:', insertError.message);
        } else {
          profile = newProfile;
        }
      }

      let rolesList: string[] = [];
      try {
        const { data: userRolesData } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', userId);

        if (userRolesData && userRolesData.length > 0) {
          const roleIds = userRolesData.map(ur => ur.role_id);
          const { data: rolesData } = await supabase
            .from('roles')
            .select('name')
            .in('id', roleIds);
          
          rolesList = rolesData?.map(r => r.name) || [];
        }
      } catch (roleErr) {
        console.warn('[Auth] Erro ao buscar roles extras:', roleErr);
      }

      if (profile?.role && !rolesList.includes(profile.role)) {
        rolesList.push(profile.role);
      }
      
      setRoles(rolesList);
      setUserProfile(profile || null);
      console.log('[Auth] Perfil carregado com sucesso');
    } catch (err) {
      console.error('[Auth:Profile] Erro crítico:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      console.log('[Auth] Inicializando sessão...');
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[Auth] Erro ao obter sessão inicial:', error.message);
        }

        if (mounted) {
          if (initialSession) {
            console.log('[Auth] Sessão encontrada');
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchUserProfile(initialSession.user.id, initialSession.user);
          } else {
            console.log('[Auth] Nenhuma sessão ativa');
          }
        }
      } catch (error) {
        console.error('[Auth:Init] Erro inesperado:', error);
      } finally {
        if (mounted) {
          console.log('[Auth] Finalizando estado de carregamento');
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] Evento de mudança:', event);
        if (mounted) {
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
          }
        }
      }
    );

    // Timeout de segurança: se em 10 segundos não carregar, libera a tela
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Timeout de segurança atingido. Forçando fim do carregamento.');
        setLoading(false);
      }
    }, 10000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
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
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};