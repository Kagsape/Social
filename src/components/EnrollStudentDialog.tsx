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
import { Search, UserPlus, Loader2, Check, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface EnrollStudentDialogProps {
  courseId: string;
  courseName: string;
  onEnrollmentSuccess?: () => void;
}

const EnrollStudentDialog: React.FC<EnrollStudentDialogProps> = ({ courseId, courseName, onEnrollmentSuccess }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // 1. Buscar alunos já matriculados ou pré-matriculados
      const { data: enrolled } = await supabase.from('enrollments').select('student_id').eq('course_id', courseId);
      const { data: pending } = await supabase.from('pending_enrollments').select('registration_id').eq('course_id', courseId);
      
      const enrolledUserIds = enrolled?.map(e => e.student_id) || [];
      const pendingRegIds = pending?.map(p => p.registration_id) || [];

      // 2. Buscar usuários reais
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar_url, student_id')
        .eq('role', 'student')
        .or(`name.ilike.%${searchTerm}%,student_id.ilike.%${searchTerm}%`)
        .limit(5);

      // 3. Buscar na Whitelist (alunos que ainda não tem conta)
      const { data: whitelist } = await supabase
        .from('registration_whitelist')
        .select('registration_id, name')
        .eq('role', 'student')
        .or(`name.ilike.%${searchTerm}%,registration_id.ilike.%${searchTerm}%`)
        .limit(5);

      // 4. Combinar e processar resultados
      const combined: any[] = [];

      // Adicionar usuários reais
      users?.forEach(u => {
        combined.push({
          ...u,
          type: 'user',
          isAlreadyEnrolled: enrolledUserIds.includes(u.id)
        });
      });

      // Adicionar whitelist (apenas se não houver usuário real com esse ID)
      whitelist?.forEach(w => {
        const userExists = users?.some(u => u.student_id === w.registration_id);
        if (!userExists) {
          combined.push({
            id: w.registration_id,
            name: w.name,
            student_id: w.registration_id,
            type: 'whitelist',
            isAlreadyEnrolled: pendingRegIds.includes(w.registration_id)
          });
        }
      });

      setResults(combined);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) searchStudents();
      else setResults([]);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleEnroll = async (item: any) => {
    setEnrollingId(item.id);
    try {
      if (item.type === 'user') {
        const { error } = await supabase.from('enrollments').insert({
          course_id: courseId,
          student_id: item.id,
          status: 'active'
        });
        if (error) throw error;
        showSuccess(`${item.name} matriculado!`);
      } else {
        // Pré-matrícula para quem não tem conta
        const { error } = await supabase.from('pending_enrollments').insert({
          course_id: courseId,
          registration_id: item.student_id
        });
        if (error) throw error;
        showSuccess(`${item.name} pré-matriculado! Ele entrará no curso assim que criar a conta.`);
      }
      
      searchStudents();
      onEnrollmentSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Erro ao matricular.');
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
          <DialogDescription>Busque por nome ou matrícula (incluindo alunos sem conta).</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ex: João Silva..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary/50" /></div>
              ) : results.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50 dark:bg-slate-800/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={item.avatar_url} />
                      <AvatarFallback>{item.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{item.student_id}</span>
                        {item.type === 'whitelist' && <Badge variant="outline" className="text-[8px] h-3 px-1">Sem Conta</Badge>}
                      </div>
                    </div>
                  </div>
                  
                  {item.isAlreadyEnrolled ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Check className="h-3 w-3 mr-1" /> {item.type === 'user' ? 'Matriculado' : 'Na Fila'}
                    </Badge>
                  ) : (
                    <Button 
                      size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full hover:bg-primary hover:text-white"
                      onClick={() => handleEnroll(item)}
                      disabled={enrollingId === item.id}
                    >
                      {enrollingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnrollStudentDialog;