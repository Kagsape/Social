"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar as CalendarIcon, 
  Loader2,
  Users,
  CheckCheck,
  Monitor
} from 'lucide-react';
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
  const [hasLabSession, setHasLabSession] = useState(false);

  const fetchExistingAttendance = useCallback(async () => {
    if (!courseId || !date) return;
    
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Buscar frequência
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      if (attendanceError) throw attendanceError;

      const existingRecords: Record<string, 'present' | 'absent' | 'late'> = {};
      attendanceData?.forEach(record => {
        existingRecords[record.student_id] = record.status as any;
      });
      
      setAttendance(existingRecords);

      // Verificar se houve reserva de laboratório para esta turma nesta data
      const { data: labData } = await supabase
        .from('lab_usage')
        .select('id')
        .eq('course_id', courseId)
        .gte('start_time', `${formattedDate}T00:00:00`)
        .lte('start_time', `${formattedDate}T23:59:59`)
        .maybeSingle();

      setHasLabSession(!!labData);

    } catch (error) {
      console.error('[Attendance] Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [courseId, date]);

  useEffect(() => {
    fetchExistingAttendance();
  }, [fetchExistingAttendance]);

  const stats = useMemo(() => {
    const total = students.length;
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    const pending = total - Object.keys(attendance).length;

    return { total, present, absent, late, pending };
  }, [students, attendance]);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllPresent = () => {
    const allPresent: Record<string, 'present'> = {};
    students.forEach(s => {
      allPresent[s.id] = 'present';
    });
    setAttendance(allPresent);
    showSuccess('Todos os alunos marcados como presente.');
  };

  const saveAttendance = async () => {
    if (!user || !courseId) return;

    setSaving(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { error: deleteError } = await supabase
        .from('attendance')
        .delete()
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      if (deleteError) throw deleteError;

      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: courseId,
        date: formattedDate,
        status,
        recorded_by: user.id
      }));

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
      showError(`Erro ao salvar frequência: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Diário de Classe
            </CardTitle>
            {hasLabSession && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
                <Monitor className="h-3 w-3" /> Aula no Laboratório
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 md:w-[200px] justify-start text-left font-normal rounded-xl bg-white dark:bg-slate-950"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Data"}
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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={markAllPresent}
              className="rounded-xl gap-2 bg-white dark:bg-slate-950"
              disabled={loading || students.length === 0}
            >
              <CheckCheck className="h-4 w-4" /> Marcar Todos
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border text-center">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
            <p className="text-lg font-black">{stats.total}</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg border border-green-100 dark:border-green-900/30 text-center">
            <p className="text-[10px] uppercase font-bold text-green-600">Pres.</p>
            <p className="text-lg font-black text-green-600">{stats.present}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30 text-center">
            <p className="text-[10px] uppercase font-bold text-red-600">Faltas</p>
            <p className="text-lg font-black text-red-600">{stats.absent}</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30 text-center">
            <p className="text-[10px] uppercase font-bold text-yellow-600">Atraso</p>
            <p className="text-lg font-black text-yellow-600">{stats.late}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
            Nenhum aluno matriculado neste curso.
          </div>
        ) : (
          <div className="grid gap-2">
            {students.map(student => (
              <div 
                key={student.id} 
                className={cn(
                  "flex items-center justify-between p-3 border rounded-xl transition-colors",
                  attendance[student.id] === 'present' ? "bg-green-50/30 border-green-100 dark:bg-green-900/5" : 
                  attendance[student.id] === 'absent' ? "bg-red-50/30 border-red-100 dark:bg-red-900/5" : 
                  "bg-slate-50/50 dark:bg-slate-800/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs",
                    attendance[student.id] === 'present' ? "bg-green-100 text-green-700" : 
                    attendance[student.id] === 'absent' ? "bg-red-100 text-red-700" : 
                    "bg-primary/10 text-primary"
                  )}>
                    {student.name.charAt(0)}
                  </div>
                  <span className="font-bold text-sm truncate max-w-[120px] md:max-w-none">{student.name}</span>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'present' ? 'default' : 'ghost'}
                    onClick={() => handleAttendanceChange(student.id, 'present')}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg",
                      attendance[student.id] === 'present' ? "bg-green-600 hover:bg-green-700" : "text-muted-foreground"
                    )}
                    title="Presente"
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'absent' ? 'destructive' : 'ghost'}
                    onClick={() => handleAttendanceChange(student.id, 'absent')}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg",
                      attendance[student.id] === 'absent' ? "bg-red-600 hover:bg-red-700" : "text-muted-foreground"
                    )}
                    title="Faltou"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={attendance[student.id] === 'late' ? 'secondary' : 'ghost'}
                    onClick={() => handleAttendanceChange(student.id, 'late')}
                    className={cn(
                      "h-8 w-8 p-0 rounded-lg",
                      attendance[student.id] === 'late' ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "text-muted-foreground"
                    )}
                    title="Atrasado"
                  >
                    <Clock className="h-4 w-4" />
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
          ) : 'Finalizar Chamada'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;