"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, UserPlus, Loader2, Check, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollArea } from "@/components/ui/scroll-area";

interface EnrollStudentDialogProps {
  courseId: string;
  courseName: string;
  onEnrollmentSuccess?: () => void;
}

const EnrollStudentDialog: React.FC<EnrollStudentDialogProps> = ({ courseId, courseName, onEnrollmentSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Buscar alunos que não estão matriculados neste curso
      const { data: enrolledData } = await supabase
        .from('enrollments')
        .select('student_id')
        .eq('course_id', courseId);
      
      const enrolledIds = enrolledData?.map(e => e.student_id) || [];

      let query = supabase
        .from('users')
        .select('id, name, avatar_url, student_id')
        .eq('role', 'student')
        .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`)
        .limit(10);

      const { data, error } = await query;
      if (error) throw error;

      // Marcar quem já está matriculado
      const processed = (data || []).map(s => ({
        ...s,
        isAlreadyEnrolled: enrolledIds.includes(s.id)
      }));

      setStudents(processed);
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
      showError('Erro ao pesquisar alunos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) searchStudents();
      else setStudents([]);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEnroll = async (student: any) => {
    setEnrollingId(student.id);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: courseId,
          student_id: student.id,
          status: 'active'
        });

      if (error) throw error;

      showSuccess(`${student.name} matriculado com sucesso!`);
      
      // Atualizar lista local
      setStudents(prev => prev.map(s => 
        s.id === student.id ? { ...s, isAlreadyEnrolled: true } : s
      ));
      
      onEnrollmentSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Erro ao matricular aluno.');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 rounded-xl border-dashed">
          <UserPlus className="h-4 w-4" /> Matricular Aluno
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Matricular Aluno</DialogTitle>
          <DialogDescription>
            Pesquise um aluno para adicionar manualmente ao curso <strong>{courseName}</strong>.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="search">Nome ou Matrícula</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Ex: João Silva ou 2024..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
          </div>

          <ScrollArea className="h-[250px] pr-4">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
                </div>
              ) : students.length === 0 && searchTerm ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Nenhum aluno encontrado.</p>
              ) : (
                students.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-2 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{student.student_id}</p>
                      </div>
                    </div>
                    
                    {student.isAlreadyEnrolled ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        <Check className="h-3 w-3 mr-1" /> Matriculado
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-white"
                        onClick={() => handleEnroll(student)}
                        disabled={enrollingId === student.id}
                      >
                        {enrollingId === student.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserPlus className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Badge } from "@/components/ui/badge";
export default EnrollStudentDialog;