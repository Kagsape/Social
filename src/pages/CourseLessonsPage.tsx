"use client";

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useLessons } from '@/hooks/useLessons';
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, FileText, ExternalLink, Lock, Loader2, Plus } from 'lucide-react';
import LessonReportForm from '@/components/LessonReportForm';
import InternalNotesForm from '@/components/InternalNotesForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CourseLessonsPage = () => {
  const { id } = useParams();
  const { userProfile } = useAuth();
  const { lessons, loading, fetchLessons } = useLessons(id);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const isTeacher = userProfile?.role === 'teacher' || userProfile?.role === 'admin';

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Aulas e Materiais</h1>
            <p className="text-muted-foreground">Acompanhe o conteúdo programático do curso.</p>
          </div>
          {isTeacher && (
            <Button onClick={() => setShowForm(!showForm)} className="gap-2">
              <Plus className="h-4 w-4" /> {showForm ? 'Fechar' : 'Nova Aula'}
            </Button>
          )}
        </div>

        {showForm && id && (
          <div className="animate-in fade-in slide-in-from-top-4">
            <LessonReportForm courseId={id} onSuccess={() => { setShowForm(false); fetchLessons(); }} />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : lessons.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <p className="text-muted-foreground">Nenhuma aula registrada ainda.</p>
          </Card>
        ) : (
          <div className="grid gap-6">
            {lessons.map(lesson => (
              <Card key={lesson.id} className="border-none shadow-sm hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Publicado em {new Date(lesson.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {lesson.slides_url && (
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a href={lesson.slides_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Material
                      </a>
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
                  
                  {isTeacher && (
                    <div className="pt-4 border-t">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" className="gap-2">
                            <Lock className="h-4 w-4" /> Observações Internas
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Notas Pedagógicas: {lesson.title}</DialogTitle>
                          </DialogHeader>
                          <InternalNotesForm lessonId={lesson.id} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CourseLessonsPage;