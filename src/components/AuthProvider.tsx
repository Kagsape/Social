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
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] [AUTH_DEBUG] 🔍 Iniciando busca de perfil para ID:`, userId);
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error(`[${timestamp}] [AUTH_DEBUG] ❌ Erro ao buscar perfil na tabela 'users':`, profileError);
        return;
      }

      if (!profile) {
        console.warn(`[${timestamp}] [AUTH_DEBUG] ⚠️ Perfil não encontrado na tabela 'users'. Tentando auto-provisionamento...`);
        const metadata = authUser?.user_metadata;
        
        const { data: newProfile, error: insertError } = await supabase.from('users').insert({
          id: userId,
          name: metadata?.name || authUser?.email?.split('@')[0],
          email: authUser?.email,
          role: metadata?.role || 'student',
          student_id: metadata?.student_id || null,
          teacher_id: metadata?.teacher_id || null,
        }).select().single();

        if (insertError) {
          console.error(`[${timestamp}] [AUTH_DEBUG] ❌ Falha ao criar perfil automático:`, insertError);
        } else {
          console.log(`[${timestamp}] [AUTH_DEBUG] ✅ Perfil criado com sucesso:`, newProfile);
          setUserProfile(newProfile);
          if (newProfile.role) setRoles([newProfile.role]);
        }
      } else {
        console.log(`[${timestamp}] [AUTH_DEBUG] ✅ Perfil carregado:`, profile);
        setUserProfile(profile);
        if (profile.role) setRoles([profile.role]);
      }
    } catch (err) {
      console.error(`[${timestamp}] [AUTH_DEBUG] 💥 Erro crítico no fetchUserProfile:`, err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const timestamp = new Date().toLocaleTimeString();

    const initialize = async () => {
      console.log(`[${timestamp}] [AUTH_DEBUG] 🚀 Inicializando AuthProvider...`);
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error(`[${timestamp}] [AUTH_DEBUG] ❌ Erro ao obter sessão inicial:`, error);
          setAuthError(`Erro de conexão: ${error.message}`);
          setLoading(false);
          return;
        }

        if (mounted) {
          if (initialSession) {
            console.log(`[${timestamp}] [AUTH_DEBUG] 🔑 Sessão encontrada para:`, initialSession.user.email);
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchUserProfile(initialSession.user.id, initialSession.user);
          } else {
            console.log(`[${timestamp}] [AUTH_DEBUG] ℹ️ Nenhuma sessão ativa encontrada.`);
          }
        }
      } catch (error: any) {
        console.error(`[${timestamp}] [AUTH_DEBUG] ❌ Falha catastrófica na inicialização:`, error);
        setAuthError(`Falha na inicialização: ${error.message}`);
      } finally {
        if (mounted) {
          console.log(`[${timestamp}] [AUTH_DEBUG] 🏁 Finalizando estado de carregamento.`);
          setLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log(`[${new Date().toLocaleTimeString()}] [AUTH_DEBUG] 🔄 Evento de Auth:`, event);

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

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    console.log(`[${new Date().toLocaleTimeString()}] [AUTH_DEBUG] 🚪 Saindo...`);
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