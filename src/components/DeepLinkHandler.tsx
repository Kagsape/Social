"use client";

import { useEffect, useCallback } from 'react';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';

const DeepLinkHandler = () => {
  const navigate = useNavigate();

  const handleAuthUrl = useCallback(async (urlStr: string) => {
    console.log('[DeepLink] Processando URL:', urlStr);
    
    try {
      const url = new URL(urlStr);
      
      // O Supabase envia os tokens após o '#' (fragmento)
      const hash = url.hash.substring(1);
      if (!hash) return;

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
    } catch (err: any) {
      console.error('[DeepLink] Erro ao processar tokens:', err.message);
      showError('Falha ao processar autenticação.');
    }
  }, [navigate]);

  useEffect(() => {
    // 1. Lidar com o app já aberto (Warm Start)
    const urlListener = App.addListener('appUrlOpen', (data) => {
      handleAuthUrl(data.url);
    });

    // 2. Lidar com o app sendo aberto do zero (Cold Start)
    App.getLaunchUrl().then((data) => {
      if (data?.url) {
        console.log('[DeepLink] App aberto via link (Cold Start):', data.url);
        handleAuthUrl(data.url);
      }
    });

    return () => {
      urlListener.remove();
    };
  }, [handleAuthUrl]);

  return null;
};

export default DeepLinkHandler;