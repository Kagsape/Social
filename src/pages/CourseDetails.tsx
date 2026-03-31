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
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [allowOnlineEnrollment, setAllowOnlineEnrollment] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
    fetchSettings();
    if (user) {
      checkEnrollment();
    }
  }, [id, user]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'allow_online_enrollment')
        .maybeSingle();
      
      if (data) {
        setAllowOnlineEnrollment(data.value === true);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };

  const fetchCourseDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_teacher_id_fkey (name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
      showError('Curso não encontrado');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    try {
      const { data } = await supabase
        .from('enrollments')
        .select('*')
        .eq('course_id', id)
        .eq('student_id', user?.id)
        .single();

      if (data) setIsEnrolled(true);
    } catch (error) {
      setIsEnrolled(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!allowOnlineEnrollment) {
      showError('As matrículas online estão temporariamente desativadas.');
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
    } catch (error) {
      console.error('Error enrolling:', error);
      showError('Erro ao realizar matrícula');
    } finally {
      setEnrolling(false);
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
      <Button 
        variant="ghost" 
        className="mb-6 gap-2" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{course.category || 'Tecnologia'}</Badge>
              <Badge variant="outline">{course.code}</Badge>
            </div>
            <h1 className="text-4xl font-bold tracking-tight">{course.name}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {course.description || 'Nenhuma descrição detalhada disponível para este curso ainda.'}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Alunos</div>
                <div className="text-lg font-bold">60+</div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Duração</div>
                <div className="text-lg font-bold">20h</div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <div className="text-sm font-medium">Avaliação</div>
                <div className="text-lg font-bold">4.9</div>
              </CardContent>
            </Card>
            <Card className="border-none bg-muted/50">
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div className="text-sm font-medium">Início</div>
                <div className="text-lg font-bold">Imediato</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold">O que você vai aprender</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                "Fundamentos da tecnologia",
                "Práticas laboratoriais",
                "Resolução de problemas reais",
                "Trabalho em equipe e colaboração"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-white dark:bg-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24 overflow-hidden border-none shadow-xl">
            <div className="aspect-video bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-white opacity-50" />
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Grátis</CardTitle>
              <p className="text-sm text-muted-foreground">Acesso exclusivo para alunos do CIEP 165</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEnrolled ? (
                <Button className="w-full gap-2 bg-green-600 hover:bg-green-700" disabled>
                  <CheckCircle2 className="h-4 w-4" /> Já Matriculado
                </Button>
              ) : !allowOnlineEnrollment ? (
                <div className="space-y-4">
                  <Button className="w-full py-6 text-lg font-bold opacity-50 cursor-not-allowed" disabled>
                    Matrículas Indisponíveis
                  </Button>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      As matrículas online estão desativadas. Procure a secretaria ou seu professor para se inscrever.
                    </p>
                  </div>
                </div>
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
                <div className="flex items-center gap-3 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Certificado:</span>
                  <span>Incluso</span>
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