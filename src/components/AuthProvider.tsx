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
  
  const initializedRef = useRef(false);
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

  const startHeartbeat = useCallback((userId: string) => {
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    
    // Atualiza a cada 30 segundos para manter o "visto por último" fresco
    heartbeatIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updateOnlineStatus(userId, true);
      }
    }, 30000);
  }, [updateOnlineStatus]);

  const stopHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  }, []);

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    if (profileLoadingRef.current === userId || profileLoadedRef.current === userId) {
      return;
    }

    profileLoadingRef.current = userId;
    
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let finalProfile = profile;

      if (profile) {
        const metaRole = currentUser.user_metadata?.role;
        const needsUpdate = metaRole && profile.role !== metaRole && profile.role === 'student';
        
        if (needsUpdate) {
          const { data: updatedProfile } = await supabase
            .from('users')
            .update({ role: metaRole })
            .eq('id', userId)
            .select('*')
            .single();
          if (updatedProfile) finalProfile = updatedProfile;
        }
      }

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
        
        // Inicia o sistema de presença
        updateOnlineStatus(userId, true);
        startHeartbeat(userId);
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
    } finally {
      profileLoadingRef.current = null;
    }
  }, [updateOnlineStatus, startHeartbeat]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
      }
      setLoading(false);
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        const currentUser = currentSession?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
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
        }
      }
    );

    const handleVisibilityChange = () => {
      if (user) {
        const isVisible = document.visibilityState === 'visible';
        updateOnlineStatus(user.id, isVisible);
        if (isVisible) startHeartbeat(user.id);
        else stopHeartbeat();
      }
    };

    const handleBeforeUnload = () => {
      if (user) {
        // Tenta marcar como offline antes de fechar
        const blob = new Blob([JSON.stringify({ is_online: false, last_seen: new Date().toISOString() })], { type: 'application/json' });
        // Nota: Supabase não suporta beacon diretamente, mas o evento ajuda a disparar a última promise
        updateOnlineStatus(user.id, false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      stopHeartbeat();
    };
  }, [fetchUserProfile, updateOnlineStatus, startHeartbeat, stopHeartbeat, user]);

  const signOut = async () => {
    if (user) await updateOnlineStatus(user.id, false);
    stopHeartbeat();
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