"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, ArrowRight, GraduationCap, Star, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import ComputerReservationForm from '@/components/ComputerReservationForm';

const StudentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`*, courses (*)`)
        .eq('student_id', user?.id);

      setEnrolledCourses(enrollments || []);

      // Fetch grades
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`*, courses (name)`)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });
      
      setGrades(gradesData || []);

      // Fetch available computers
      const { data: computers } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working');

      // Fetch active reservations
      const { data: reservations } = await supabase
        .from('lab_usage')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('status', 'scheduled');

      setStats({
        totalCourses: enrollments?.length || 0,
        totalComputers: computers?.length || 0,
        activeReservations: reservations?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Olá, {userProfile?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Sua matrícula: <span className="font-mono font-bold text-primary">{userProfile?.student_id || 'N/A'}</span></p>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="rounded-full">Ver Perfil Completo</Button>
          </Link>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Meus Cursos
                </CardTitle>
                <Link to="/courses">
                  <Button variant="ghost" size="sm" className="gap-2">
                    Ver todos <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {enrolledCourses.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Você ainda não está matriculado em nenhum curso.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enrolledCourses.map((enrollment) => (
                      <Link key={enrollment.id} to={`/courses/${enrollment.course_id}`}>
                        <div className="p-4 rounded-xl border bg-white dark:bg-slate-900 hover:shadow-md transition-all group">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary">{enrollment.courses?.category || 'Curso'}</Badge>
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              {enrollment.status === 'active' ? 'Ativo' : 'Concluído'}
                            </Badge>
                          </div>
                          <h3 className="font-bold group-hover:text-primary transition-colors">{enrollment.courses?.name}</h3>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Minhas Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma nota lançada ainda.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {grades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between p-4 border rounded-xl">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase font-bold">{grade.courses?.name}</p>
                          <h4 className="font-bold">{grade.assignment_name}</h4>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-primary">{grade.grade}<span className="text-sm text-muted-foreground">/{grade.max_grade}</span></p>
                          {grade.comments && <p className="text-xs text-muted-foreground italic">{grade.comments}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6 space-y-2">
                <GraduationCap className="h-8 w-8 opacity-50" />
                <h3 className="text-xl font-bold">Portal do Aluno</h3>
                <p className="text-sm opacity-90">Mantenha sua frequência em dia para garantir seu certificado ao final do curso.</p>
              </CardContent>
            </Card>
            <ComputerReservationForm onReservationCreated={fetchDashboardData} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;