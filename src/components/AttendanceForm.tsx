"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar as CalendarIcon, 
  Loader2,
  CheckCheck,
  Monitor,
  Search,
  UserMinus,
  AlertCircle
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

type AttendanceStatus = 'present' | 'absent' | 'late';

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  courseId, 
  students = [], 
  onAttendanceSaved 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLabSession, setHasLabSession] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'present' | 'absent'>('all');

  const fetchExistingAttendance = useCallback(async () => {
    if (!courseId || !date) return;
    
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      if (attendanceError) throw attendanceError;

      const existingRecords: Record<string, AttendanceStatus> = {};
      attendanceData?.forEach(record => {
        existingRecords[record.student_id] = record.status as any;
      });
      
      setAttendance(existingRecords);

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
    const total = students?.length || 0;
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    const marked = Object.keys(attendance).length;
    const pending = total - marked;

    return { total, present, absent, late, pending, marked };
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = attendance[student.id];
      
      if (!matchesSearch) return false;
      
      if (filter === 'pending') return !status;
      if (filter === 'present') return status === 'present' || status === 'late';
      if (filter === 'absent') return status === 'absent';
      
      return true;
    });
  }, [students, searchTerm, filter, attendance]);

  const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => {
      if (prev[studentId] === status) {
        const next = { ...prev };
        delete next[studentId];
        return next;
      }
      return { ...prev, [studentId]: status };
    });
  };

  const markAllPresent = () => {
    const allPresent: Record<string, AttendanceStatus> = {};
    students.forEach(s => {
      allPresent[s.id] = 'present';
    });
    setAttendance(allPresent);
    showSuccess('Todos marcados como presente.');
  };

  const markRemainingAbsent = () => {
    const newAttendance = { ...attendance };
    students.forEach(s => {
      if (!newAttendance[s.id]) {
        newAttendance[s.id] = 'absent';
      }
    });
    setAttendance(newAttendance);
    showSuccess('Restantes marcados com falta.');
  };

  const saveAttendance = async () => {
    if (!user || !courseId) return;

    setSaving(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', courseId)
        .eq('date', formattedDate);

      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: courseId,
        date: formattedDate,
        status,
        recorded_by: user.id
      }));

      if (records.length > 0) {
        const { error } = await supabase.from('attendance').insert(records);
        if (error) throw error;
      }

      showSuccess('Frequência salva!');
      onAttendanceSaved?.();
    } catch (error: any) {
      showError(`Erro ao salvar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!students || students.length === 0) {
    return (
      <Card className="border-dashed py-12 text-center">
        <CardContent className="space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
          <p className="text-muted-foreground">Nenhum aluno matriculado nesta turma para fazer a chamada.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              Chamada do Dia
            </CardTitle>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 rounded-lg">
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {format(date, "dd/MM/yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
              {hasLabSession && <Badge className="bg-blue-500 gap-1"><Monitor className="h-3 w-3" /> Lab</Badge>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllPresent} className="rounded-lg text-xs">
              <CheckCheck className="h-3.5 w-3.5 mr-1" /> Todos Presentes
            </Button>
            <Button variant="outline" size="sm" onClick={markRemainingAbsent} className="rounded-lg text-xs text-red-600">
              <UserMinus className="h-3.5 w-3.5 mr-1" /> Faltas Restantes
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Total', val: stats.total, color: 'text-foreground' },
            { label: 'Pres.', val: stats.present + stats.late, color: 'text-green-600' },
            { label: 'Faltas', val: stats.absent, color: 'text-red-600' },
            { label: 'Pend.', val: stats.pending, color: 'text-amber-600' }
          ].map((s, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg text-center">
              <p className="text-[9px] uppercase font-bold text-muted-foreground">{s.label}</p>
              <p className={cn("text-lg font-black", s.color)}>{s.val}</p>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar aluno..." 
              className="pl-9 h-9 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-muted p-1 rounded-lg gap-1">
            {(['all', 'pending', 'present', 'absent'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all capitalize",
                  filter === f ? "bg-white dark:bg-slate-700 shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Faltam' : f === 'present' ? 'Pres.' : 'Faltas'}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y border rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto opacity-20" /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">Nenhum aluno encontrado.</div>
          ) : (
            filteredStudents.map(student => {
              const status = attendance[student.id];
              return (
                <div key={student.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className="font-bold text-sm truncate">{student.name}</p>
                    {status && (
                      <Badge variant="outline" className={cn(
                        "text-[8px] h-4 px-1 uppercase",
                        status === 'present' ? "border-green-500 text-green-600" : 
                        status === 'absent' ? "border-red-500 text-red-600" : "border-amber-500 text-amber-600"
                      )}>
                        {status === 'present' ? 'Presente' : status === 'absent' ? 'Faltou' : 'Atraso'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant={status === 'present' ? 'default' : 'outline'}
                      className={cn("h-8 w-8 rounded-lg", status === 'present' && "bg-green-600 hover:bg-green-700")}
                      onClick={() => handleAttendanceChange(student.id, 'present')}
                    >
                      <UserCheck className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={status === 'absent' ? 'destructive' : 'outline'}
                      className="h-8 w-8 rounded-lg"
                      onClick={() => handleAttendanceChange(student.id, 'absent')}
                    >
                      <UserX className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant={status === 'late' ? 'default' : 'outline'}
                      className={cn("h-8 w-8 rounded-lg", status === 'late' && "bg-amber-500 hover:bg-amber-600")}
                      onClick={() => handleAttendanceChange(student.id, 'late')}
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Button 
          onClick={saveAttendance} 
          disabled={saving || loading}
          className="w-full rounded-xl h-12 font-bold shadow-lg gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
          Salvar Chamada
        </Button>
      </CardContent>
    </Card>
  );
};

import { UserX } from 'lucide-react';
export default AttendanceForm;