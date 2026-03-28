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
    if (user?.email === CHIEF_ADMIN_EMAIL) return true;
    if (!userProfile) return false;
    const permissions = userProfile.permissions || {};
    return !!permissions[permission];
  };

  const fetchUserProfile = async (userId: string, currentUser: User) => {
    console.log(`[AuthProvider] 1. Iniciando fetchUserProfile para: ${userId}`);
    
    try {
      console.log(`[AuthProvider] 2. Executando select na tabela 'users'...`);
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[AuthProvider] 2.1 Erro na consulta select:', profileError);
        throw profileError;
      }

      console.log(`[AuthProvider] 3. Resultado do select:`, profile ? 'Perfil encontrado' : 'Perfil não encontrado');
      let finalProfile = profile;

      if (!finalProfile) {
        console.log('[AuthProvider] 4. Criando novo perfil...');
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
        
        if (insertError) {
          console.error('[AuthProvider] 4.1 Erro ao inserir perfil:', insertError);
          throw insertError;
        }
        console.log('[AuthProvider] 4.2 Perfil criado com sucesso.');
        finalProfile = newProfile;
      }

      if (finalProfile?.role) {
        console.log(`[AuthProvider] 5. Buscando permissões para o cargo: ${finalProfile.role}`);
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('permissions')
          .eq('name', finalProfile.role)
          .maybeSingle();
        
        if (roleError) {
          console.warn('[AuthProvider] 5.1 Erro ao buscar permissões:', roleError);
        } else if (roleData) {
          finalProfile.permissions = roleData.permissions;
          console.log('[AuthProvider] 5.2 Permissões carregadas.');
        }
      }

      if (currentUser.email === CHIEF_ADMIN_EMAIL && finalProfile) {
        finalProfile.role = 'admin';
      }

      console.log('[AuthProvider] 6. Definindo userProfile no estado.');
      setUserProfile(finalProfile);
    } catch (error) {
      console.error('[AuthProvider] ERRO CRÍTICO:', error);
      // Fallback imediato para não travar o app
      setUserProfile({ 
        id: userId, 
        name: currentUser.email?.split('@')[0] || 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email
      });
    } finally {
      console.log('[AuthProvider] 7. Finalizando loading.');
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('[AuthProvider] 0. Inicializando Auth...');
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthProvider] Erro ao obter sessão:', sessionError);
          if (mounted) setLoading(false);
          return;
        }

        if (!mounted) return;

        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log('[AuthProvider] Usuário logado:', currentUser.email);
          await fetchUserProfile(currentUser.id, currentUser);
        } else {
          console.log('[AuthProvider] Nenhum usuário logado.');
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
        console.log(`[AuthProvider] Evento Auth: ${event}`);
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