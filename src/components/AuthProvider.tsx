"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';

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
  const navigate = useNavigate();

  const CHIEF_ADMIN_EMAIL = 'xakatosh66@gmail.com';
  
  const profileLoadingRef = useRef<string | null>(null);
  const profileLoadedRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateOnlineStatus = useCallback(async (userId: string, isOnline: boolean) => {
    try {
      await supabase
        .from('users')
        .update({ 
          is_online: isOnline, 
          last_seen: new Date().toISOString() 
        })
        .eq('id', userId);
    } catch (err) {
      console.error('[Auth] Erro ao atualizar status online:', err);
    }
  }, []);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const startHeartbeat = useCallback((userId: string) => {
    stopHeartbeat();
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus(userId, true);
      }
    }, 30000);
  }, [updateOnlineStatus, stopHeartbeat]);

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    if (profileLoadingRef.current === userId) return;
    profileLoadingRef.current = userId;
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let finalProfile = profile;

      if (!profile) {
        const { data: newProfile } = await supabase
          .from('users')
          .upsert({
            id: userId,
            name: currentUser.user_metadata?.name || 'Usuário',
            email: currentUser.email,
            role: currentUser.user_metadata?.role || 'student',
            student_id: currentUser.user_metadata?.student_id || null,
            teacher_id: currentUser.user_metadata?.teacher_id || null
          })
          .select('*')
          .single();
        finalProfile = newProfile;
      }

      if (finalProfile) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        finalProfile.permissions = roleData?.permissions || {};
        setUserProfile(finalProfile);
        profileLoadedRef.current = userId;
        
        updateOnlineStatus(userId, true);
        startHeartbeat(userId);
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
    } finally {
      profileLoadingRef.current = null;
    }
  }, [updateOnlineStatus, startHeartbeat]);

  // Função de Logout Centralizada
  const signOut = async () => {
    setLoading(true);
    try {
      // 1. Atualiza status para offline antes de sair
      if (user) {
        await updateOnlineStatus(user.id, false);
      }
      
      stopHeartbeat();

      // 2. Chama o signOut do Supabase
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // 3. Limpeza manual de estados (Garante atualização da UI mesmo se o listener demorar)
      setSession(null);
      setUser(null);
      setUserProfile(null);
      profileLoadedRef.current = null;

      // 4. Redirecionamento explícito
      navigate('/login', { replace: true });
      
    } catch (error: any) {
      console.error('[Auth] Erro ao sair:', error.message);
      showError('Erro ao encerrar sessão. Tente novamente.');
      
      // Força a limpeza local mesmo em caso de erro de rede
      setSession(null);
      setUser(null);
      setUserProfile(null);
      navigate('/login', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Inicialização da sessão
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        fetchUserProfile(initialSession.user.id, initialSession.user);
      }
      setLoading(false);
    };

    initAuth();

    // Listener Global de Eventos de Autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(`[Auth] Evento detectado: ${event}`);
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const currentUser = currentSession?.user ?? null;
          setSession(currentSession);
          setUser(currentUser);
          if (currentUser && profileLoadedRef.current !== currentUser.id) {
            fetchUserProfile(currentUser.id, currentUser);
          }
        } else if (event === 'SIGNED_OUT') {
          stopHeartbeat();
          setSession(null);
          setUser(null);
          setUserProfile(null);
          profileLoadedRef.current = null;
          navigate('/login', { replace: true });
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      stopHeartbeat();
    };
  }, [fetchUserProfile, stopHeartbeat, navigate]);

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const refreshProfile = async () => {
    if (user) {
      profileLoadedRef.current = null;
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