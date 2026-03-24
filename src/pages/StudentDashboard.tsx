"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Monitor, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import LabComputerCard from '@/components/LabComputerCard';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import NotificationBell from '@/components/NotificationBell';

const StudentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [computers, setComputers] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // Fetch enrolled courses
      const { data: courseData, error: courseError } = await supabase
        .from('course_students')
        .select(`
          course_id,
          courses (
            id,
            name,
            code,
            description,
            teacher_id,
            users!courses_teacher_id_fkey (name)
          )
        `)
        .eq('student_id', user?.id);

      if (courseError) throw courseError;

      const enrolledCourses = courseData?.map(cs => cs.courses) || [];
      setCourses(enrolledCourses);

      // Fetch available computers
      const { data: computerData, error: computerError } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working')
        .order('name');

      if (computerError) throw computerError;
      setComputers(computerData || []);

      // Fetch student's reservations
      const { data: reservationData, error: reservationError } = await supabase
        .from('lab_usage')
        .select(`
          *,
          lab_computers (name, location)
        `)
        .eq('teacher_id', user?.id)
        .eq('status', 'scheduled')
        .gte('start_time', new Date().toISOString())
        .order('start_time');

      if (reservationError) throw reservationError;
      setReservations(reservationData || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = (computerId: string) => {
    // In a real implementation, this would open a reservation modal
    console.log('Reserve computer:', computerId);
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
            <h1 className="text-3xl font-bold">Olá, {userProfile?.name?.split(' ')[0]}! 👋</h1>
            <p className="text-muted-foreground">Aqui está o resumo das suas atividades.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
          </div>
        </div>

        {/* Stats */}
        <DashboardStats 
          stats={{
            totalCourses: courses.length,
            totalComputers: computers.length,
            activeReservations: reservations.length
          }}
        />

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
                  <Link to="/courses">Ver todos</Link>
                </Button>
              </div>
              
              {courses.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    Você ainda não está matriculado em nenhum curso.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.slice(0, 4).map(course => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{course.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">Código: {course.code}</p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                        <div className="mt-4 flex items-center justify-between">
                          <Badge variant="outline">
                            <User className="h-3 w-3 mr-1" />
                            {course.users?.name || 'Professor'}
                          </Badge>
                          <Button size="sm" asChild>
                            <Link to={`/courses/${course.id}`}>Acessar</Link>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Available Computers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Monitor className="h-6 w-6" />
                  Computadores Disponíveis
                </h2>
                <Badge variant="secondary">{computers.length} disponíveis</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computers.slice(0, 4).map(computer => (
                  <LabComputerCard
                    key={computer.id}
                    computer={computer}
                    onReserve={handleReserve}
                    showActions
                  />
                ))}
              </div>
            </section>
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
                  <Link to="/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Ver Meus Cursos
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/reservations">
                    <Calendar className="h-4 w-4 mr-2" />
                    Minhas Reservas
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Monitor className="h-4 w-4 mr-2" />
                  Reservar Computador
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Reservations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Próximas Reservas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reservations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma reserva agendada
                  </p>
                ) : (
                  <div className="space-y-3">
                    {reservations.slice(0, 3).map(reservation => (
                      <div key={reservation.id} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">
                              {reservation.lab_computers?.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(reservation.start_time).toLocaleDateString('pt-BR')} às{' '}
                              {new Date(reservation.start_time).toLocaleTimeString('pt-BR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            Agendado
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reservation Form */}
            <ComputerReservationForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;