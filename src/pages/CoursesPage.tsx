"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      // Buscar cursos e contagem de matrículas
      let query = supabase
        .from('courses')
        .select(`
          *,
          users!courses_teacher_id_fkey (name),
          enrollments (count)
        `);
      
      if (category !== 'all') {
        query = query.ilike('category', `%${category}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Processar dados para incluir a contagem de alunos
      const processedCourses = (data || []).map(course => ({
        ...course,
        student_count: course.enrollments?.[0]?.count || 0
      }));

      setCourses(processedCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (course.code && course.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value) {
      setSearchParams({ q: value });
    } else {
      searchParams.delete('q');
      setSearchParams(searchParams);
    }
  };

  return (
    <Layout>
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">Cursos</h1>
        <p className="text-muted-foreground text-base md:text-lg">Explore as trilhas de conhecimento do CIEP 165.</p>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="O que você quer aprender hoje?" 
            className="pl-10 rounded-xl" 
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <Tabs value={category} onValueChange={setCategory} className="w-full">
              <TabsList className="bg-muted/50 rounded-xl p-1 flex w-max min-w-full md:min-w-0">
                <TabsTrigger value="all" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Todos</TabsTrigger>
                <TabsTrigger value="Programação" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Programação</TabsTrigger>
                <TabsTrigger value="Hardware" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Hardware</TabsTrigger>
                <TabsTrigger value="Básico" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Básico</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <Button variant="outline" size="icon" className="rounded-xl shrink-0 h-11 w-11">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Nenhum curso encontrado para "{searchTerm}".</p>
            </div>
          ) : (
            filteredCourses.map(course => (
              <CourseCard 
                key={course.id}
                id={course.id}
                title={course.name}
                instructor={course.users?.name || 'A definir'}
                thumbnail={course.image_url}
                students={course.student_count}
                duration={course.duration}
                category={course.category}
              />
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default CoursesPage;