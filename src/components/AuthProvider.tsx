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

  // Função segura para buscar ou criar perfil
  const fetchUserProfile = useCallback(async (userId: string, authUser: User) => {
    try {
      // 1. Tenta buscar o perfil
      const { data: profile, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error("[Auth:Profile] Erro na busca:", fetchError.message);
        return null;
      }

      // 2. Se o perfil não existe, tenta criar (Auto-provisionamento)
      if (!profile) {
        console.log("[Auth:Profile] Perfil não encontrado, criando...");
        const metadata = authUser.user_metadata;
        
        const { data: newProfile, error: insertError } = await supabase
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
          .maybeSingle();

        if (insertError) {
          console.error("[Auth:Profile] Erro ao auto-criar perfil:", insertError.message);
          return null;
        }
        return newProfile;
      }

      return profile;
    } catch (err) {
      console.error("[Auth:Profile] Erro crítico inesperado:", err);
      return null;
    }
  }, []);

  // Inicialização do App
  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        // Busca sessão inicial
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (isMounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          
          if (initialSession?.user) {
            const profile = await fetchUserProfile(initialSession.user.id, initialSession.user);
            if (isMounted) {
              setUserProfile(profile);
              setRoles(profile?.role ? [profile.role] : []);
            }
          }
        }
      } catch (error: any) {
        console.error("[Auth:Init] Falha na inicialização:", error.message);
        if (isMounted) setAuthError(error.message);
      } finally {
        // GARANTIA ABSOLUTA: O loading termina aqui, aconteça o que acontecer
        if (isMounted) setLoading(false);
      }
    };

    initialize();

    // Ouvinte de mudanças de estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          
          if (currentSession?.user) {
            // Não bloqueamos o app aqui, apenas atualizamos o perfil em background
            const profile = await fetchUserProfile(currentSession.user.id, currentSession.user);
            if (isMounted) {
              setUserProfile(profile);
              setRoles(profile?.role ? [profile.role] : []);
              setLoading(false); // Garante fim do loading após login
            }
          }
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
      const profile = await fetchUserProfile(user.id, user);
      setUserProfile(profile);
      setRoles(profile?.role ? [profile.role] : []);
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