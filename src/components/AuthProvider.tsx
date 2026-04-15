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
  roles: string[];
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
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
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      // 1. Buscar perfil básico
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      // 2. Buscar múltiplos cargos do usuário
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('roles(name)')
        .eq('user_id', userId);

      const rolesList = userRoles?.map((ur: any) => ur.roles.name) || [];
      setRoles(rolesList);

      if (profile) {
        // Buscar permissões baseadas no cargo principal ou combinadas
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .in('name', rolesList);
        
        // Mesclar todas as permissões dos cargos que o usuário possui
        const mergedPermissions = roleData?.reduce((acc, curr) => ({
          ...acc,
          ...(curr.permissions || {})
        }), {}) || {};

        setUserProfile({ ...profile, permissions: mergedPermissions });
      }
    } catch (err) {
      console.error('[Auth] Erro ao carregar perfil e cargos:', err);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (initialSession) {
        setSession(initialSession);
        setUser(initialSession.user);
        await fetchUserProfile(initialSession.user.id);
      }
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setRoles([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const refreshProfile = async () => {
    if (user) await fetchUserProfile(user.id);
  };

  const hasPermission = (permission: string) => {
    if (roles.includes('admin')) return true;
    return !!userProfile?.permissions?.[permission];
  };

  const value = {
    session,
    user,
    userProfile,
    roles,
    isAdmin: roles.includes('admin'),
    isTeacher: roles.includes('teacher'),
    isStudent: roles.includes('student'),
    loading,
    signOut,
    refreshProfile,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};