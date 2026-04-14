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
    const cleanId = data.registration_id.trim();
    console.log('[Signup] Validando matrícula...', { role, id: cleanId });
    setLoading(true);
    
    try {
      // 1. Verificar se o ID existe na Whitelist (Obrigatório)
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) {
        console.error('[Signup] Erro de conexão com a lista:', whitelistError);
        throw new Error('Erro ao validar sua matrícula. Por favor, tente novamente em instantes.');
      }

      if (!whitelistEntry) {
        throw new Error(`A matrícula "${cleanId}" não está autorizada. Peça ao administrador para incluí-la no painel.`);
      }

      // 2. Verificar se o cargo bate com o autorizado
      if (whitelistEntry.role !== role) {
        throw new Error(`Este ID está autorizado apenas para o cargo de "${whitelistEntry.role === 'student' ? 'Aluno' : 'Professor'}".`);
      }

      // 3. Verificar se este ID já está vinculado a algum usuário existente
      const idColumn = role === 'student' ? 'student_id' : 'teacher_id';
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq(idColumn, cleanId)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este número de matrícula já está vinculado a outra conta ativa.');
      }

      console.log('[Signup] Matrícula validada para:', whitelistEntry.name);

      // 4. Criar a conta
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: role,
            [role === 'student' ? 'student_id' : 'teacher_id']: cleanId
          }
        },
      });

      if (authError) {
        if (authError.message.includes('rate limit')) {
          throw new Error('Muitas tentativas seguidas. Por favor, aguarde alguns minutos.');
        }
        if (authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está em uso.');
        }
        throw authError;
      }

      showSuccess('Conta criada com sucesso! Agora você pode fazer login.');
      navigate('/login');
      
    } catch (error: any) {
      console.error('[Signup] Erro:', error.message);
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para Login
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Criar Conta</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 - Sistema de Matrícula</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>Cadastro Obrigatório</CardTitle>
            <CardDescription>Você precisa estar na lista branca para criar uma conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="registration_id">Número de Matrícula / ID</Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('registration_id', { required: 'ID é obrigatório' })}
                    id="registration_id"
                    placeholder="Digite seu ID autorizado"
                    className="pl-10 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('password', { required: 'Senha é obrigatória', minLength: 6 })}
                    id="password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    className="pl-10 rounded-xl"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full rounded-xl py-6 font-bold text-lg" disabled={loading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Validar e Criar Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;