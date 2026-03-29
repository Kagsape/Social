"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userProfile: any | null;
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
  const [loading, setLoading] = useState(true);

  const CHIEF_ADMIN_EMAIL = 'xakatosh66@gmail.com';
  
  // Travas de controle absoluto
  const initializedRef = useRef(false);
  const profileLoadingRef = useRef<string | null>(null); // ID do usuário sendo carregado
  const profileLoadedRef = useRef<string | null>(null);  // ID do usuário já carregado no estado

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    // Bloqueia se já estiver carregando este usuário ou se ele já estiver carregado
    if (profileLoadingRef.current === userId || profileLoadedRef.current === userId) {
      return;
    }

    profileLoadingRef.current = userId;
    
    try {
      console.log('[Auth] fetchUserProfile iniciado para:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let finalProfile = profile;

      if (!profile) {
        console.log('[Auth] Perfil não encontrado, criando novo para:', userId);
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .upsert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student'
          })
          .select('*')
          .single();
        
        if (!createError) finalProfile = newProfile;
      }

      if (finalProfile) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        finalProfile.permissions = roleData?.permissions || {};
        
        if (currentUser.email === CHIEF_ADMIN_EMAIL) {
          finalProfile.role = 'admin';
        }
        
        // Marca como carregado ANTES de atualizar o estado para evitar race conditions
        profileLoadedRef.current = userId;
        setUserProfile(finalProfile);
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
    } finally {
      profileLoadingRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Garante que o efeito de inicialização rode apenas uma vez
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('[Auth] Inicializando AuthProvider...');

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          // REMOVIDO: fetchUserProfile não deve ser chamado aqui para evitar concorrência
        }
      } catch (error) {
        console.error('[Auth] Erro ao obter sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        console.log('[Auth] onAuthStateChange:', event);
        
        const currentUser = currentSession?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession);
          setUser(currentUser);
          
          // Só busca o perfil se o usuário mudou ou ainda não foi carregado
          if (currentUser && profileLoadedRef.current !== currentUser.id) {
            // Chamada sem await para não bloquear o listener
            fetchUserProfile(currentUser.id, currentUser);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          profileLoadedRef.current = null;
          profileLoadingRef.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      profileLoadedRef.current = null;
      fetchUserProfile(user.id, user);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, userProfile, loading, signOut, refreshProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};