"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, BookOpen, Users, Clock, Star } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const CoursesPage = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('courses').select('*');
      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Cursos da Sala de Informática</h1>
        <p className="text-muted-foreground text-lg">Explore as trilhas de conhecimento do CIEP 165.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="O que você quer aprender hoje?" className="pl-10 rounded-full" />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => (
            <Card key={course.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-none bg-white dark:bg-slate-900">
              <div className="relative aspect-video overflow-hidden">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-white" />
                </div>
                <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
                  {course.category || 'Curso'}
                </Badge>
              </div>
              <CardHeader className="p-4 pb-2">
                <h3 className="font-bold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                  {course.name}
                </h3>
                <p className="text-sm text-muted-foreground">{course.description}</p>
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
                <Button className="w-full rounded-full font-semibold">
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default CoursesPage;