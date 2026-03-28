"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

  const hasPermission = (permission: string) => {
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile || !userProfile.permissions) return false;
    return !!userProfile.permissions[permission];
  };

  const fetchUserProfile = useCallback(async (userId: string, currentUser: User) => {
    try {
      console.log('[AuthProvider] Buscando perfil:', userId);
      
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      let finalProfile = profile;

      if (!profile) {
        console.log('[AuthProvider] Criando novo perfil...');
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
        // Carregar permissões do cargo
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        finalProfile.permissions = roleData?.permissions || {};
        
        // Garantir role admin para o email mestre
        if (currentUser.email === CHIEF_ADMIN_EMAIL) {
          finalProfile.role = 'admin';
        }
        
        setUserProfile(finalProfile);
      }
    } catch (err) {
      console.error('[AuthProvider] Erro ao carregar perfil:', err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserProfile(initialSession.user.id, initialSession.user);
        }
      } catch (error) {
        console.error('[AuthProvider] Erro na inicialização:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        console.log('[AuthProvider] Evento Auth:', event);

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          const currentUser = currentSession?.user ?? null;
          setUser(currentUser);
          
          if (currentUser) {
            await fetchUserProfile(currentUser.id, currentUser);
          }
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
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
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserProfile(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) {
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