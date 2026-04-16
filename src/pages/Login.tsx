"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Lock, Loader2, ArrowLeft, Chrome, AlertCircle } from 'lucide-react';
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !password.trim()) return;
    
    setLoading(true);
    setErrorDetail(null);
    const cleanId = registrationId.trim();
    const timestamp = new Date().toLocaleTimeString();

    console.log(`[${timestamp}] [LOGIN_DEBUG] 🏁 Iniciando tentativa de login para ID:`, cleanId);

    try {
      // 1. Verificar se já existe um e-mail para este ID
      console.log(`[${timestamp}] [LOGIN_DEBUG] 1️⃣ Buscando e-mail na tabela 'users'...`);
      const { data: userData, error: userQueryError } = await supabase
        .from('users')
        .select('email')
        .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
        .maybeSingle();

      if (userQueryError) console.error(`[${timestamp}] [LOGIN_DEBUG] ❌ Erro na busca de usuário:`, userQueryError);

      const targetEmail = userData?.email || `${cleanId}@app.local`;
      console.log(`[${timestamp}] [LOGIN_DEBUG] 📧 E-mail alvo definido como:`, targetEmail);

      // 2. Tentar Login
      console.log(`[${timestamp}] [LOGIN_DEBUG] 2️⃣ Tentando autenticação com Supabase Auth...`);
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!signInError && signInData.session) {
        console.log(`[${timestamp}] [LOGIN_DEBUG] ✅ Login bem-sucedido! Redirecionando para:`, from);
        showSuccess('Bem-vindo de volta!');
        navigate(from, { replace: true });
        return;
      }

      if (signInError) {
        console.warn(`[${timestamp}] [LOGIN_DEBUG] ⚠️ Falha no login direto (pode ser primeiro acesso):`, signInError.message);
      }

      // 3. Verificar Whitelist
      console.log(`[${timestamp}] [LOGIN_DEBUG] 3️⃣ Verificando ID na 'registration_whitelist'...`);
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) {
        console.error(`[${timestamp}] [LOGIN_DEBUG] ❌ Erro ao consultar whitelist:`, whitelistError);
        throw new Error(`Erro no banco de dados: ${whitelistError.message}`);
      }
      
      if (!whitelistEntry) {
        console.error(`[${timestamp}] [LOGIN_DEBUG] ❌ ID não encontrado na whitelist.`);
        throw new Error('Esta matrícula não está autorizada no sistema.');
      }

      console.log(`[${timestamp}] [LOGIN_DEBUG] 📄 Entrada na whitelist encontrada:`, whitelistEntry);

      if (password !== whitelistEntry.password) {
        console.error(`[${timestamp}] [LOGIN_DEBUG] ❌ Senha incorreta. Esperada: ${whitelistEntry.password}, Recebida: ${password}`);
        throw new Error('Senha incorreta para esta matrícula.');
      }

      // 4. Primeiro acesso: Criar conta
      console.log(`[${timestamp}] [LOGIN_DEBUG] 4️⃣ Criando nova conta (Primeiro Acesso)...`);
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

      if (signUpError) {
        console.error(`[${timestamp}] [LOGIN_DEBUG] ❌ Erro no signUp:`, signUpError);
        throw signUpError;
      }
      
      if (signUpData.session) {
        console.log(`[${timestamp}] [LOGIN_DEBUG] ✅ Conta criada e logada com sucesso!`);
        showSuccess('Conta ativada com sucesso!');
        navigate(from, { replace: true });
      } else {
        console.log(`[${timestamp}] [LOGIN_DEBUG] ℹ️ Conta criada, mas aguardando confirmação ou re-login.`);
        showSuccess('Conta criada! Tente entrar novamente.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error(`[${timestamp}] [LOGIN_DEBUG] 🚨 Erro final capturado:`, error);
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
            <CardDescription>Use sua matrícula e senha autorizada.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {errorDetail && (
              <div className="bg-destructive/10 p-4 rounded-xl flex items-start gap-3 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Erro no Login:</p>
                  <p className="text-xs opacity-80">{errorDetail}</p>
                  <p className="text-[10px] mt-2 italic">Dica: Abra o console (F12) para ver os logs detalhados.</p>
                </div>
              </div>
            )}

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