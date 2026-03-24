"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Image as ImageIcon } from 'lucide-react';
import Layout from '@/components/Layout';

const Signup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const handleRegister = async (data: any) => {
    try {
      const { data: userData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: '/login',
        },
      });
      
      if (error) {
        throw error;
      }
      
      showSuccess('Cadastro realizado com sucesso! Por favor, faça login.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      showError('Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary p-3 rounded-2xl">
                <ImageIcon className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Criar Conta</h2>
            <p className="text-muted-foreground mt-2">CIEP 165 Brigadeiro Sérgio Carvalho</p>
          </div>

          <Card className="border-none shadow-xl">
            <CardHeader>
              <CardTitle>Inscreva-se</CardTitle>
              <CardDescription>Preencha os dados abaixo para criar sua conta.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(handleRegister)} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    {...register('name', { required: true })}
                    id="name"
                    placeholder="Seu nome"
                    className="rounded-xl"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    {...register('email', { required: true })}
                    id="email"
                    placeholder="seu@email.com"
                    className="rounded-xl"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    {...register('password', { required: true })}
                    id="password"
                    type="password"
                    placeholder="Crie uma senha"
                    className="rounded-xl"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    {...register('confirmPassword', { required: true, validate: (value, form) => value === form.password })}
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    className="rounded-xl"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg bg-primary">
                  Criar Conta
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Signup;