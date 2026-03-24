"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { email, password } = new FormData(e.target as FormData);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.get('email') as string,
        password: password as string,
      });
            if (error) {
        throw error;
      }
      
      showSuccess('Login bem-sucedido! Bem-vindo de volta.');
      navigate('/feed');
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      showError('Email ou senha inválidos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para o início
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <LayoutDashboard className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Portal do Aluno</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 Brigadeiro Sérgio Carvalho</p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>Entrar</CardTitle>
            <CardDescription>Digite seu e-mail e senha para acessar seus cursos.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <a href="#" className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
                </div>
                <Input id="password" type="password" required className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg">
                Entrar
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Ou continue com</span>
              </div>
            </div>
            <Button variant="outline" className="w-full rounded-xl">
              Google
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta? <Link to="/signup" className="text-primary font-semibold hover:underline">Criar Conta</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;