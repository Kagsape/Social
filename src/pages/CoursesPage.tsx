"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link, useSearchParams } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CoursesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    fetchCourses();
  }, [category]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      let query = supabase.from('courses').select('*');
      
      if (category !== 'all') {
        query = query.ilike('category', `%${category}%`);
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

  // Filtragem local para busca instantânea
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
                <TabsTrigger value="programacao" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Programação</TabsTrigger>
                <TabsTrigger value="hardware" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Hardware</TabsTrigger>
                <TabsTrigger value="basico" className="rounded-lg px-4 py-2 whitespace-nowrap flex-1">Básico</TabsTrigger>
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
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
              <Card key={course.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-slate-900 rounded-2xl">
                <div className="relative aspect-video overflow-hidden">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white/50" />
                  </div>
                  <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
                    {course.category || 'Curso'}
                  </Badge>
                </div>
                <CardHeader className="p-4 pb-2">
                  <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {course.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium text-foreground">4.8</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>60</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>20h</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0">
                  <Link to={`/courses/${course.id}`} className="w-full">
                    <Button className="w-full rounded-xl font-semibold py-6">
                      Ver Detalhes
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default CoursesPage;