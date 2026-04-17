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

  const fetchUserProfile = useCallback(async (userId: string, authUser: User) => {
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        // Auto-provisionamento se o perfil não existir na tabela users
        const metadata = authUser.user_metadata;
        const { data: newProfile, error: insertError } = await supabase.from('users').insert({
          id: userId,
          name: metadata?.name || authUser.email?.split('@')[0],
          email: authUser.email,
          role: metadata?.role || 'student',
          student_id: metadata?.student_id || null,
          teacher_id: metadata?.teacher_id || null,
        }).select().single();

        if (insertError) throw insertError;
        setUserProfile(newProfile);
        setRoles([newProfile.role]);
      } else {
        setUserProfile(profile);
        setRoles([profile.role]);
      }
    } catch (err: any) {
      console.error("[AuthProvider] Erro ao carregar perfil:", err.message);
      // Não travamos o app se o perfil falhar, apenas limpamos o perfil
      setUserProfile(null);
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            await fetchUserProfile(initialSession.user.id, initialSession.user);
          }
        }
      } catch (error: any) {
        console.error("[AuthProvider] Erro na inicialização:", error.message);
        if (mounted) setAuthError(error.message);
      } finally {
        // GARANTIA: O loading sempre termina aqui na montagem inicial
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        // Se houver mudança de estado, mostramos o loading brevemente para sincronizar
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setLoading(true);
          try {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            if (currentSession?.user) {
              await fetchUserProfile(currentSession.user.id, currentSession.user);
            }
          } catch (err) {
            console.error("[AuthProvider] Erro no evento de auth:", err);
          } finally {
            if (mounted) setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setRoles([]);
          if (mounted) setLoading(false);
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
    } catch (err) {
      console.error("Erro ao sair:", err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
      try {
        await fetchUserProfile(user.id, user);
      } finally {
        setLoading(false);
      }
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