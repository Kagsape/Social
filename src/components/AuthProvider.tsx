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
  authError: string | null;
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
  const [authError, setAuthError] = useState<string | null>(null);

  // Função para buscar perfil em background (NÃO BLOQUEANTE)
  const fetchUserProfileBackground = useCallback((userId: string, authUser: User) => {
    supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data: profile, error: fetchError }) => {
        if (fetchError) {
          console.error("[Auth:Profile] Erro na busca:", fetchError.message);
          return;
        }

        if (profile) {
          setUserProfile(profile);
          setRoles([profile.role]);
        } else {
          // Se não existe, tenta criar em background
          const metadata = authUser.user_metadata;
          supabase
            .from('users')
            .insert({
              id: userId,
              name: metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
              email: authUser.email,
              role: metadata?.role || 'student',
              student_id: metadata?.student_id || null,
              teacher_id: metadata?.teacher_id || null,
            })
            .select()
            .maybeSingle()
            .then(({ data: newProfile }) => {
              if (newProfile) {
                setUserProfile(newProfile);
                setRoles([newProfile.role]);
              }
            });
        }
      })
      .catch(err => console.error("[Auth:Profile] Erro crítico:", err));
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // 1. Busca apenas a sessão (rápido e local se houver cache)
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          // 2. Se houver usuário, dispara a busca do perfil SEM AWAIT
          if (initialSession?.user) {
            fetchUserProfileBackground(initialSession.user.id, initialSession.user);
          }
        }
      } catch (error: any) {
        console.error("[Auth:Init] Erro:", error.message);
        if (isMounted) setAuthError(error.message);
      } finally {
        // 3. FINALIZA O LOADING IMEDIATAMENTE após checar a sessão
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            fetchUserProfileBackground(currentSession.user.id, currentSession.user);
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
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfileBackground]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setLoading(false);
  };

  const refreshProfile = async () => {
    if (user) {
      fetchUserProfileBackground(user.id, user);
    }
  };

  const value = {
    session,
    user,
    userProfile,
    roles,
    isAdmin: roles.includes('admin') || user?.email === 'xakatosh66@gmail.com',
    isTeacher: roles.includes('teacher') || user?.email === 'xakatosh66@gmail.com',
    isStudent: roles.includes('student'),
    loading,
    authError,
    signOut,
    refreshProfile,
    hasPermission: (p: string) => roles.includes('admin') || !!userProfile?.permissions?.[p]
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};