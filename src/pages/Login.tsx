"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Lock, Loader2, ArrowLeft, Chrome, AlertCircle, Clock } from 'lucide-react';
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

  // Função auxiliar para evitar que o Supabase trave a UI para sempre
  const withTimeout = async (promise: Promise<any>, timeoutMs: number = 8000) => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tempo de resposta do servidor esgotado (Timeout)")), timeoutMs)
    );
    return Promise.race([promise, timeoutPromise]);
  };

  const handleGoogleLogin = async () => {
    console.log('[LOGIN_DEBUG] 🌐 Iniciando Login com Google...');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('[LOGIN_DEBUG] ❌ Erro Google:', error.message);
      showError('Erro ao conectar com Google.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !password.trim()) return;
    
    setLoading(true);
    setErrorDetail(null);
    const cleanId = registrationId.trim();
    const timestamp = () => new Date().toLocaleTimeString();

    console.log(`[${timestamp()}] [LOGIN_DEBUG] 🏁 Início da tentativa para ID:`, cleanId);

    try {
      // 1. Buscar e-mail (com timeout)
      console.log(`[${timestamp()}] [LOGIN_DEBUG] 1️⃣ Consultando tabela 'users'...`);
      let userData = null;
      try {
        const response = await withTimeout(
          supabase
            .from('users')
            .select('email')
            .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
            .maybeSingle()
        );
        userData = response.data;
        console.log(`[${timestamp()}] [LOGIN_DEBUG] ✅ Resposta da tabela 'users' recebida.`);
      } catch (err: any) {
        console.warn(`[${timestamp()}] [LOGIN_DEBUG] ⚠️ Falha ou Timeout na consulta 'users':`, err.message);
        // Não travamos aqui, seguimos para o e-mail padrão
      }

      const targetEmail = userData?.email || `${cleanId}@app.local`;
      console.log(`[${timestamp()}] [LOGIN_DEBUG] 📧 E-mail definido:`, targetEmail);

      // 2. Tentar Login Direto
      console.log(`[${timestamp()}] [LOGIN_DEBUG] 2️⃣ Tentando autenticação...`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!signInError && signInData.session) {
        console.log(`[${timestamp()}] [LOGIN_DEBUG] 🎉 Login realizado com sucesso!`);
        showSuccess('Bem-vindo de volta!');
        navigate(from, { replace: true });
        return;
      }

      console.log(`[${timestamp()}] [LOGIN_DEBUG] ℹ️ Login direto falhou, verificando lista branca...`);

      // 3. Verificar Whitelist (com timeout)
      const { data: whitelistEntry, error: whitelistError } = await withTimeout(
        supabase
          .from('registration_whitelist')
          .select('*')
          .eq('registration_id', cleanId)
          .maybeSingle()
      );

      if (whitelistError) throw new Error(`Erro no banco: ${whitelistError.message}`);
      
      if (!whitelistEntry) {
        throw new Error('Esta matrícula não está autorizada no sistema.');
      }

      if (password !== whitelistEntry.password) {
        throw new Error('Senha incorreta para esta matrícula.');
      }

      // 4. Criar conta
      console.log(`[${timestamp()}] [LOGIN_DEBUG] 4️⃣ Criando nova conta...`);
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: targetEmail,
        password: password,
        options: {
          data: {
            name: whitelistEntry.name,
            role: whitelistEntry.role,
            [whitelistEntry.role === 'student' ? 'student_id' : 'teacher_id']: cleanId
          }
        }
      });

      if (signUpError) throw signUpError;
      
      if (signUpData.session) {
        showSuccess('Conta ativada com sucesso!');
        navigate(from, { replace: true });
      } else {
        showSuccess('Conta criada! Tente entrar novamente.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`[${timestamp()}] [LOGIN_DEBUG] 🚨 Erro Crítico:`, error.message);
      setErrorDetail(error.message);
      showError(error.message);
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
            <CardDescription>Use sua matrícula ou sua conta Google.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorDetail && (
              <div className="bg-destructive/10 p-4 rounded-xl flex items-start gap-3 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Não foi possível entrar:</p>
                  <p className="text-xs opacity-80">{errorDetail}</p>
                  {errorDetail.includes("Timeout") && (
                    <p className="text-[10px] mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Tente recarregar a página ou verifique sua conexão.
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl gap-3 font-bold border-2 hover:bg-slate-50" 
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <Chrome className="h-5 w-5 text-red-500" />
              Entrar com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><Separator /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou via matrícula</span>
              </div>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration">Número de Matrícula</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="registration"
                    placeholder="Digite sua matrícula"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    required
                    className="pl-10 rounded-xl font-mono"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 rounded-xl"
                    disabled={loading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar no Sistema'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;