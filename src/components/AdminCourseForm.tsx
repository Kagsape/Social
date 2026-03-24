"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminCourseFormProps {
  courseId?: string;
  onCourseSaved?: () => void;
}

const AdminCourseForm: React.FC<AdminCourseFormProps> = ({ courseId, onCourseSaved }) => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    teacher_id: ''
  });
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (isDialogOpen) {
      fetchTeachers();
      if (courseId) {
        fetchCourse();
      } else {
        setFormData({ name: '', code: '', description: '', teacher_id: '' });
      }
    }
  }, [isDialogOpen, courseId]);

  const fetchTeachers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'teacher');
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      if (data) {
        setFormData({
          name: data.name,
          code: data.code,
          description: data.description || '',
          teacher_id: data.teacher_id || ''
        });
      }
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const courseData = {
        ...formData,
        teacher_id: formData.teacher_id || null
      };

      let error;
      if (courseId) {
        ({ error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId));
      } else {
        ({ error } = await supabase
          .from('courses')
          .insert(courseData));
      }

      if (error) throw error;

      showSuccess(courseId ? 'Curso atualizado com sucesso!' : 'Curso criado com sucesso!');
      setIsDialogOpen(false);
      onCourseSaved?.();
    } catch (error) {
      console.error('Error saving course:', error);
      showError('Erro ao salvar curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button>{courseId ? 'Editar Curso' : 'Novo Curso'}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{courseId ? 'Editar Curso' : 'Criar Novo Curso'}</DialogTitle>
            <DialogDescription>
              {courseId 
                ? 'Atualize as informações do curso.'
                : 'Preencha as informações para criar um novo curso.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Curso</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="teacher">Professor (opcional)</Label>
              <Select 
                value={formData.teacher_id} 
                onValueChange={(value) => setFormData({...formData, teacher_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um professor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {teachers.map(teacher => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !formData.name || !formData.code}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCourseForm;