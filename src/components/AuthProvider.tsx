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
    if (!userProfile) return false;
    
    // Chief Admin has all permissions
    if (userProfile.email === CHIEF_ADMIN_EMAIL) return true;
    
    // Check permissions from the role
    const roleData = Array.isArray(userProfile.roles) ? userProfile.roles[0] : userProfile.roles;
    const permissions = roleData?.permissions || {};
    return !!permissions[permission];
  };

  const fetchUserProfile = async (userId: string, currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*, roles(permissions)')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error(`[Auth] Erro na consulta:`, error);
        setUserProfile({ 
          id: userId, 
          name: currentUser.email?.split('@')[0], 
          role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
          email: currentUser.email
        });
        return;
      }

      let profileData = data;

      if (!profileData) {
        const { data: newData, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : (currentUser.user_metadata?.role || 'student')
          })
          .select('*, roles(permissions)')
          .single();

        if (!insertError) profileData = newData;
      } else if (currentUser.email === CHIEF_ADMIN_EMAIL && profileData.role !== 'admin') {
        // Promoção automática no banco
        const { data: updatedData } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select('*, roles(permissions)')
          .single();
        
        if (updatedData) profileData = updatedData;
      }

      // Garantia final no estado do React: se for o e-mail do chefe, o cargo É admin
      if (currentUser.email === CHIEF_ADMIN_EMAIL && profileData) {
        profileData.role = 'admin';
      }

      setUserProfile(profileData || { 
        id: userId, 
        name: 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email
      });
    } catch (error) {
      console.error('[Auth] Erro inesperado:', error);
      setUserProfile({ 
        id: userId, 
        name: 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          fetchUserProfile(currentUser.id, currentUser);
        }
      } catch (error) {
        if (mounted) setLoading(false);
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
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id, user);
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