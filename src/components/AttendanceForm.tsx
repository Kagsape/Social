"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, UserCheck, UserX } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface AttendanceFormProps {
  courseId: string;
  students: Array<{ id: string; name: string }>;
  date?: Date;
  onAttendanceSaved?: () => void;
}

const AttendanceForm: React.FC<AttendanceFormProps> = ({ 
  courseId, 
  students, 
  date = new Date(),
  onAttendanceSaved 
}) => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
  const [saving, setSaving] = useState(false);

  const handleAttendanceChange = (studentId: string, status: 'present' | 'absent' | 'late') => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const saveAttendance = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        student_id: studentId,
        course_id: courseId,
        date: date.toISOString().split('T')[0],
        status,
        recorded_by: user.id
      }));

      // Delete existing attendance for this date and course
      await supabase
        .from('attendance')
        .delete()
        .eq('course_id', courseId)
        .eq('date', date.toISOString().split('T')[0]);

      // Insert new records
      const { error } = await supabase
        .from('attendance')
        .insert(records);

      if (error) throw error;

      showSuccess('Frequência salva com sucesso!');
      onAttendanceSaved?.();
    } catch (error) {
      console.error('Error saving attendance:', error);
      showError('Erro ao salvar frequência');
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          Frequência - {date.toLocaleDateString('pt-BR')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {students.map(student => (
            <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-medium">{student.name}</span>
                {attendance[student.id] && (
                  <Badge variant={getStatusBadgeVariant(attendance[student.id])} className="gap-1">
                    {getStatusIcon(attendance[student.id])}
                    {attendance[student.id] === 'present' ? 'Presente' : 
                     attendance[student.id] === 'absent' ? 'Faltou' : 'Atrasado'}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'present' ? 'default' : 'outline'}
                  onClick={() => handleAttendanceChange(student.id, 'present')}
                  className="gap-2"
                >
                  <UserCheck className="h-4 w-4" /> P
                </Button>
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'absent' ? 'destructive' : 'outline'}
                  onClick={() => handleAttendanceChange(student.id, 'absent')}
                  className="gap-2"
                >
                  <UserX className="h-4 w-4" /> F
                </Button>
                <Button
                  size="sm"
                  variant={attendance[student.id] === 'late' ? 'secondary' : 'outline'}
                  onClick={() => handleAttendanceChange(student.id, 'late')}
                  className="gap-2"
                >
                  <Clock className="h-4 w-4" /> A
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button 
          onClick={saveAttendance} 
          disabled={saving || Object.keys(attendance).length === 0}
          className="w-full"
        >
          {saving ? 'Salvando...' : 'Salvar Frequência'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AttendanceForm;