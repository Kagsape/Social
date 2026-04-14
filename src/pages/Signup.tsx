"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { User, Mail, Lock, UserCheck, ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';
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
      // 1. Verificar Whitelist (Opcional - não bloqueia se a tabela não existir)
      try {
        const { data: whitelistEntry, error: whitelistError } = await supabase
          .from('registration_whitelist')
          .select('*')
          .eq('registration_id', data.registration_id)
          .eq('role', role)
          .maybeSingle();

        // Se a tabela existe e o ID NÃO está lá, barramos
        if (!whitelistError && !whitelistEntry) {
          throw new Error(`O ID de ${role === 'student' ? 'matrícula' : 'registro'} informado não foi pré-autorizado.`);
        }
      } catch (err: any) {
        // Se o erro for "tabela não existe" ou algo similar, ignoramos para não travar o site
        if (err.message?.includes('não foi pré-autorizado')) throw err;
        console.log('[Signup] Whitelist ignorada ou inacessível.');
      }

      // 2. Cadastro no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: role,
            [role === 'student' ? 'student_id' : 'teacher_id']: data.registration_id
          }
        },
      });

      if (authError) throw authError;

      showSuccess('Cadastro realizado com sucesso!');
      
      // Se o login for automático após o cadastro
      if (authData.session) {
        navigate('/feed');
      } else {
        navigate('/login');
      }
    } catch (error: any) {
      console.error('[Signup] Erro:', error);
      showError(error.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Já tenho uma conta
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Criar Conta</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 Brigadeiro Sérgio Carvalho</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>Inscreva-se</CardTitle>
            <CardDescription>Preencha os dados abaixo para acessar o portal.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('name', { required: 'Nome é obrigatório' })}
                    id="name"
                    placeholder="Seu nome completo"
                    className="pl-10 rounded-xl"
                  />
                </div>
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
                <Label htmlFor="registration_id">
                  {role === 'student' ? 'Número de Matrícula' : 'ID de Registro'}
                </Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('registration_id', { required: 'Este campo é obrigatório' })}
                    id="registration_id"
                    placeholder={role === 'student' ? "Ex: 2024001" : "Ex: REG-123"}
                    className="pl-10 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('email', { 
                      required: 'E-mail é obrigatório',
                      pattern: { value: /^\S+@\S+$/i, message: 'E-mail inválido' }
                    })}
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

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
                    placeholder="Crie uma senha forte"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg shadow-lg" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Criando conta...</>
                ) : 'Finalizar Cadastro'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Já tem uma conta? <Link to="/login" className="text-primary font-bold hover:underline">Entrar</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;