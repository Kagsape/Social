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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Users, Info, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

interface ComputerReservationFormProps {
  onReservationCreated?: () => void;
}

const ComputerReservationForm: React.FC<ComputerReservationFormProps> = ({ onReservationCreated }) => {
  const { user, userProfile } = useAuth();
  const [computers, setComputers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedComputer, setSelectedComputer] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [purpose, setPurpose] = useState('');
  const [usageDetails, setUsageDetails] = useState('');
  const [saving, setSaving] = useState(false);

  const isAuthorized = userProfile?.role === 'teacher' || userProfile?.role === 'admin';

  useEffect(() => {
    if (isAuthorized) {
      fetchComputers();
      fetchCourses();
      fetchStudents();
    }
  }, [userProfile, isAuthorized]);

  const fetchComputers = async () => {
    const { data } = await supabase.from('lab_computers').select('*').eq('status', 'working').order('name');
    setComputers(data || []);
  };

  const fetchCourses = async () => {
    let query = supabase.from('courses').select('*');
    if (userProfile?.role === 'teacher') query = query.eq('teacher_id', user?.id);
    const { data } = await query;
    setCourses(data || []);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('users').select('id, name').eq('role', 'student').order('name');
    setStudents(data || []);
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;

    setSaving(true);
    try {
      // Combinamos os detalhes no campo purpose para garantir compatibilidade com o banco
      const fullPurpose = `
        ATIVIDADE: ${purpose}
        USO DOS ITENS: ${usageDetails}
        ALUNOS: ${students.filter(s => selectedStudents.includes(s.id)).map(s => s.name).join(', ')}
      `.trim();

      const { error } = await supabase
        .from('lab_usage')
        .insert({
          computer_id: selectedComputer,
          course_id: selectedCourse || null,
          teacher_id: user.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          purpose: fullPurpose,
          status: 'scheduled'
        });

      if (error) throw error;

      showSuccess('Reserva do laboratório criada com sucesso!');
      setSelectedComputer('');
      setSelectedCourse('');
      setSelectedStudents([]);
      setStartDate(undefined);
      setEndDate(undefined);
      setPurpose('');
      setUsageDetails('');
      onReservationCreated?.();
    } catch (error) {
      showError('Erro ao criar reserva');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-4">
          <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-full w-fit mx-auto">
            <Info className="h-6 w-6 text-amber-600" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold">Acesso Restrito</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Apenas professores podem realizar reservas de computadores e salas para aulas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-primary" />
          Nova Reserva de Aula
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="computer">Computador / Estação</Label>
                <select
                  id="computer"
                  value={selectedComputer}
                  onChange={(e) => setSelectedComputer(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-background"
                  required
                >
                  <option value="">Selecione a máquina</option>
                  {computers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} - {c.location}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Turma / Curso</Label>
                <select
                  id="course"
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-background"
                  required
                >
                  <option value="">Selecione a turma</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "dd/MM HH:mm") : "Data/Hora"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      <div className="p-3 border-t">
                        <Input type="time" onChange={(e) => {
                          if (startDate) {
                            const [h, m] = e.target.value.split(':');
                            const newDate = new Date(startDate);
                            newDate.setHours(parseInt(h), parseInt(m));
                            setStartDate(newDate);
                          }
                        }} />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Término</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal rounded-xl">
                        <Clock className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "dd/MM HH:mm") : "Data/Hora"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      <div className="p-3 border-t">
                        <Input type="time" onChange={(e) => {
                          if (endDate) {
                            const [h, m] = e.target.value.split(':');
                            const newDate = new Date(endDate);
                            newDate.setHours(parseInt(h), parseInt(m));
                            setEndDate(newDate);
                          }
                        }} />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alunos Participantes ({selectedStudents.length})</Label>
                <Card className="border bg-slate-50/50 dark:bg-slate-800/30">
                  <ScrollArea className="h-[180px] p-3">
                    <div className="space-y-2">
                      {students.map(student => (
                        <div key={student.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`student-${student.id}`} 
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudent(student.id)}
                          />
                          <label htmlFor={`student-${student.id}`} className="text-sm font-medium leading-none cursor-pointer">
                            {student.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">O que será feito na aula?</Label>
              <Input
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Ex: Aula prática de algoritmos"
                required
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="usage">Como os itens serão usados?</Label>
              <Textarea
                id="usage"
                value={usageDetails}
                onChange={(e) => setUsageDetails(e.target.value)}
                placeholder="Descreva o uso dos equipamentos e materiais..."
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>

          <Button type="submit" disabled={saving || !selectedComputer || !startDate || !endDate} className="w-full rounded-xl h-12 font-bold shadow-lg">
            {saving ? 'Criando Reserva...' : 'Confirmar Reserva de Aula'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComputerReservationForm;