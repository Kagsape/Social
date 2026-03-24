"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Monitor, Calendar, Plus, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import AttendanceForm from '@/components/AttendanceForm';
import GradeForm from '@/components/GradeForm';
import AnnouncementForm from '@/components/AnnouncementForm';

const TeacherDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeReservations: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch courses taught by teacher
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id);

      // Fetch total students across all courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .in('course_id', courses?.map(c => c.id) || []);

      // Fetch active reservations
      const { data: reservations } = await supabase
        .from('lab_usage')
        .select('*')
        .eq('teacher_id', user?.id)
        .eq('status', 'scheduled');

      setStats({
        totalCourses: courses?.length || 0,
        totalStudents: new Set(enrollments?.map(e => e.student_id)).size,
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
          <h1 className="text-3xl font-bold">Painel do Professor</h1>
          <p className="text-muted-foreground">Gerencie suas turmas e conteúdo.</p>
        </div>

        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Criar Aviso</CardTitle>
            </CardHeader>
            <CardContent>
              <AnnouncementForm onAnnouncementCreated={() => {}} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frequência</CardTitle>
            </CardHeader>
            <CardContent>
              <AttendanceForm 
                courseId="dummy" 
                students={[]} 
                onAttendanceSaved={() => {}} 
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Gerenciar Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <GradeForm 
              courseId="dummy" 
              students={[]} 
              onGradesSaved={() => {}} 
            />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;