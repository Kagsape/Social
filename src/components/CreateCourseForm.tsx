"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Plus, BookOpen } from 'lucide-react';

interface CreateCourseFormProps {
  onSuccess?: () => void;
}

const CreateCourseForm: React.FC<CreateCourseFormProps> = ({ onSuccess }) => {
  const { user, userProfile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isTeacher) return;

    setLoading(true);
    try {
      // 1. Criar o curso
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert({
          name: name.trim(),
          description: description.trim(),
          code: code.trim() || `TURMA-${Math.random().toString(36).substring(7).toUpperCase()}`,
          created_by: user.id,
          teacher_id: user.id, // Para compatibilidade com o schema atual
          category: 'Tecnologia'
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // 2. Vincular automaticamente o professor na tabela de junção
      const { error: linkError } = await supabase
        .from('course_teachers')
        .insert({
          course_id: course.id,
          teacher_id: user.id
        });

      if (linkError) throw linkError;

      showSuccess('Turma criada com sucesso!');
      setName('');
      setDescription('');
      setCode('');
      onSuccess?.();
    } catch (error: any) {
      console.error('[CreateCourse] Erro:', error);
      showError(error.message || 'Erro ao criar turma.');
    } finally {
      setLoading(false);
    }
  };

  if (!isTeacher) return null;

  return (
    <Card className="border-none shadow-lg bg-white dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Criar Nova Turma
        </CardTitle>
        <CardDescription>Preencha os dados para abrir uma nova turma de informática.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-name">Nome da Turma</Label>
            <Input
              id="course-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Introdução ao Python"
              required
              className="rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="course-code">Código da Turma (Opcional)</Label>
            <Input
              id="course-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex: PY-2024-01"
              className="rounded-xl font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">Descrição</Label>
            <Textarea
              id="course-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que os alunos aprenderão nesta turma?"
              rows={3}
              className="rounded-xl"
            />
          </div>

          <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            {loading ? 'Criando...' : 'Criar Turma'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateCourseForm;