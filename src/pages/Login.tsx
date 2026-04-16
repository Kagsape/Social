"use client";

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ArrowLeft, Hash, Lock, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [registrationId, setRegistrationId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/feed';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationId.trim() || !password.trim()) return;
    
    setLoading(true);
    const cleanId = registrationId.trim();
    const dummyEmail = `${cleanId}@app.local`;

    try {
      // 1. Tentar Login Direto
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: dummyEmail,
        password: password,
      });

      // Se logou com sucesso, redireciona
      if (!signInError && signInData.session) {
        showSuccess('Bem-vindo de volta!');
        navigate(from, { replace: true });
        return;
      }

      // 2. Se o erro for "Invalid login credentials", pode ser que o usuário não exista
      // ou a senha esteja errada. Vamos verificar a Whitelist.
      if (signInError?.message === 'Invalid login credentials') {
        
        // Verificar se a matrícula existe na Whitelist
        const { data: whitelistEntry, error: whitelistError } = await supabase
          .from('registration_whitelist')
          .select('*')
          .eq('registration_id', cleanId)
          .maybeSingle();

        if (whitelistError) throw new Error('Erro ao validar matrícula no servidor.');

        if (!whitelistEntry) {
          throw new Error('Matrícula não encontrada na lista de autorizados.');
        }

        // Verificar se o usuário já existe na tabela 'users'
        // Se existe e o login falhou acima, a senha está errada.
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
          .maybeSingle();

        if (existingUser) {
          throw new Error('Senha incorreta para esta matrícula.');
        }

        // 3. Criação Automática (Primeiro Acesso)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
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
          showSuccess('Conta criada e validada com sucesso!');
          navigate(from, { replace: true });
        } else {
          showSuccess('Conta criada! Por favor, tente entrar agora.');
        }
      } else {
        throw signInError;
      }

    } catch (error: any) {
      console.error('[Auth] Erro:', error);
      showError(error.message || 'Erro ao acessar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <ShieldCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Acesso ao Portal</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 Brigadeiro Sérgio Carvalho</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Login via Matrícula</CardTitle>
            <CardDescription>
              Se for seu primeiro acesso, sua conta será criada automaticamente ao validar sua matrícula.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registration">Número de Matrícula</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="registration"
                    type="text"
                    placeholder="Digite sua matrícula"
                    value={registrationId}
                    onChange={(e) => setRegistrationId(e.target.value)}
                    required
                    className="pl-10 rounded-xl font-mono"
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
                    placeholder="Sua senha de acesso"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Entrar no Sistema'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-center text-xs text-muted-foreground">
              Problemas com o acesso? Procure a coordenação da Sala de Informática.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;