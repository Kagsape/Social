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
    // Se for o administrador chefe, sempre tem permissão total
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    
    if (!userProfile) return false;
    
    // Verifica permissões baseadas no cargo (roles)
    const permissions = userProfile.permissions || {};
    return !!permissions[permission];
  };

  const fetchUserProfile = async (userId: string, currentUser: User) => {
    try {
      // 1. Busca o perfil do usuário sem o join que estava falhando
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      let finalProfile = profile;

      // 2. Se o perfil não existir, cria um novo
      if (!finalProfile) {
        const { data: newProfile, error: insertError } = await supabase
          .from('users')
          .insert({
            id: userId,
            name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
            email: currentUser.email,
            role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : (currentUser.user_metadata?.role || 'student')
          })
          .select('*')
          .single();

        if (insertError) throw insertError;
        finalProfile = newProfile;
      } 
      // 3. Promoção automática para o Chief Admin se necessário
      else if (currentUser.email === CHIEF_ADMIN_EMAIL && finalProfile.role !== 'admin') {
        const { data: updatedProfile } = await supabase
          .from('users')
          .update({ role: 'admin' })
          .eq('id', userId)
          .select('*')
          .single();
        
        if (updatedProfile) finalProfile = updatedProfile;
      }

      // 4. Busca as permissões do cargo separadamente para evitar erro de join
      if (finalProfile?.role) {
        const { data: roleData } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        if (roleData) {
          finalProfile.permissions = roleData.permissions;
        }
      }

      // Garantia para o Chief Admin no estado local
      if (currentUser.email === CHIEF_ADMIN_EMAIL && finalProfile) {
        finalProfile.role = 'admin';
      }

      setUserProfile(finalProfile || { 
        id: userId, 
        name: 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email
      });
    } catch (error) {
      console.error('[Auth] Erro ao carregar perfil:', error);
      // Fallback seguro
      setUserProfile({ 
        id: userId, 
        name: currentUser.email?.split('@')[0] || 'Usuário', 
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

        if (currentUser) {
          await fetchUserProfile(currentUser.id, currentUser);
        }
        
        setLoading(false);
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
          await fetchUserProfile(currentUser.id, currentUser);
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