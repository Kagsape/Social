"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BookOpen, 
  Users, 
  Clock, 
  Star, 
  Calendar, 
  CheckCircle2, 
  ArrowLeft,
  User,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Buscar detalhes do curso
        const { data: courseData, error: courseError } = await supabase
          .from('courses')
          .select(`
            *,
            users!courses_teacher_id_fkey (name, avatar_url)
          `)
          .eq('id', id)
          .single();

        if (courseError) throw courseError;
        setCourse(courseData);

        // Buscar contagem real de alunos
        const { count } = await supabase
          .from('enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', id);
        
        setStudentCount(count || 0);

        // Verificar se o usuário atual está matriculado
        if (user) {
          const { data: enrollment } = await supabase
            .from('enrollments')
            .select('*')
            .eq('course_id', id)
            .eq('student_id', user.id)
            .maybeSingle();
          
          setIsEnrolled(!!enrollment);
        }
      } catch (error) {
        console.error('Erro ao buscar dados do curso:', error);
        navigate('/courses');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user, navigate]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('enrollments')
        .insert({
          course_id: id,
          student_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      showSuccess('Matrícula realizada com sucesso!');
      setIsEnrolled(true);
      setStudentCount(prev => prev + 1);
    } catch (error) {
      showError('Erro ao realizar matrícula');
    } finally {
      setEnrolling(false);
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

  return (
    <Layout>
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{course.category || 'Tecnologia'}</Badge>
              <Badge variant="outline">{course.code}</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {course.description || 'Sem descrição disponível.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Alunos</div>
                <div className="text-lg font-bold">{studentCount}</div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Criado em</div>
                <div className="text-lg font-bold">{new Date(course.created_at).getFullYear()}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24 overflow-hidden border-none shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white opacity-50" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Acesso Gratuito</CardTitle>
              <p className="text-sm text-muted-foreground">Exclusivo para a comunidade CIEP 165</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEnrolled ? (
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled>
                  <CheckCircle2 className="h-4 w-4" /> Já Matriculado
                </Button>
              ) : (
                <Button 
                  className="w-full py-6 text-lg font-bold" 
                  onClick={handleEnroll}
                  disabled={enrolling || userProfile?.role !== 'student'}
                >
                  {enrolling ? 'Processando...' : 'Matricular-se Agora'}
                </Button>
              )}
              
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Professor:</span>
                  <span>{course.users?.name || 'A definir'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetails;