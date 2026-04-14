"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Lock, UserCheck, Hash } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Signup = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const handleRegister = async (data: any) => {
    setLoading(true);
    try {
      const { data: userData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: {
            name: data.name,
            role: role,
            student_id: role === 'student' ? data.student_id : null
          }
        },
      });

      if (error) throw error;

      showSuccess('Cadastro realizado com sucesso! Por favor, verifique seu e-mail.');
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      showError(error.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
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
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('name', { required: 'Nome é obrigatório' })}
                    id="name"
                    placeholder="Seu nome"
                    className="pl-10 rounded-xl"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm">{String(errors.name.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email', { required: 'E-mail é obrigatório' })}
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 rounded-xl"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm">{String(errors.email.message)}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {role === 'student' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label htmlFor="student_id">Número de Matrícula</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      {...register('student_id', { required: 'Matrícula é obrigatória para alunos' })}
                      id="student_id"
                      placeholder="Ex: 2024001"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  {errors.student_id && (
                    <p className="text-red-500 text-sm">{String(errors.student_id.message)}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('password', { 
                      required: 'Senha é obrigatória',
                      minLength: { value: 6, message: 'Mínimo de 6 caracteres' }
                    })}
                    id="password"
                    type="password"
                    placeholder="Crie uma senha"
                    className="pl-10 rounded-xl"
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm">{String(errors.password.message)}</p>
                )}
              </div>

              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;