"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface GradeFormProps {
  courseId: string;
  students: Array<{ id: string; name: string }>;
  onGradesSaved?: () => void;
}

interface GradeEntry {
  studentId: string;
  assignmentName: string;
  grade: string;
  maxGrade: string;
  comments: string;
}

const GradeForm: React.FC<GradeFormProps> = ({ courseId, students, onGradesSaved }) => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<GradeEntry[]>([]);
  const [saving, setSaving] = useState(false);

  const addGradeEntry = () => {
    setGrades(prev => [...prev, {
      studentId: '',
      assignmentName: '',
      grade: '',
      maxGrade: '100',
      comments: ''
    }]);
  };

  const removeGradeEntry = (index: number) => {
    setGrades(prev => prev.filter((_, i) => i !== index));
  };

  const updateGradeEntry = (index: number, field: keyof GradeEntry, value: string) => {
    setGrades(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const saveGrades = async () => {
    if (!user || !courseId) return;

    const validGrades = grades.filter(g => g.studentId && g.assignmentName && g.grade);
    
    if (validGrades.length === 0) {
      showError('Preencha pelo menos uma nota válida.');
      return;
    }

    setSaving(true);
    try {
      const records = validGrades.map(grade => ({
        student_id: grade.studentId,
        course_id: courseId,
        assignment_name: grade.assignmentName.trim(),
        grade: parseFloat(grade.grade),
        max_grade: parseFloat(grade.maxGrade) || 100,
        comments: grade.comments?.trim() || null,
        teacher_id: user.id
      }));

      const { error } = await supabase
        .from('grades')
        .upsert(records, {
          onConflict: 'student_id,course_id,assignment_name'
        });

      if (error) throw error;

      // Notificar alunos individualmente
      const notifications = validGrades.map(grade => ({
        user_id: grade.studentId,
        actor_id: user.id,
        type: 'grade',
        message: `Sua nota em "${grade.assignmentName}" foi lançada.`
      }));

      await supabase.from('notifications').insert(notifications);

      showSuccess('Notas salvas com sucesso!');
      setGrades([]);
      onGradesSaved?.();
    } catch (error: any) {
      console.error('[Grades] Erro ao salvar:', error);
      showError(`Erro ao salvar notas: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold">Lançamento de Notas</CardTitle>
        <Button onClick={addGradeEntry} size="sm" className="gap-2 rounded-xl">
          <Plus className="h-4 w-4" /> Adicionar Nota
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {grades.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
            Nenhuma nota pendente de envio.
          </div>
        ) : (
          <div className="space-y-4">
            {grades.map((gradeEntry, index) => (
              <div key={index} className="p-4 border rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 space-y-4 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                    <div className="space-y-2">
                      <Label>Aluno</Label>
                      <select
                        value={gradeEntry.studentId}
                        onChange={(e) => updateGradeEntry(index, 'studentId', e.target.value)}
                        className="w-full p-2 border rounded-xl bg-background text-sm"
                      >
                        <option value="">Selecione um aluno</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>{student.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Atividade</Label>
                      <Input
                        placeholder="Ex: Prova 1, Trabalho..."
                        value={gradeEntry.assignmentName}
                        onChange={(e) => updateGradeEntry(index, 'assignmentName', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nota</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0.0"
                        value={gradeEntry.grade}
                        onChange={(e) => updateGradeEntry(index, 'grade', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nota Máxima</Label>
                      <Input
                        type="number"
                        value={gradeEntry.maxGrade}
                        onChange={(e) => updateGradeEntry(index, 'maxGrade', e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeGradeEntry(index)}
                    className="text-destructive hover:bg-destructive/10 rounded-full"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Feedback (opcional)</Label>
                  <Textarea
                    placeholder="Comentários para o aluno..."
                    value={gradeEntry.comments}
                    onChange={(e) => updateGradeEntry(index, 'comments', e.target.value)}
                    rows={2}
                    className="rounded-xl"
                  />
                </div>
              </div>
            ))}
            
            <Button 
              onClick={saveGrades} 
              disabled={saving} 
              className="w-full rounded-xl h-12 font-bold shadow-lg"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Salvar Todas as Notas</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GradeForm;