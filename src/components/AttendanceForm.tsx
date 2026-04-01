"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, UserCheck, UserX, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceFormProps {
  courseId: string;
  students: Array<{ id: string; name: string }>;
  onAttendanceSaved?: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  courseId, 
  students, 
  onAttendanceSaved 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchExistingAttendance = useCallback(async () => {
    if (!courseId || !date) return;
    
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      if (error) throw error;

      const existingRecords: Record<string, 'present' | 'absent' | 'late'> = {};
      data?.forEach(record => {
        existingRecords[record.student_id] = record.status as any;
      });
      
      setAttendance(existingRecords);
    } catch (error) {
      console.error('[Attendance] Erro ao buscar frequência:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, date]);

  useEffect(() => {
    fetchExistingAttendance();
  }, [fetchExistingAttendance]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!user || !courseId) return;

    setSaving(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // 1. Deletar registros existentes para esta data e curso
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      if (deleteError) throw deleteError;

      // 2. Preparar novos registros
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: courseId,
        date: formattedDate,
        status,
        recorded_by: user.id
      }));

      // 3. Inserir novos registros se houver algum
      if (records.length > 0) {
        const { error: insertError } = await supabase
          .from('attendance')
          .insert(records);

        if (insertError) throw insertError;
      }

      showSuccess('Frequência salva com sucesso!');
      onAttendanceSaved?.();
    } catch (error: any) {
      console.error('[Attendance] Erro ao salvar:', error);
      showError(`Erro ao salvar frequência: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <UserCheck className="h-4 w-4 text-green-600" />;
      case 'absent': return <UserX className="h-4 w-4 text-red-600" />;
      case 'late': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return null;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'present': return 'default' as const;
      case 'absent': return 'destructive' as const;
      case 'late': return 'secondary' as const;
      default: return 'outline' as const;
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          Diário de Classe
        </CardTitle>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full md:w-[240px] justify-start text-left font-normal rounded-xl",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP", { locale: ptBR }) : "Selecionar data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => d && setDate(d)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
            Nenhum aluno matriculado neste curso.
          </div>
        ) : (
          <div className="grid gap-3">
            {students.map(student => (
              <div key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {student.name.charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold text-sm">{student.name}</span>
                    {attendance[student.id] && (
                      <div className="flex items-center gap-1">
                        <Badge variant={getStatusBadgeVariant(attendance[student.id])} className="text-[10px] h-5 px-2 gap-1">
                          {getStatusIcon(attendance[student.id])}
                          {attendance[student.id] === 'present' ? 'Presente' : 
                           attendance[student.id] === 'absent' ? 'Faltou' : 'Atrasado'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    className="flex-1 sm:flex-none rounded-lg h-9"
                  >
                    P
                  </Button>
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                    className="flex-1 sm:flex-none rounded-lg h-9"
                  >
                    F
                  </Button>
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'late' ? 'secondary' : 'outline'}
                    onClick={() => handleAttendanceChange(student.id, 'late')}
                    className="flex-1 sm:flex-none rounded-lg h-9"
                  >
                    A
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={saveAttendance} 
          disabled={saving || loading || students.length === 0}
          className="w-full rounded-xl h-12 font-bold shadow-lg transition-all active:scale-[0.98]"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Salvando...</>
          ) : 'Salvar Frequência'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;