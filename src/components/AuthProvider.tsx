"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
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

// Tempo máximo de espera para o backend responder (7 segundos)
const AUTH_TIMEOUT_MS = 7000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Timeout de segurança para evitar loading infinito se o DNS/Rede falhar
    timeoutRef.current = setTimeout(() => {
      if (isMounted && loading) {
        console.error("[Auth:Timeout] O servidor demorou muito para responder.");
        setAuthError("Não foi possível conectar ao servidor. Verifique sua conexão ou se o serviço está online.");
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const initialize = async () => {
      try {
        // Tenta buscar a sessão com um catch para erros de rede imediatos
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession().catch(err => {
          throw new Error("Falha de conexão com o banco de dados (DNS/Rede).");
        });
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            fetchUserProfileBackground(initialSession.user.id, initialSession.user);
          }
          setLoading(false);
        }
      } catch (error: any) {
        console.error("[Auth:Init] Erro:", error.message);
        if (isMounted) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setAuthError(error.message || "Erro ao inicializar autenticação.");
          setLoading(false);
        }
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
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      subscription.unsubscribe();
    };
  }, [fetchUserProfileBackground]);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
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