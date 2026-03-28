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
    // Administrador Chefe sempre tem todas as permissões
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile) return false;
    const permissions = userProfile.permissions || {};
    return !!permissions[permission];
  };

  const fetchUserProfile = async (userId: string, currentUser: User) => {
    console.log(`[AuthProvider] Buscando perfil para: ${userId}`);
    
    // Aumentei o timeout para 5 segundos para conexões lentas
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );

    try {
      // Tenta buscar o usuário com timeout
      const { data: profile, error: profileError } = await Promise.race([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        timeoutPromise
      ]) as any;

      if (profileError) throw profileError;

      let finalProfile = profile;

      // Se não existir, cria o perfil
      if (!finalProfile) {
        console.log('[AuthProvider] Criando novo perfil...');
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

      // Busca permissões apenas se a tabela roles existir (evita o erro 404 travar o app)
      if (finalProfile?.role) {
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('permissions')
            .eq('name', finalProfile.role)
            .maybeSingle();
          
          if (!roleError && roleData) {
            finalProfile.permissions = roleData.permissions;
          }
        } catch (e) {
          console.warn('[AuthProvider] Tabela de cargos não encontrada ou inacessível.');
        }
      }

      // Força o cargo de admin para o email principal
      if (currentUser.email === CHIEF_ADMIN_EMAIL) {
        finalProfile = { ...finalProfile, role: 'admin' };
      }

      setUserProfile(finalProfile);
    } catch (error) {
      console.error('[AuthProvider] Erro ao carregar perfil:', error);
      // Fallback para permitir navegação
      setUserProfile({ 
        id: userId, 
        name: currentUser.email?.split('@')[0] || 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email,
permissions: {}
      });
    } finally {
      setLoading(false);
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
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error('[AuthProvider] Erro na inicialização:', e);
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
          setLoading(false);
        }
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