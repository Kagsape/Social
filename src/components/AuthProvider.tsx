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

  const fetchUserProfile = useCallback(async (userId: string, authUser?: User) => {
    console.log('[Auth] Buscando perfil para:', userId);
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[Auth] Erro ao buscar perfil:', profileError.message);
        // Não travamos o login por erro de perfil, mas registramos
      }

      if (!profile && authUser) {
        // Auto-provisionamento se o perfil não existir
        const metadata = authUser.user_metadata;
        await supabase.from('users').insert({
          id: userId,
          name: metadata?.name || authUser.email?.split('@')[0],
          email: authUser.email,
          role: metadata?.role || 'student',
          student_id: metadata?.student_id || null,
          teacher_id: metadata?.teacher_id || null,
        });
      }

      setUserProfile(profile || null);
      if (profile?.role) setRoles([profile.role]);
    } catch (err) {
      console.error('[Auth:Profile] Erro crítico:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          setAuthError(`Erro de conexão com o banco: ${error.message}`);
          setLoading(false);
          return;
        }

        if (mounted && initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id, initialSession.user);
        }
      } catch (error: any) {
        setAuthError(`Falha na inicialização: ${error.message}`);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log('[Auth] Evento:', event);

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
    );

    // Timeout de segurança: Se em 10 segundos não carregar, avisamos o usuário
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        setAuthError("O sistema está demorando muito para responder. Isso pode ser um problema de conexão ou configuração do banco.");
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
    setLoading(true);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id, user);
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