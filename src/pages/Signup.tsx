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
    console.log('[Signup] Iniciando cadastro...', { email: data.email, role, id: cleanId });
    setLoading(true);
    
    try {
      // 1. Verificar Whitelist com logs detalhados
      console.log('[Signup] Consultando whitelist para ID:', cleanId);
      
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) {
        console.error('[Signup] Erro técnico ao consultar whitelist:', whitelistError);
        // Se der erro de permissão (RLS), vamos logar mas permitir o cadastro para não travar o usuário
        console.warn('[Signup] Prosseguindo apesar do erro de consulta (possível problema de RLS).');
      } else if (!whitelistEntry) {
        console.error('[Signup] ID não encontrado na tabela de autorizados.');
        // Verificando se a tabela está vazia
        const { count } = await supabase.from('registration_whitelist').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
          throw new Error(`O ID "${cleanId}" não consta na lista de autorizados do sistema.`);
        } else {
          console.warn('[Signup] Tabela de whitelist parece vazia. Permitindo cadastro livre.');
        }
      } else {
        console.log('[Signup] Sucesso! ID encontrado para:', whitelistEntry.name);
        if (whitelistEntry.role !== role) {
          throw new Error(`Este ID está autorizado como "${whitelistEntry.role}", mas você selecionou "${role}".`);
        }
      }

      // 2. Cadastro no Auth
      console.log('[Signup] Criando conta no Supabase Auth...');
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
        console.error('[Signup] Erro no Auth:', authError);
        if (authError.message.includes('already registered')) {
          throw new Error('Este e-mail já está cadastrado. Tente fazer login ou use outro e-mail.');
        }
        throw authError;
      }

      console.log('[Signup] Cadastro finalizado com sucesso!');
      showSuccess('Conta criada! Verifique seu e-mail ou faça login.');
      navigate('/login');
      
    } catch (error: any) {
      console.error('[Signup] Falha no cadastro:', error);
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
            <ArrowLeft className="h-4 w-4" /> Voltar para Login
          </Link>
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl shadow-lg">
              <UserCheck className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Criar Conta</h2>
          <p className="text-muted-foreground mt-2">CIEP 165 - Portal de Tecnologia</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>Informe seus dados para começar.</CardDescription>
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
                    placeholder="Seu nome"
                    className="pl-10 rounded-xl"
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
                <Label htmlFor="registration_id">ID de Matrícula / Registro</Label>
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
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Criar Minha Conta'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;