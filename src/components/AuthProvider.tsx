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

const AUTH_TIMEOUT_MS = 7000;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchUserProfileBackground = useCallback(async (userId: string, authUser: User) => {
    try {
      // Tenta buscar o perfil existente
      const { data: profile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error("[Auth:Profile] Erro na busca:", fetchError.message);
        return;
      }

      if (profile) {
        setUserProfile(profile);
        setRoles([profile.role]);
      } else {
        // Se não existe, cria usando UPSERT para evitar erro de chave duplicada
        const metadata = authUser.user_metadata;
        const { data: newProfile, error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            name: metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
            email: authUser.email,
            role: metadata?.role || 'student',
            student_id: metadata?.student_id || null,
            teacher_id: metadata?.teacher_id || null,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
          .select()
          .maybeSingle();

        if (upsertError) {
          // Se ainda der erro de duplicidade na matrícula, ignoramos aqui para não travar o app
          console.warn("[Auth:Profile] Aviso no upsert:", upsertError.message);
        }

        if (newProfile) {
          setUserProfile(newProfile);
          setRoles([newProfile.role]);
        }
      }
    } catch (err) {
      console.error("[Auth:Profile] Erro crítico:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    timeoutRef.current = setTimeout(() => {
      if (isMounted && loading) {
        setAuthError("O servidor demorou muito para responder. Verifique sua conexão.");
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchUserProfileBackground(initialSession.user.id, initialSession.user);
          }
          setLoading(false);
        }
      } catch (error: any) {
        if (isMounted) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setAuthError(error.message || "Erro ao inicializar autenticação.");
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchUserProfileBackground(currentSession.user.id, currentSession.user);
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
      await fetchUserProfileBackground(user.id, user);
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