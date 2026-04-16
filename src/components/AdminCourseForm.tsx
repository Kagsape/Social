"use client";

import React, { useState, useEffect } from 'react';
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
import { Loader2, Edit3, Plus } from 'lucide-react';

interface AdminCourseFormProps {
  courseId?: string;
  onCourseSaved?: () => void;
}

const AdminCourseForm: React.FC<AdminCourseFormProps> = ({ courseId, onCourseSaved }) => {
  const { user, isAdmin } = useAuth();
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
        setFormData({ 
          name: '', 
          code: '', 
          description: '', 
          teacher_id: user?.id || '' 
        });
      }
    }
  }, [isDialogOpen, courseId, user?.id]);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email')
        .or('role.eq.teacher,role.eq.admin');
      
      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Erro ao buscar professores:', error);
    }
  };

  const fetchCourse = async () => {
    if (!courseId) return;
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();
      
      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          code: data.code,
          description: data.description || '',
          teacher_id: data.teacher_id || data.created_by || ''
        });
      }
    } catch (error) {
      console.error('Erro ao buscar curso:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const courseData = {
        name: formData.name.trim(),
        code: formData.code.trim(),
        description: formData.description.trim() || null,
        teacher_id: formData.teacher_id || user?.id,
        category: 'Tecnologia'
      };

      if (courseId) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', courseId);
        if (error) throw error;
        showSuccess('Curso atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('courses')
          .insert({
            ...courseData,
            created_by: user?.id
          });
        if (error) throw error;
        showSuccess('Curso criado com sucesso!');
      }

      setIsDialogOpen(false);
      onCourseSaved?.();
    } catch (error: any) {
      console.error('Erro ao salvar curso:', error);
      showError(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant={courseId ? "ghost" : "default"} className={courseId ? "w-full justify-start gap-2" : "gap-2"}>
          {courseId ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {courseId ? 'Editar Curso' : 'Novo Curso'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{courseId ? 'Editar Curso' : 'Criar Novo Curso'}</DialogTitle>
            <DialogDescription>
              {courseId 
                ? 'Atualize as informações do curso. Administradores podem reatribuir o professor.'
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
            
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="teacher">Professor Responsável</Label>
                <Select 
                  value={formData.teacher_id} 
                  onValueChange={(value) => setFormData({...formData, teacher_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading || !formData.name || !formData.code}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminCourseForm;