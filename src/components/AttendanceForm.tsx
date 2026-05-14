"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  Monitor,
  Search,
  Filter,
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AttendanceFormProps {
  courseId: string;
  students: Array<{ id: string; name: string }>;
  onAttendanceSaved?: () => void;
}

type AttendanceStatus = 'present' | 'absent' | 'late';

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  courseId, 
  students, 
  onAttendanceSaved 
}) => {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasLabSession, setHasLabSession] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'present' | 'absent'>('all');

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
    const total = students.length;
    const present = Object.values(attendance).filter(s => s === 'present').length;
    const absent = Object.values(attendance).filter(s => s === 'absent').length;
    const late = Object.values(attendance).filter(s => s === 'late').length;
    const marked = Object.keys(attendance).length;
    const pending = total - marked;

    return { total, present, absent, late, pending, marked };
  }, [students, attendance]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
      const status = attendance[student.id];
      
      if (!matchesSearch) return false;
      
      if (filterTab === 'pending') return !status;
      if (filterTab === 'present') return status === 'present' || status === 'late';
      if (filterTab === 'absent') return status === 'absent';
      
      return true;
    });
  }, [students, searchTerm, filterTab, attendance]);

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
    showSuccess('Todos os alunos marcados como presente.');
  };

  const markRemainingAbsent = () => {
    const newAttendance = { ...attendance };
    let count = 0;
    students.forEach(s => {
      if (!newAttendance[s.id]) {
        newAttendance[s.id] = 'absent';
        count++;
      }
    });
    setAttendance(newAttendance);
    if (count > 0) showSuccess(`${count} alunos marcados com falta.`);
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
    <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900">
      <CardHeader className="bg-slate-50/50 dark:bg-slate-800/30 border-b pb-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-2xl font-black">
              <UserCheck className="h-6 w-6 text-primary" />
              Diário de Classe
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono">
                {format(date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Badge>
              {hasLabSession && (
                <Badge className="bg-blue-500 hover:bg-blue-600 gap-1">
                  <Monitor className="h-3 w-3" /> Aula no Lab
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1 md:w-[180px] justify-start text-left font-bold rounded-xl bg-white dark:bg-slate-950 border-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {format(date, "dd/MM/yyyy")}
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
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-950 p-3 rounded-2xl border-2 shadow-sm">
            <p className="text-[10px] uppercase font-black text-muted-foreground mb-1">Total Alunos</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black">{stats.total}</span>
              <span className="text-xs text-muted-foreground">estudantes</span>
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-2xl border-2 border-green-100 dark:border-green-900/30 shadow-sm">
            <p className="text-[10px] uppercase font-black text-green-600 mb-1">Presentes</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-green-600">{stats.present + stats.late}</span>
              <span className="text-xs text-green-600/70">ativos</span>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-2xl border-2 border-red-100 dark:border-red-900/30 shadow-sm">
            <p className="text-[10px] uppercase font-black text-red-600 mb-1">Faltas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-red-600">{stats.absent}</span>
              <span className="text-xs text-red-600/70">ausentes</span>
            </div>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-2xl border-2 border-amber-100 dark:border-amber-900/30 shadow-sm">
            <p className="text-[10px] uppercase font-black text-amber-600 mb-1">Pendentes</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-600">{stats.pending}</span>
              <span className="text-xs text-amber-600/70">não marcados</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="p-4 border-b bg-slate-50/30 dark:bg-slate-800/10 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar aluno pelo nome..." 
              className="pl-10 rounded-xl border-2 focus-visible:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={filterTab} onValueChange={(v: any) => setFilterTab(v)} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-4 w-full rounded-xl bg-muted/50 p-1">
              <TabsTrigger value="all" className="text-[10px] md:text-xs font-bold">Todos</TabsTrigger>
              <TabsTrigger value="pending" className="text-[10px] md:text-xs font-bold">Faltam</TabsTrigger>
              <TabsTrigger value="present" className="text-[10px] md:text-xs font-bold">Pres.</TabsTrigger>
              <TabsTrigger value="absent" className="text-[10px] md:text-xs font-bold">Faltas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-4 flex flex-wrap gap-2 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markAllPresent}
            className="rounded-full gap-2 font-bold text-xs h-8"
            disabled={loading || students.length === 0}
          >
            <CheckCheck className="h-3.5 w-3.5" /> Marcar Todos Presentes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={markRemainingAbsent}
            className="rounded-full gap-2 font-bold text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={loading || stats.pending === 0}
          >
            <UserMinus className="h-3.5 w-3.5" /> Marcar Restantes com Falta
          </Button>
        </div>

        <div className="max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
              <p className="text-sm text-muted-foreground font-medium">Carregando lista de alunos...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-slate-100 dark:bg-slate-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="font-bold text-lg">Nenhum aluno encontrado</h3>
              <p className="text-sm text-muted-foreground">Tente ajustar sua busca ou filtro.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredStudents.map(student => {
                const status = attendance[student.id];
                return (
                  <div 
                    key={student.id} 
                    className={cn(
                      "flex items-center justify-between p-4 transition-all",
                      status === 'present' ? "bg-green-50/30 dark:bg-green-900/5" : 
                      status === 'absent' ? "bg-red-50/30 dark:bg-red-900/5" : 
                      status === 'late' ? "bg-amber-50/30 dark:bg-amber-900/5" : 
                      "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    )}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={cn(
                        "h-10 w-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm shrink-0",
                        status === 'present' ? "bg-green-600 text-white" : 
                        status === 'absent' ? "bg-red-600 text-white" : 
                        status === 'late' ? "bg-amber-500 text-white" : 
                        "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      )}>
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">ID: {student.id.split('-')[0]}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border shadow-sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAttendanceChange(student.id, 'present')}
                        className={cn(
                          "h-9 px-3 rounded-lg gap-2 font-bold text-[10px] uppercase tracking-wider transition-all",
                          status === 'present' 
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-md" 
                            : "text-muted-foreground hover:bg-green-50 hover:text-green-600"
                        )}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Presente</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAttendanceChange(student.id, 'absent')}
                        className={cn(
                          "h-9 px-3 rounded-lg gap-2 font-bold text-[10px] uppercase tracking-wider transition-all",
                          status === 'absent' 
                            ? "bg-red-600 text-white hover:bg-red-700 shadow-md" 
                            : "text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        )}
                      >
                        <UserX className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Faltou</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleAttendanceChange(student.id, 'late')}
                        className={cn(
                          "h-9 px-3 rounded-lg gap-2 font-bold text-[10px] uppercase tracking-wider transition-all",
                          status === 'late' 
                            ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md" 
                            : "text-muted-foreground hover:bg-amber-50 hover:text-amber-600"
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Atraso</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-800/30 border-t">
          {stats.pending > 0 && (
            <div className="flex items-center gap-2 text-amber-600 mb-4 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-xs font-bold">Atenção: Ainda restam {stats.pending} alunos sem marcação.</p>
            </div>
          )}
          
          <Button 
            onClick={saveAttendance} 
            disabled={saving || loading || students.length === 0}
            className="w-full rounded-2xl h-14 text-lg font-black shadow-xl transition-all active:scale-[0.98] gap-2"
          >
            {saving ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Salvando Chamada...</>
            ) : (
              <><CheckCircle className="h-5 w-5" /> Finalizar e Salvar Diário</>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-4 uppercase font-bold tracking-widest">
            Os dados serão registrados permanentemente no histórico do curso
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;