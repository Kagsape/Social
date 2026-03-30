"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Terminal, Cpu, Globe, Users, Laptop, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedCourses = async () => {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select(`
            *,
            users!courses_teacher_id_fkey (name)
          `)
          .limit(3);

        if (error) throw error;
        setFeaturedCourses(data || []);
      } catch (error) {
        console.error('Error fetching featured courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedCourses();
  }, []);

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 md:py-24 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white mb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="relative z-10 px-8 md:px-16 max-w-3xl">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md">
            CIEP 165 Brigadeiro Sérgio Carvalho
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Sala de Informática: <span className="text-blue-400">Inovação e Futuro</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-xl">
            Bem-vindo ao portal de tecnologia do CIEP 165. Aqui você aprende programação, robótica e domina o mundo digital.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/login">
              <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white border-none">
                Acessar Minha Conta
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="lg" variant="outline" className="rounded-full px-8 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10">
                Ver Cursos
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block opacity-20">
          <div className="grid grid-cols-2 gap-8 animate-pulse">
            <Laptop size={80} />
            <Terminal size={80} className="mt-12" />
            <Cpu size={80} />
            <Code2 size={80} className="mt-12" />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cursos em Destaque</h2>
            <p className="text-muted-foreground">Comece sua jornada tecnológica hoje mesmo.</p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="group">
              Ver todos <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : featuredCourses.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum curso disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredCourses.map((course) => (
              <CourseCard 
                key={course.id} 
                title={course.name}
                instructor={course.users?.name || 'A definir'}
                thumbnail="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"
                rating={4.9}
                students={60}
                duration="20h"
                category={course.category || 'Tecnologia'}
              />
            ))}
          </div>
        )}
      </section>

      {/* Community Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border shadow-sm">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Nossa Sala de Informática</h2>
            <p className="text-lg text-muted-foreground mb-8">
              O CIEP 165 oferece um espaço moderno para que os alunos possam explorar ferramentas digitais, desde o básico da informática até a programação avançada.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Aprendizado Colaborativo</h4>
                  <p className="text-sm text-muted-foreground">Alunos ajudando alunos a crescer.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Globe className="text-green-600 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Conexão com o Mundo</h4>
                  <p className="text-sm text-muted-foreground">Acesso ilimitado ao conhecimento global.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60" 
              alt="Alunos estudando" 
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;