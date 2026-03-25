"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Monitor, Calendar, Plus, BarChart3, UserCheck, GraduationCap } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import AttendanceForm from '@/components/AttendanceForm';
import GradeForm from '@/components/GradeForm';
import AnnouncementForm from '@/components/AnnouncementForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TeacherDashboard = () => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    activeReservations: 0
  });
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseStudents(selectedCourse);
    }
  }, [selectedCourse]);

  const fetchTeacherData = async () => {
    setLoading(true);
    try {
      // Fetch courses taught by teacher
      const { data: teacherCourses, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('teacher_id', user?.id);

      if (coursesError) throw coursesError;
      setCourses(teacherCourses || []);
      if (teacherCourses && teacherCourses.length > 0) {
        setSelectedCourse(teacherCourses[0].id);
      }

      // Fetch total students across all courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('student_id')
        .in('course_id', teacherCourses?.map(c => c.id) || []);

      // Fetch active reservations
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
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseStudents = async (courseId: string) => {
    try {
      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          student_id,
          users!enrollments_student_id_fkey (id, name)
        `)
        .eq('course_id', courseId);

      if (error) throw error;
      setStudents(enrollments?.map(e => e.users) || []);
    } catch (error) {
      console.error('Error fetching course students:', error);
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
            <h1 className="text-3xl font-bold">Painel do Professor</h1>
            <p className="text-muted-foreground">Gerencie suas turmas e conteúdo.</p>
          </div>
          <div className="flex items-center gap-2">
            <select 
              className="p-2 border rounded-lg bg-background"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.name}</option>
              ))}
            </select>
          </div>
        </div>

        <DashboardStats stats={stats} />

        <Tabs defaultValue="announcements" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="announcements" className="rounded-lg gap-2">
              <Calendar className="h-4 w-4" /> Avisos
            </TabsTrigger>
            <TabsTrigger value="attendance" className="rounded-lg gap-2">
              <UserCheck className="h-4 w-4" /> Frequência
            </TabsTrigger>
            <TabsTrigger value="grades" className="rounded-lg gap-2">
              <GraduationCap className="h-4 w-4" /> Notas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <AnnouncementForm courseId={selectedCourse} onAnnouncementCreated={() => {}} />
          </TabsContent>

          <TabsContent value="attendance">
            {selectedCourse ? (
              <AttendanceForm 
                courseId={selectedCourse} 
                students={students} 
                onAttendanceSaved={() => {}} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione um curso para gerenciar a frequência.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="grades">
            {selectedCourse ? (
              <GradeForm 
                courseId={selectedCourse} 
                students={students} 
                onGradesSaved={() => {}} 
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Selecione um curso para gerenciar as notas.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TeacherDashboard;