"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Loader2, 
  SortAsc, 
  Clock, 
  Users as UsersIcon,
  LayoutGrid
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'name'>('newest');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          users!courses_teacher_id_fkey (name),
          enrollments (count)
        `);
      
      if (error) throw error;

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
  }, []);

  // Categorias únicas presentes nos cursos
  const categories = useMemo(() => {
    const cats = new Set(courses.map(c => c.category).filter(Boolean));
    return ['all', ...Array.from(cats)];
  }, [courses]);

  const filteredAndSortedCourses = useMemo(() => {
    let result = courses.filter(course => 
      (course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description && course.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (course.code && course.code.toLowerCase().includes(searchTerm.toLowerCase()))) &&
      (category === 'all' || course.category === category)
    );

    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => b.student_count - a.student_count);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [courses, searchTerm, category, sortBy]);

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
        <h1 className="text-3xl md:text-4xl font-bold mb-2 md:mb-4">Explorar Cursos</h1>
        <p className="text-muted-foreground text-base md:text-lg">Descubra novas habilidades e trilhas de conhecimento no CIEP 165.</p>
      </div>

      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, código ou descrição..." 
              className="pl-10 rounded-xl h-11" 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="rounded-xl h-11 gap-2 px-4">
                  <SortAsc className="h-4 w-4" />
                  {sortBy === 'newest' ? 'Mais Recentes' : sortBy === 'popular' ? 'Mais Populares' : 'Nome (A-Z)'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortBy('newest')} className="gap-2">
                  <Clock className="h-4 w-4" /> Recentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('popular')} className="gap-2">
                  <UsersIcon className="h-4 w-4" /> Populares
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')} className="gap-2">
                  <SortAsc className="h-4 w-4" /> Nome
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" size="icon" className="rounded-xl shrink-0 h-11 w-11 md:hidden">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex-1 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
            <Tabs value={category} onValueChange={setCategory} className="w-full">
              <TabsList className="bg-muted/50 rounded-xl p-1 flex w-max min-w-full md:min-w-0">
                {categories.map((cat) => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="rounded-lg px-4 py-2 whitespace-nowrap flex-1 capitalize"
                  >
                    {cat === 'all' ? 'Todos os Cursos' : cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filteredAndSortedCourses.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-3xl bg-muted/10">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-bold text-foreground">Nenhum curso encontrado</h3>
              <p className="max-w-xs mx-auto mt-2">Tente ajustar seus filtros ou busca para encontrar o que procura.</p>
              <Button 
                variant="link" 
                onClick={() => { setSearchTerm(''); setCategory('all'); }}
                className="mt-4"
              >
                Limpar todos os filtros
              </Button>
            </div>
          ) : (
            filteredAndSortedCourses.map(course => (
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