"use client";

import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  const handleUrl = useCallback(async (urlString: string) => {
    console.log('[DeepLink] Processando URL:', urlString);
    
    try {
      const url = new URL(urlString);
      // O Supabase envia os tokens após o '#' (fragmento)
      const hash = url.hash.substring(1);

      if (hash) {
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          console.log('[DeepLink] Tokens detectados. Definindo sessão...');
          
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (!error) {
            showSuccess('Login realizado com sucesso!');
            navigate('/feed', { replace: true });
          } else {
            throw error;
          }
        }
      }
    } catch (err: any) {
      console.error('[DeepLink] Erro ao processar tokens:', err.message);
      showError('Falha ao processar autenticação.');
    }
  }, [navigate]);

  useEffect(() => {
    // 1. Lidar com o app já aberto (Warm Start)
    const urlListener = App.addListener('appUrlOpen', (data) => {
      handleUrl(data.url);
    });

    // 2. Lidar com o app sendo aberto do zero (Cold Start)
    const checkInitialUrl = async () => {
      const data = await App.getLaunchUrl();
      if (data?.url) {
        console.log('[DeepLink] App aberto via link (Cold Start):', data.url);
        handleUrl(data.url);
      }
    };

    checkInitialUrl();

    return () => {
      urlListener.remove();
    };
  }, [handleUrl]);

  return null;
};

export default DeepLinkHandler;