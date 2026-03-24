"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Monitor, Calendar, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import AttendanceForm from '@/components/AttendanceForm';
import GradeForm from '@/components/GradeForm';
import AnnouncementForm from '@/components/AnnouncementForm';
import NotificationBell from '@/components/NotificationBell';

const TeacherDashboard = () => {
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // Fetch teacher's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          *,
          course_students (
            student_id,
            users (id, name, email)
          )
        `)
        .eq('teacher_id', user?.id);

      if (coursesError) throw coursesError;
      setCourses(coursesData || []);

      // Calculate total students
      const totalStudents = coursesData?.reduce((acc, course) => 
        acc + (course.course_students?.length || 0), 0
      ) || 0;

      // Fetch total computers
      const { count: computerCount } = await supabase
        .from('lab_computers')
        .select('*', { count: 'exact', head: true });

      // Fetch active reservations
      const { count: reservationCount } = await supabase
        .from('lab_usage')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString());

      setStats({
        totalStudents,
        totalCourses: coursesData?.length || 0,
        totalComputers: computerCount || 0,
        activeReservations: reservationCount || 0
      });

      // Flatten all students from all courses
      const allStudents = coursesData?.flatMap(course => 
        course.course_students?.map((cs: any) => cs.users) || []
      ) || [];
      // Remove duplicates
      const uniqueStudents = Array.from(new Map(allStudents.map(s => [s.id, s])).values());
      setStudents(uniqueStudents);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Painel do Professor 👨‍🏫</h1>
            <p className="text-muted-foreground">Gerencie seus cursos e alunos.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Curso
            </Button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* My Courses */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  Meus Cursos
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/courses">Gerenciar</Link>
                </Button>
              </div>
              
              {courses.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Você ainda não tem nenhum curso associado.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map(course => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Código: {course.code}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {course.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            <Users className="h-3 w-3 mr-1" />
                            {course.course_students?.length || 0} alunos
                          </Badge>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link to={`/courses/${course.id}/attendance`}>
                                Frequência
                              </Link>
                            </Button>
                            <Button size="sm" asChild>
                              <Link to={`/courses/${course.id}/grades`}>
                                Notas
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Attendance & Grades */}
            {courses.length > 0 && (
              <div className="grid grid-cols-1 gap-6">
                <AttendanceForm 
                  courseId={courses[0].id} 
                  students={students}
                />
                <GradeForm 
                  courseId={courses[0].id}
                  students={students}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gerenciar Cursos
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/lab">
                    <Monitor className="h-4 w-4 mr-2" />
                    Laboratório
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
              </CardContent>
            </Card>

            {/* Announcements */}
            <AnnouncementForm courseId={courses[0]?.id} />

            {/* Lab Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Reservas do Lab
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Agende horários no laboratório para suas aulas.
                </p>
                <Button className="w-full" asChild>
                  <Link to="/admin/reservations">Ver Reservas</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;