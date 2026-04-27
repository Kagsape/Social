"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { showSuccess, showError } from '@/utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  const handleRegister = async (data: any) => {
    const cleanId = data.registration_id.trim();
    setLoading(true);
    try {
      // 1. Validar na Whitelist
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) throw new Error('Erro ao validar matrícula.');
      if (!whitelistEntry) throw new Error(`O ID "${cleanId}" não está autorizado.`);
      if (whitelistEntry.role !== role) throw new Error(`Este ID é para o cargo de ${whitelistEntry.role}.`);

      // 2. Criar conta
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: whitelistEntry.role,
            [whitelistEntry.role === 'student' ? 'student_id' : 'teacher_id']: cleanId
          }
        },
      });

      if (authError) throw authError;

      // 3. Processar pré-matrículas se for aluno
      if (whitelistEntry.role === 'student' && authData.user) {
        const { data: pending } = await supabase
          .from('pending_enrollments')
          .select('course_id')
          .eq('registration_id', cleanId);

        if (pending && pending.length > 0) {
          const enrollments = pending.map(p => ({
            course_id: p.course_id,
            student_id: authData.user?.id,
            status: 'active'
          }));
          await supabase.from('enrollments').insert(enrollments);
          await supabase.from('pending_enrollments').delete().eq('registration_id', cleanId);
        }
      }

      showSuccess('Conta criada! Verifique seu e-mail.');
      navigate('/login');
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">Criar Conta</h2>
        </div>

        <Card className="border-none shadow-2xl">
          <CardHeader>
            <CardTitle>Cadastro de Membro</CardTitle>
            <CardDescription>Valide seu acesso com seu ID autorizado.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(handleRegister)} className="space-y-5">
              <div className="space-y-2">
                <Label>Tipo de Conta</Label>
                <Select value={role} onValueChange={(v: any) => setRole(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Aluno</SelectItem>
                    <SelectItem value="teacher">Professor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="registration_id">Matrícula / ID</Label>
                <Input {...register('registration_id', { required: true })} id="registration_id" placeholder="Digite seu ID" className="rounded-xl font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input {...register('name', { required: true })} id="name" placeholder="Seu nome" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input {...register('email', { required: true })} id="email" type="email" placeholder="seu@email.com" className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input {...register('password', { required: true, minLength: 6 })} id="password" type="password" placeholder="Mínimo 6 caracteres" className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl py-6 font-bold" disabled={loading}>
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