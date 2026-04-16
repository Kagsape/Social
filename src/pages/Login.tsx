"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ArrowLeft, Hash, Lock, Loader2, ShieldCheck, Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/feed';

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      showError('Erro ao conectar com Google.');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !password.trim()) return;
    
    setLoading(true);
    const cleanId = registrationId.trim();

    try {
      // 1. Tenta encontrar o e-mail associado a esta matrícula
      const { data: userData, error: userQueryError } = await supabase
        .from('users')
        .select('email')
        .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
        .maybeSingle();

      const targetEmail = userData?.email || `${cleanId}@app.local`;

      // 2. Tenta Login normal
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!signInError && signInData.session) {
        showSuccess('Bem-vindo de volta!');
        navigate(from, { replace: true });
        return;
      }

      // 3. Se falhou (usuário não existe ou senha errada), verificamos a Whitelist
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) throw new Error('Erro ao validar matrícula no servidor.');
      
      if (!whitelistEntry) {
        throw new Error('Matrícula não encontrada na lista de autorizados.');
      }

      // Validar senha da lista branca para o primeiro acesso
      if (password !== whitelistEntry.password) {
        throw new Error('Senha incorreta para esta matrícula.');
      }

      // Se chegou aqui, é o primeiro acesso e a senha da whitelist está correta
      // Criamos a conta no Supabase Auth
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
        // Se o erro for que o usuário já existe, mas a senha estava errada no passo 2
        if (signUpError.message.includes('already registered')) {
          throw new Error('Esta matrícula já possui uma conta, mas a senha informada está incorreta.');
        }
        throw signUpError;
      }
      
      if (signUpData.session) {
        showSuccess('Conta ativada com sucesso!');
        navigate(from, { replace: true });
      } else {
        showSuccess('Conta criada! Por favor, tente entrar novamente.');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('[Login] Erro:', error);
      showError(error.message || 'Erro ao acessar o sistema.');
      setLoading(false);
    } finally {
      // O loading só é desativado se não houver navegação
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Início
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Acesso ao Portal</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 Brigadeiro Sérgio Carvalho</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Use sua matrícula e a senha definida pelo administrador.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl gap-3 font-bold" 
              onClick={handleGoogleLogin}
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