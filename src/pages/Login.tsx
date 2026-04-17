"use client";

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Hash, Lock, Loader2, ArrowLeft, Chrome } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/components/AuthProvider';

const Login = () => {
  const navigate = useNavigate();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redireciona se já estiver logado
  useEffect(() => {
    if (!authLoading && user && userProfile) {
      navigate('/feed', { replace: true });
    }
  }, [user, userProfile, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = registrationId.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      showError("Preencha matrícula e senha.");
      return;
    }
    
    setSubmitting(true);

    try {
      // 1. Validar se a matrícula existe na registration_whitelist
      const { data: whitelist, error: wlError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (wlError) throw new Error("Erro ao conectar com o banco de dados.");
      if (!whitelist) throw new Error("Matrícula não autorizada. Fale com o administrador.");
      
      // 2. Validar a senha da lista branca
      if (cleanPass !== whitelist.password) {
        throw new Error("Senha incorreta para esta matrícula.");
      }

      // Criamos um e-mail virtual para o Supabase Auth
      const targetEmail = `${cleanId}@ciep165.app`;

      // 3. Tentar Login
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: cleanPass,
      });

      // 4. Se o usuário não existir no Auth, criamos ele agora (Auto-registro)
      if (signInError && signInError.message.includes("Invalid login credentials")) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: targetEmail,
          password: cleanPass,
          options: {
            data: {
              name: whitelist.name,
              role: whitelist.role,
              [whitelist.role === 'student' ? 'student_id' : 'teacher_id']: cleanId
            }
          }
        });
        
        if (signUpError) throw signUpError;
        showSuccess("Primeiro acesso realizado com sucesso!");
      } else if (signInError) {
        throw signInError;
      }
      
    } catch (error: any) {
      showError(error.message);
    } finally {
      setSubmitting(false);
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
            <Button 
              variant="outline" 
              className="w-full h-12 rounded-xl gap-3 font-bold border-2" 
              onClick={handleGoogleLogin}
              disabled={submitting || authLoading}
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
                <Label htmlFor="registration">Matrícula / ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="registration"
                    placeholder="Ex: 2024001"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    required
                    className="pl-10 rounded-xl font-mono"
                    disabled={submitting || authLoading}
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
                    disabled={submitting || authLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={submitting || authLoading}>
                {submitting || authLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;