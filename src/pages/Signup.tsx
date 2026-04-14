"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, Mail, Lock, UserCheck, ShieldAlert, Hash } from 'lucide-react';
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
      // 1. Validar contra a Lista Branca (registration_whitelist)
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', data.registration_id)
        .eq('role', role)
        .maybeSingle();

      if (whitelistError) throw whitelistError;

      if (!whitelistEntry) {
        throw new Error(`O ID de ${role === 'student' ? 'matrícula' : 'registro'} informado não foi encontrado ou não corresponde ao tipo de conta selecionado. Procure a secretaria.`);
      }

      // 2. Realizar o cadastro no Auth
      const metadata: any = {
        name: data.name,
        role: role
      };

      if (role === 'student') {
        metadata.student_id = data.registration_id;
      } else {
        metadata.teacher_id = data.registration_id;
      }

      const { error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          data: metadata
        },
      });

      if (authError) throw authError;

      showSuccess(`Cadastro realizado com sucesso para ${whitelistEntry.name}! Verifique seu e-mail.`);
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
            <CardDescription>Apenas matrículas autorizadas podem se cadastrar.</CardDescription>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_id">ID de Matrícula / Registro</Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('registration_id', { required: 'ID de matrícula é obrigatório' })}
                    id="registration_id"
                    placeholder="Ex: MAT-2024-0001"
                    className="pl-10 rounded-xl font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Consulte seu ID na secretaria da escola.</p>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Selecione o tipo de conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
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
              </div>

              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? 'Validando...' : 'Criar Minha Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;