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
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComputerReservationFormProps {
  onReservationCreated?: () => void;
}

const ComputerReservationForm: React.FC<ComputerReservationFormProps> = ({ onReservationCreated }) => {
  const { user, userProfile } = useAuth();
  const [computers, setComputers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedComputer, setSelectedComputer] = useState<string>('');
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [purpose, setPurpose] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchComputers();
    if (userProfile?.role === 'teacher' || userProfile?.role === 'admin') {
      fetchCourses();
    }
  }, [userProfile]);

  const fetchComputers = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working')
        .order('name');

      if (error) throw error;
      setComputers(data || []);
    } catch (error) {
      console.error('Error fetching computers:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      let query = supabase.from('courses').select('*');
      if (userProfile?.role === 'teacher') {
        query = query.eq('teacher_id', user?.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !startDate || !endDate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('lab_usage')
        .insert({
          computer_id: selectedComputer,
          course_id: selectedCourse || null,
          teacher_id: user.id,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          purpose: purpose || null,
          status: 'scheduled'
        });

      if (error) throw error;

      showSuccess('Reserva criada com sucesso!');
      setSelectedComputer('');
      setSelectedCourse('');
      setStartDate(undefined);
      setEndDate(undefined);
      setPurpose('');
      onReservationCreated?.();
    } catch (error) {
      console.error('Error creating reservation:', error);
      showError('Erro ao criar reserva');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reservar Laboratório</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="computer">Computador</Label>
            <select
              id="computer"
              value={selectedComputer}
              onChange={(e) => setSelectedComputer(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="">Selecione um computador</option>
              {computers.map(computer => (
                <option key={computer.id} value={computer.id}>
                  {computer.name} {computer.location && `(${computer.location})`}
                </option>
              ))}
            </select>
          </div>

          {(userProfile?.role === 'teacher' || userProfile?.role === 'admin') && (
            <div className="space-y-2">
              <Label htmlFor="course">Curso (opcional)</Label>
              <select
                id="course"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Uso geral (sem curso associado)</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data e Hora de Início</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP HH:mm", { locale: ptBR }) : "Selecione data/hora"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data e Hora de Término</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP HH:mm", { locale: ptBR }) : "Selecione data/hora"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Propósito (opcional)</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Descreva o propósito da reserva..."
              rows={2}
            />
          </div>

          <Button type="submit" disabled={saving || !selectedComputer || !startDate || !endDate} className="w-full">
            {saving ? 'Criando...' : 'Criar Reserva'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ComputerReservationForm;