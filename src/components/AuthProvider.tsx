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
    console.log('[AuthProvider] fetchUserProfile iniciado para:', userId);
    try {
      // 1. Busca o perfil na tabela 'users'
      console.log('[AuthProvider] Buscando perfil na tabela users...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('[AuthProvider] Erro ao buscar perfil:', profileError);
        throw profileError;
      }

      let finalProfile = profile;

      // 2. Se o perfil não existir, cria um novo
      if (!finalProfile) {
        console.log('[AuthProvider] Perfil não encontrado, criando novo perfil...');
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
          console.error('[AuthProvider] Erro ao criar perfil:', insertError);
          throw insertError;
        }
        finalProfile = newProfile;
        console.log('[AuthProvider] Novo perfil criado:', finalProfile);
      } else {
        console.log('[AuthProvider] Perfil encontrado:', finalProfile);
      }

      // 3. Tenta buscar permissões na tabela 'roles'
      finalProfile.permissions = {};
      if (finalProfile?.role) {
        console.log('[AuthProvider] Buscando permissões para o cargo:', finalProfile.role);
        try {
          const { data: roleData, error: roleError } = await supabase
            .from('roles')
            .select('permissions')
            .eq('name', finalProfile.role)
            .maybeSingle();
          
          if (roleError) {
            console.warn('[AuthProvider] Erro ao buscar permissões do cargo:', roleError);
          } else if (roleData) {
            finalProfile.permissions = roleData.permissions || {};
            console.log('[AuthProvider] Permissões carregadas:', finalProfile.permissions);
          } else {
            console.log('[AuthProvider] Nenhuma permissão específica encontrada para o cargo.');
          }
        } catch (e) {
          console.warn('[AuthProvider] Falha ao verificar tabela de roles:', e);
        }
      }

      // 4. Força o cargo de admin para o email principal
      if (currentUser.email === CHIEF_ADMIN_EMAIL) {
        console.log('[AuthProvider] Forçando cargo de admin para o email principal');
        finalProfile = { ...finalProfile, role: 'admin' };
      }

      setUserProfile(finalProfile);
      console.log('[AuthProvider] fetchUserProfile concluído com sucesso');
    } catch (error) {
      console.error('[AuthProvider] fetchUserProfile falhou:', error);
      // Fallback seguro para não travar o app
      setUserProfile({ 
        id: userId, 
        name: currentUser.email?.split('@')[0] || 'Usuário', 
        role: currentUser.email === CHIEF_ADMIN_EMAIL ? 'admin' : 'student',
        email: currentUser.email,
        permissions: {}
      });
    } finally {
      console.log('[AuthProvider] Definindo loading como false no fetchUserProfile');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      console.log('[AuthProvider] initializeAuth iniciado');
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (!mounted) {
          console.log('[AuthProvider] initializeAuth: componente desmontado, abortando');
          return;
        }

        if (error) {
          console.error('[AuthProvider] Erro no getSession:', error);
          setLoading(false);
          return;
        }

        console.log('[AuthProvider] Sessão encontrada:', !!initialSession);
        setSession(initialSession);
        const currentUser = initialSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log('[AuthProvider] Usuário logado, buscando perfil...');
          await fetchUserProfile(currentUser.id, currentUser);
        } else {
          console.log('[AuthProvider] Nenhum usuário logado, definindo loading como false');
          setLoading(false);
        }
      } catch (e) {
        console.error('[AuthProvider] Exceção no initializeAuth:', e);
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('[AuthProvider] Evento onAuthStateChange:', event);
        if (!mounted) return;

        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          console.log('[AuthProvider] Usuário detectado na mudança de estado, buscando perfil...');
          setLoading(true);
          await fetchUserProfile(currentUser.id, currentUser);
        } else {
          console.log('[AuthProvider] Usuário deslogado na mudança de estado');
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
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    if (user) {
      setLoading(true);
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