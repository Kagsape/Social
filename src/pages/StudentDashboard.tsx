"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Monitor, Calendar, CheckCircle, Clock, User } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import LabComputerCard from '@/components/LabComputerCard';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import NotificationBell from '@/components/NotificationBell';

const StudentDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch enrolled courses count
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user?.id);

      // Fetch available computers
      const { data: computers } = await supabase
        .from('lab_computers')
        .select('*')
        .eq('status', 'working');

      // Fetch active reservations
      const { data: reservations } = await supabase
        .from('lab_usage')
        .select('*')
        .eq('student_id', user?.id)
        .eq('status', 'scheduled');

      setStats({
        totalCourses: enrollments?.length || 0,
        totalComputers: computers?.length || 0,
        activeReservations: reservations?.length || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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
            <Card>
              <CardHeader>
                <CardTitle>Meus Cursos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Você está matriculado em {stats.totalCourses} cursos.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Você tem {stats.activeReservations} reservas agendadas.</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <NotificationBell />
            <ComputerReservationForm onReservationCreated={fetchStats} />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;