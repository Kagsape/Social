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
    const selectedRole = role; // Captura o estado atual do cargo selecionado
    
    console.log('[Signup] Iniciando validação rígida...', { selectedRole, id: cleanId });
    setLoading(true);
    
    try {
      // 1. Buscar o ID na Whitelist
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) throw new Error('Erro ao conectar com o banco de dados.');

      // 2. Se não existir na lista, bloqueia na hora
      if (!whitelistEntry) {
        throw new Error(`O ID "${cleanId}" não foi encontrado na lista de autorizados.`);
      }

      // 3. TRAVA DE SEGURANÇA: O cargo selecionado DEVE ser igual ao cargo autorizado
      // Se na lista está 'teacher' e o usuário escolheu 'student', o sistema bloqueia.
      if (whitelistEntry.role !== selectedRole) {
        const cargoAutorizado = whitelistEntry.role === 'student' ? 'ALUNO' : 'PROFESSOR';
        throw new Error(`ACESSO NEGADO: Este ID está autorizado apenas para o cargo de ${cargoAutorizado}. Você tentou se cadastrar como ${selectedRole === 'student' ? 'ALUNO' : 'PROFESSOR'}.`);
      }

      // 4. Verificar se o ID já está em uso
      const idColumn = selectedRole === 'student' ? 'student_id' : 'teacher_id';
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq(idColumn, cleanId)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este número de matrícula já foi cadastrado por outro usuário.');
      }

      // 5. Se passou em tudo, cria a conta com o cargo CORRETO da whitelist
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: whitelistEntry.role, // Usa o cargo da whitelist por segurança
            [whitelistEntry.role === 'student' ? 'student_id' : 'teacher_id']: cleanId
          }
        },
      });

      if (authError) throw authError;

      showSuccess(`Conta de ${whitelistEntry.role === 'student' ? 'Aluno' : 'Professor'} criada com sucesso!`);
      navigate('/login');
      
    } catch (error: any) {
      console.error('[Signup] Erro de validação:', error.message);
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
          <p className="text-muted-foreground mt-2">CIEP 165 - Validação de Matrícula</p>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>Cadastro de Membro</CardTitle>
            <CardDescription>Seu cargo deve coincidir com o autorizado na lista branca.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-5">
              <div className="space-y-2">
                <Label>Tipo de Conta que deseja criar</Label>
                <Select value={role} onValueChange={(value: 'student' | 'teacher') => setRole(value)}>
                  <SelectTrigger className="rounded-xl border-2 focus:ring-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_id">Número de Matrícula / ID Autorizado</Label>
                <div className="relative">
                  <ShieldAlert className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('registration_id', { required: true })}
                    id="registration_id"
                    placeholder="Digite seu ID"
                    className="pl-10 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    {...register('name', { required: true })}
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
                    {...register('email', { required: true })}
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
                    {...register('password', { required: true, minLength: 6 })}
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