"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Calendar, 
  ArrowRight, 
  GraduationCap, 
  Star, 
  CheckCircle2,
  UserCheck,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StudentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Buscar cursos matriculados
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`*, courses (*)`)
        .eq('student_id', user?.id);

      setEnrolledCourses(enrollments || []);

      // 2. Buscar notas
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`*, courses (name)`)
        .eq('student_id', user?.id)
        .order('created_at', { ascending: false });
      
      setGrades(gradesData || []);

      // 3. Buscar frequência
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`*, courses (name)`)
        .eq('student_id', user?.id)
        .order('date', { ascending: false });
      
      setAttendance(attendanceData || []);

      // 4. Buscar computadores disponíveis
      const { data: computers } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working');

      // 5. Buscar reservas ativas
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-500">Presente</Badge>;
      case 'absent':
        return <Badge variant="destructive">Falta</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Atraso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const registrationId = userProfile?.role === 'teacher' ? userProfile?.teacher_id : userProfile?.student_id;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Olá, {userProfile?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Seu registro: <span className="font-mono font-bold text-primary">{registrationId || 'N/A'}</span></p>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="rounded-full">Ver Perfil Completo</Button>
          </Link>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="courses" className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-xl bg-muted/50 p-1">
                <TabsTrigger value="courses" className="rounded-lg gap-2">
                  <BookOpen className="h-4 w-4" /> Cursos
                </TabsTrigger>
                <TabsTrigger value="grades" className="rounded-lg gap-2">
                  <Star className="h-4 w-4" /> Notas
                </TabsTrigger>
                <TabsTrigger value="attendance" className="rounded-lg gap-2">
                  <UserCheck className="h-4 w-4" /> Frequência
                </TabsTrigger>
              </TabsList>

              <TabsContent value="courses" className="mt-6 space-y-4">
                {enrolledCourses.length === 0 ? (
                  <Card className="border-dashed py-12 text-center">
                    <p className="text-muted-foreground">Você ainda não está matriculado em nenhum curso.</p>
                    <Link to="/courses">
                      <Button variant="link" className="mt-2">Explorar Cursos</Button>
                    </Link>
                  </Card>
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
              </TabsContent>

              <TabsContent value="grades" className="mt-6 space-y-4">
                {grades.length === 0 ? (
                  <Card className="border-dashed py-12 text-center">
                    <p className="text-muted-foreground">Nenhuma nota lançada ainda.</p>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {grades.map((grade) => (
                      <Card key={grade.id} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{grade.courses?.name}</p>
                            <h4 className="font-bold">{grade.assignment_name}</h4>
                            {grade.comments && <p className="text-xs text-muted-foreground italic mt-1">"{grade.comments}"</p>}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary">{grade.grade}<span className="text-sm text-muted-foreground">/{grade.max_grade}</span></p>
                            <p className="text-[10px] text-muted-foreground uppercase">Pontuação</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="attendance" className="mt-6 space-y-4">
                {attendance.length === 0 ? (
                  <Card className="border-dashed py-12 text-center">
                    <p className="text-muted-foreground">Nenhum registro de frequência encontrado.</p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {attendance.map((record) => (
                      <Card key={record.id} className="border-none shadow-sm">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{format(new Date(record.date), "dd 'de' MMMM", { locale: ptBR })}</p>
                              <p className="text-xs text-muted-foreground">{record.courses?.name}</p>
                            </div>
                          </div>
                          {getStatusBadge(record.status)}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-primary text-primary-foreground">
              <CardContent className="p-6 space-y-2">
                <GraduationCap className="h-8 w-8 opacity-50" />
                <h3 className="text-xl font-bold">Portal de Aprendizado</h3>
                <p className="text-sm opacity-90">Acompanhe seu progresso e frequência em todos os cursos que você está participando.</p>
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