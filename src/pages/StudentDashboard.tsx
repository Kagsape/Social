"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Monitor, Calendar, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import ComputerReservationForm from '@/components/ComputerReservationForm';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled courses with details
      const { data: enrollments, error: enrollError } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses (*)
        `)
        .eq('student_id', user?.id);

      if (enrollError) throw enrollError;
      setEnrolledCourses(enrollments || []);

      // Fetch available computers
      const { data: computers } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working');

      // Fetch active reservations
      const { data: reservations } = await supabase
        .from('lab_usage')
        .select('*')
        .eq('teacher_id', user?.id) // In this context, student_id might be used if schema allows
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
        <div>
          <h1 className="text-3xl font-bold">Meu Dashboard</h1>
          <p className="text-muted-foreground">Acompanhe seu progresso e reservas.</p>
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
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{enrollment.courses?.description}</p>
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
                  <Calendar className="h-5 w-5 text-primary" />
                  Reservas Ativas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.activeReservations === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhuma reserva agendada.
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    Você tem {stats.activeReservations} reservas agendadas.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <ComputerReservationForm onReservationCreated={fetchDashboardData} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;