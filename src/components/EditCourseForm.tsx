"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Save, Edit3 } from 'lucide-react';

interface EditCourseFormProps {
  courseId: string;
  onSuccess?: () => void;
}

const EditCourseForm: React.FC<EditCourseFormProps> = ({ courseId, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (error) throw error;
        if (data) {
          setName(data.name);
          setDescription(data.description || '');
          setCode(data.code);
        }
      } catch (error) {
        console.error('Erro ao carregar curso:', error);
        showError('Você não tem permissão para editar este curso ou ele não existe.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const updateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { error } = await supabase
        .from('courses')
        .update({
          name: name.trim(),
          description: description.trim(),
          code: code.trim()
        })
        .eq('id', courseId);

      if (error) throw error;

      showSuccess('Curso atualizado com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Erro ao atualizar curso. Verifique suas permissões.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Edit3 className="h-5 w-5 text-primary" />
          Editar Informações do Curso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={updateCourse} className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Curso</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Código</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} required className="font-mono" />
          </div>
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EditCourseForm;