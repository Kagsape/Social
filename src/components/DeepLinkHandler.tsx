"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const setupDeepLink = async () => {
      // Listener para capturar URLs abertas pelo app
      App.addListener('appUrlOpen', async (data) => {
        console.log('[DeepLink] URL recebida:', data.url);
        
        try {
          const url = new URL(data.url);
          
          // O Supabase retorna os tokens no fragmento (#) da URL
          // Exemplo: com.ciep165.app://auth/callback#access_token=...&refresh_token=...
          const hash = url.hash.substring(1);
          
          if (hash) {
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              console.log('[DeepLink] Tokens encontrados, definindo sessão...');
              
              const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (!error) {
                showSuccess('Login realizado com sucesso!');
                navigate('/feed', { replace: true });
              } else {
                console.error('[DeepLink] Erro ao definir sessão:', error.message);
                showError('Erro ao processar login.');
              }
            }
          }
        } catch (err) {
          console.error('[DeepLink] Erro ao processar URL:', err);
        }
      });
    };

    setupDeepLink();

    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);

  return null;
};

export default DeepLinkHandler;