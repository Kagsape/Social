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

      if (!profile) {
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
        
        profileLoadedRef.current = userId;
        setUserProfile(finalProfile);
        
        // Marcar como online ao carregar perfil
        updateOnlineStatus(userId, true);
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil:', err);
    } finally {
      profileLoadingRef.current = null;
    }
  }, [updateOnlineStatus]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initialize = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
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
        const currentUser = currentSession?.user ?? null;
        
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          setSession(currentSession);
          setUser(currentUser);
          
          if (currentUser && profileLoadedRef.current !== currentUser.id) {
            fetchUserProfile(currentUser.id, currentUser);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          if (user) updateOnlineStatus(user.id, false);
          setSession(null);
          setUser(null);
          setUserProfile(null);
          profileLoadedRef.current = null;
          profileLoadingRef.current = null;
          setLoading(false);
        }
      }
    );

    // Gerenciar status online ao fechar a aba ou mudar visibilidade
    const handleVisibilityChange = () => {
      if (user) {
        updateOnlineStatus(user.id, document.visibilityState === 'visible');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchUserProfile, updateOnlineStatus, user]);

  const signOut = async () => {
    if (user) await updateOnlineStatus(user.id, false);
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