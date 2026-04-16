"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('[AuthCallback] Erro:', error.message);
          navigate('/login');
          return;
        }

        if (data.session) {
          console.log('[AuthCallback] Sessão ativa, redirecionando...');
          // Pequeno delay para garantir que o estado do AuthProvider seja atualizado
          setTimeout(() => navigate('/feed'), 500);
        } else {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
              subscription.unsubscribe();
              navigate('/feed');
            }
          });
        }
      } catch (err) {
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground animate-pulse font-medium">Finalizando seu acesso...</p>
      </div>
    </div>
  );
};

export default AuthCallback;