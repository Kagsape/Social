"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, currentUser: User) => {
    const startTime = performance.now();
    console.log(`[Auth] Iniciando busca de perfil para: ${userId}`);
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const duration = (performance.now() - startTime).toFixed(2);
      
      if (error) {
        console.error(`[Auth] Erro na consulta da tabela 'users' (${duration}ms):`, error);
        setUserProfile({ id: userId, name: currentUser.email?.split('@')[0], role: 'student' });
        return;
      }

      if (!data) {
        console.log(`[Auth] Perfil não encontrado após ${duration}ms. Tentando criar...`);
        const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.user_metadata?.role || 'student'
          })
          .select()
          .single();

        if (insertError) {
          console.error('[Auth] Erro ao inserir novo perfil:', insertError);
          setUserProfile({ id: userId, name: currentUser.email?.split('@')[0], role: 'student' });
        } else {
          console.log('[Auth] Novo perfil criado com sucesso.');
          setUserProfile(newData);
        }
      } else {
        console.log(`[Auth] Perfil carregado com sucesso em ${duration}ms.`);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('[Auth] Exceção inesperada em fetchUserProfile:', error);
      setUserProfile({ id: userId, name: 'Usuário', role: 'student' });
    }
  };

  useEffect(() => {
    let mounted = true;
    const initStartTime = performance.now();

    const initializeAuth = async () => {
      console.log('[Auth] Inicializando getSession...');
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        const duration = (performance.now() - initStartTime).toFixed(2);
        
        if (error) {
          console.error(`[Auth] Erro em getSession (${duration}ms):`, error);
          if (mounted) setLoading(false);
          return;
        }

        console.log(`[Auth] getSession concluído em ${duration}ms. Sessão ativa:`, !!initialSession);
        
        if (!mounted) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          fetchUserProfile(currentUser.id, currentUser);
        }
      } catch (error) {
        console.error('[Auth] Exceção em initializeAuth:', error);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[Auth] Evento onAuthStateChange: ${event}`);
        if (!mounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          fetchUserProfile(currentUser.id, currentUser);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log('[Auth] Executando signOut...');
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id, user);
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};