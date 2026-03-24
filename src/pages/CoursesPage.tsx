"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const CoursesPage = () => {
  const { user, userProfile } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          users!courses_teacher_id_fkey (name),
          course_students (student_id)
        `);

      // If student, only show enrolled courses
      if (userProfile?.role === 'student') {
        const { data: enrollments } = await supabase
          .from('course_students')
          .select('course_id')
          .eq('student_id', user?.id);
        const courseIds = enrollments?.map(e => e.course_id) || [];
        if (courseIds.length > 0) {
          query = query.in('id', courseIds);
        } else {
          setCourses([]);
          setLoading(false);
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const isEnrolled = (courseId: string) => {
    if (userProfile?.role !== 'student') return true;
    return courses.find(c => c.id === courseId)?.course_students?.some(
      (cs: any) => cs.student_id === user?.id
    );
  };

  const enrollInCourse = async (courseId: string) => {
    try {
      const { error } = await supabase
        .from('course_students')
        .insert({ course_id: courseId, student_id: user?.id });

      if (error) throw error;
      fetchCourses();
    } catch (error) {
      console.error('Error enrolling:', error);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.code?.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', 'programacao', 'hardware', 'basico', 'avancado'];

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
          <h1 className="text-3xl font-bold">Cursos</h1>
          <p className="text-muted-foreground">Explore os cursos disponíveis.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cursos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="capitalize"
              >
                {cat === 'all' ? 'Todos' : cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhum curso encontrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="line-clamp-2">{course.name}</span>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {course.code}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Professor: {course.users?.name || 'N/A'}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {course.description || 'Sem descrição disponível.'}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{course.course_students?.length || 0} alunos</span>
                    </div>
                  </div>

                  {userProfile?.role === 'student' && !isEnrolled(course.id) && (
                    <Button 
                      onClick={() => enrollInCourse(course.id)}
                      className="w-full"
                    >
                      Matricular-se
                    </Button>
                  )}

                  {userProfile?.role === 'student' && isEnrolled(course.id) && (
                    <Badge variant="default" className="w-full justify-center py-2">
                      Matriculado
                    </Badge>
                  )}

                  {(userProfile?.role === 'teacher' || userProfile?.role === 'admin') && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/admin/courses/${course.id}`}>Gerenciar</Link>
                    </Button>
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

export default CoursesPage;