"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Lock, Loader2, ArrowLeft, Chrome, AlertCircle, WifiOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/feed';

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log('[LOGIN] 🌐 Iniciando Google OAuth...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('[LOGIN] ❌ Erro Google:', error.message);
      setErrorDetail(`Erro Google: ${error.message}`);
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !password.trim()) return;
    
    setLoading(true);
    setErrorDetail(null);
    const cleanId = registrationId.trim();

    try {
      console.log('[LOGIN] 1️⃣ Verificando usuário...');
      // Tentamos buscar o e-mail vinculado à matrícula
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
        .maybeSingle();

      if (userError) {
        console.error('[LOGIN] ❌ Erro na tabela users:', userError);
        // Se der erro de permissão (RLS), avisamos o usuário
        if (userError.code === '42P01') throw new Error("Tabela 'users' não encontrada no banco.");
        if (userError.code === 'PGRST301') throw new Error("Acesso negado pelo banco (RLS). Execute o SQL de permissões.");
      }

      const targetEmail = userData?.email || `${cleanId}@app.local`;

      console.log('[LOGIN] 2️⃣ Autenticando...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!signInError && signInData.session) {
        showSuccess('Bem-vindo!');
        navigate(from, { replace: true });
        return;
      }

      console.log('[LOGIN] 3️⃣ Verificando Whitelist...');
      const { data: whitelist, error: wlError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (wlError) throw new Error(`Erro na Whitelist: ${wlError.message}`);
      if (!whitelist) throw new Error('Matrícula não autorizada.');
      if (password !== whitelist.password) throw new Error('Senha incorreta.');

      console.log('[LOGIN] 4️⃣ Criando conta...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: password,
        options: {
          data: {
            name: whitelist.name,
            role: whitelist.role,
            [whitelist.role === 'student' ? 'student_id' : 'teacher_id']: cleanId
          }
        }
      });

      if (signUpError) throw signUpError;
      
      if (signUpData.session) {
        showSuccess('Conta ativada!');
        navigate(from, { replace: true });
      } else {
        showSuccess('Conta criada! Entre agora com sua senha.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[LOGIN] 🚨 Erro:', error.message);
      setErrorDetail(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Acesso ao Portal</h2>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use sua matrícula ou conta Google.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorDetail && (
              <div className="bg-destructive/10 p-4 rounded-xl flex items-start gap-3 text-destructive text-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Falha no acesso:</p>
                  <p className="text-xs opacity-80">{errorDetail}</p>
                  <p className="text-[10px] mt-2 font-medium underline">Certifique-se de ter executado o SQL no Supabase.</p>
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl gap-3 font-bold border-2" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="h-5 w-5 text-red-500" />
              Entrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou matrícula</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration">Matrícula</Label>
                <Input
                  id="registration"
                  placeholder="Sua matrícula"
                  value={registrationId}
                  onChange={(e) => setRegistrationId(e.target.value)}
                  required
                  className="rounded-xl font-mono"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-xl"
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;