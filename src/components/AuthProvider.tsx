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
  
  // Refs para controle de fluxo e evitar loops
  const initializedRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    // Evita buscar o mesmo perfil repetidamente se já estiver carregado ou em processo
    if (lastFetchedUserIdRef.current === userId && userProfile) {
      return;
    }

    try {
      console.log('[Auth] fetchUserProfile iniciado para:', userId);
      lastFetchedUserIdRef.current = userId;
      
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
        
        // Garantia extra para o admin chefe
        if (currentUser.email === CHIEF_ADMIN_EMAIL) {
          finalProfile.role = 'admin';
        }
        
        console.log('[Auth] Perfil carregado com sucesso');
        setUserProfile(finalProfile);
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
      lastFetchedUserIdRef.current = null; // Permite tentar novamente em caso de erro
    }
  }, [userProfile]);

  useEffect(() => {
    // Garante que a subscrição e inicialização ocorram apenas uma vez por montagem do Provider
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('[Auth] Inicializando AuthProvider...');

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          console.log('[Auth] Sessão inicial detectada');
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id, initialSession.user);
        }
      } catch (error) {
        console.error('[Auth] Erro ao obter sessão inicial:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[Auth] onAuthStateChange disparado:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentUser = currentSession?.user ?? null;
          setSession(currentSession);
          setUser(currentUser);
          
          if (currentUser) {
            await fetchUserProfile(currentUser.id, currentUser);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          lastFetchedUserIdRef.current = null;
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signOut = async () => {
    console.log('[Auth] Executando signOut manual');
    setLoading(true);
    await supabase.auth.signOut();
    // O onAuthStateChange cuidará de limpar o estado
  };

  const refreshProfile = async () => {
    if (user) {
      console.log('[Auth] refreshProfile manual solicitado');
      lastFetchedUserIdRef.current = null; // Força a busca novamente
      await fetchUserProfile(user.id, user);
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