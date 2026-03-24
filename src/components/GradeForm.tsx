"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save } from 'lucide-react';
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
    if (!user) return;

    setSaving(true);
    try {
      const validGrades = grades.filter(g => g.studentId && g.assignmentName && g.grade);

      const records = validGrades.map(grade => ({
        student_id: grade.studentId,
        course_id: courseId,
        assignment_name: grade.assignmentName,
        grade: parseFloat(grade.grade),
        max_grade: parseFloat(grade.maxGrade) || 100,
        comments: grade.comments || null,
        teacher_id: user.id
      }));

      // Upsert grades (insert or update)
      const { error } = await supabase
        .from('grades')
        .upsert(records, {
          onConflict: 'student_id,course_id,assignment_name'
        });

      if (error) throw error;

      showSuccess('Notas salvas com sucesso!');
      setGrades([]);
      onGradesSaved?.();
    } catch (error) {
      console.error('Error saving grades:', error);
      showError('Erro ao salvar notas');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Gerenciar Notas</span>
          <Button onClick={addGradeEntry} size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Nota
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {grades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Clique em "Adicionar Nota" para começar
          </div>
        ) : (
          grades.map((gradeEntry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                  <div className="space-y-2">
                    <Label htmlFor={`student-${index}`}>Aluno</Label>
                    <select
                      id={`student-${index}`}
                      value={gradeEntry.studentId}
                      onChange={(e) => updateGradeEntry(index, 'studentId', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione um aluno</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>{student.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`assignment-${index}`}>Trabalho/Prova</Label>
                    <Input
                      id={`assignment-${index}`}
                      placeholder="Ex: Prova 1, Trabalho Final..."
                      value={gradeEntry.assignmentName}
                      onChange={(e) => updateGradeEntry(index, 'assignmentName', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`grade-${index}`}>Nota</Label>
                    <Input
                      id={`grade-${index}`}
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="0.0"
                      value={gradeEntry.grade}
                      onChange={(e) => updateGradeEntry(index, 'grade', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`maxGrade-${index}`}>Nota Máxima</Label>
                    <Input
                      id={`maxGrade-${index}`}
                      type="number"
                      min="1"
                      value={gradeEntry.maxGrade}
                      onChange={(e) => updateGradeEntry(index, 'maxGrade', e.target.value)}
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeGradeEntry(index)}
                  className="ml-2 shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`comments-${index}`}>Comentários (opcional)</Label>
                <Textarea
                  id={`comments-${index}`}
                  placeholder="Feedback para o aluno..."
                  value={gradeEntry.comments}
                  onChange={(e) => updateGradeEntry(index, 'comments', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          ))
        )}

        {grades.length > 0 && (
          <Button onClick={saveGrades} disabled={saving} className="w-full gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Todas as Notas'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GradeForm;