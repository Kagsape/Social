"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Monitor, GraduationCap, UserCheck, ChevronRight, Loader2, Plus, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import AttendanceForm from '@/components/AttendanceForm';
import GradeForm from '@/components/GradeForm';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import CreateCourseForm from '@/components/CreateCourseForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { showError } from '@/utils/toast';

const TeacherDashboard = () => {
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeReservations: 0
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== 'none') {
      fetchCourseStudents(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      const { data: teacherCourses } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id);

      setCourses(teacherCourses || []);
      if (teacherCourses && teacherCourses.length > 0 && !selectedCourse) {
        setSelectedCourse(teacherCourses[0].id);
      }

      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('course_id', teacherCourses?.map(c => c.id) || []);

      const { data: reservations } = await supabase
        .from('lab_usage')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('status', 'scheduled');

      setStats({
        totalCourses: teacherCourses?.length || 0,
        totalStudents: new Set(enrollments?.map(e => e.student_id)).size,
        activeReservations: reservations?.length || 0
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    try {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          users!enrollments_student_id_fkey (id, name, avatar_url, student_id)
        `)
        .eq('course_id', courseId);

      setStudents(enrollments?.map(e => e.users) || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleGoToLessons = () => {
    if (!selectedCourse || selectedCourse === 'none') {
      showError('Selecione um curso primeiro.');
      return;
    }
    navigate(`/courses/${selectedCourse}/lessons`);
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10" /></div></Layout>;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Painel do Professor</h1>
            <p className="text-muted-foreground">Gerencie suas turmas e acompanhamento pedagógico.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showCreateForm ? "outline" : "default"} 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="gap-2 rounded-xl"
            >
              {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {showCreateForm ? "Cancelar" : "Nova Turma"}
            </Button>
            <select 
              className="p-2 border rounded-xl bg-background w-full md:w-auto h-10 text-sm"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.length === 0 && <option value="none">Nenhum curso</option>}
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
            <Button onClick={handleGoToLessons} variant="secondary" className="gap-2 rounded-xl h-10" disabled={!selectedCourse || selectedCourse === 'none'}>
              <BookOpen className="h-4 w-4" /> Aulas
            </Button>
          </div>
        </div>

        {showCreateForm && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <CreateCourseForm onSuccess={() => { setShowCreateForm(false); fetchTeacherData(); }} />
          </div>
        )}

        <DashboardStats stats={stats} />

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="students" className="gap-2"><Users className="h-4 w-4" /> Alunos</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-2"><UserCheck className="h-4 w-4" /> Frequência</TabsTrigger>
            <TabsTrigger value="grades" className="gap-2"><GraduationCap className="h-4 w-4" /> Notas</TabsTrigger>
            <TabsTrigger value="reservations" className="gap-2"><Monitor className="h-4 w-4" /> Lab</TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                  Nenhum aluno matriculado nesta turma.
                </div>
              ) : (
                students.map(student => (
                  <Link key={student.id} to={`/student-file/${student.id}`}>
                    <Card className="hover:shadow-md transition-all group border-none shadow-sm">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={student.avatar_url} />
                            <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-sm group-hover:text-primary transition-colors">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Matrícula: {student.student_id}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceForm courseId={selectedCourse} students={students} />
          </TabsContent>

          <TabsContent value="grades">
            <GradeForm courseId={selectedCourse} students={students} />
          </TabsContent>

          <TabsContent value="reservations">
            <ComputerReservationForm onReservationCreated={fetchTeacherData} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;