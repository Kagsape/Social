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

    try {
      // 1. Buscar o e-mail atual associado a esta matrícula na tabela pública
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .or(`student_id.eq.${cleanId},teacher_id.eq.${cleanId}`)
        .maybeSingle();

      // Se o usuário já existe, usamos o e-mail que está no banco (pode ter sido alterado)
      // Se não existe, usamos o padrão dummy para o primeiro acesso
      const targetEmail = userData?.email || `${cleanId}@app.local`;

      // 2. Tentar Login
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (!signInError && signInData.session) {
        showSuccess('Bem-vindo de volta!');
        navigate(from, { replace: true });
        return;
      }

      // 3. Se falhou e o usuário não existe, tentamos o fluxo de criação automática (Whitelist)
      if (signInError?.message === 'Invalid login credentials' && !userData) {
        
        const { data: whitelistEntry, error: whitelistError } = await supabase
          .from('registration_whitelist')
          .select('*')
          .eq('registration_id', cleanId)
          .maybeSingle();

        if (whitelistError) throw new Error('Erro ao validar matrícula no servidor.');

        if (!whitelistEntry) {
          throw new Error('Matrícula não encontrada na lista de autorizados.');
        }

        // Criação Automática (Primeiro Acesso)
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
          showSuccess('Conta criada e validada com sucesso!');
          navigate(from, { replace: true });
        } else {
          showSuccess('Conta criada! Por favor, tente entrar agora.');
        }
      } else {
        throw signInError || new Error('Credenciais inválidas.');
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