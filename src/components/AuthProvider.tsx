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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Auth: Erro ao buscar perfil:', error);
      }

      if (!data) {
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
          if (insertError.code === '23505' || insertError.code === '409') {
            const { data: retryData } = await supabase.from('users').select('*').eq('id', userId).single();
            if (retryData) setUserProfile(retryData);
          } else {
            console.error('Auth: Erro ao inserir perfil:', insertError);
          }
        } else {
          setUserProfile(newData);
        }
      } else {
        setUserProfile(data);
      }
    } catch (error) {
      console.warn('Auth: Usando perfil básico devido a erro:', error);
      setUserProfile({
        id: userId,
        name: currentUser.user_metadata?.name || 'Usuário',
        role: 'student'
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    // Aumentado para 10 segundos para dar mais tempo ao Supabase em conexões lentas
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth: Tempo limite de 10s atingido. Forçando carregamento...');
        setLoading(false);
      }
    }, 10000);

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        if (!mounted) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser.id, currentUser);
        }
      } catch (error) {
        console.error('Auth: Erro na inicialização:', error);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          await fetchUserProfile(currentUser.id, currentUser);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
        clearTimeout(safetyTimer);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
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