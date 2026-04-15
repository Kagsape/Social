"use client";

import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Listener para capturar URLs abertas pelo app (Deep Links)
    const setupDeepLink = async () => {
      App.addListener('appUrlOpen', async (data) => {
        console.log('[DeepLink] URL recebida:', data.url);
        
        // O Supabase retorna os tokens no fragmento (#) da URL
        const url = new URL(data.url);
        const hash = url.hash.substring(1); // Remove o '#'
        
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
              navigate('/feed');
            } else {
              console.error('[DeepLink] Erro ao definir sessão:', error.message);
            }
          }
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