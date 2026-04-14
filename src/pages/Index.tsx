"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Terminal, Cpu, Globe, Users, Laptop, BookOpen, Monitor } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [featuredCourses, setFeaturedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [labStatus, setLabStatus] = useState({ total: 0, working: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured courses with enrollment count
        const { data: courses } = await supabase
          .from('courses')
          .select(`
            *,
            users!courses_teacher_id_fkey (name),
            enrollments (count)
          `)
          .limit(3);
        
        const processed = (courses || []).map(c => ({
          ...c,
          student_count: c.enrollments?.[0]?.count || 0
        }));
        
        setFeaturedCourses(processed);

        // Fetch lab status
        const { data: computers } = await supabase
          .from('lab_computers')
          .select('status');
        
        if (computers) {
          setLabStatus({
            total: computers.length,
            working: computers.filter(c => c.status === 'working').length
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Layout>
      {/* Lab Status Widget */}
      <div className="mb-8 flex justify-center px-4">
        <div className="bg-white dark:bg-slate-900 px-4 md:px-6 py-3 rounded-2xl md:rounded-full border shadow-sm flex flex-wrap items-center justify-center gap-3 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-700 max-w-full">
          <div className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${labStatus.working > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs md:text-sm font-bold whitespace-nowrap">Status do Laboratório</span>
          </div>
          <div className="hidden md:block h-4 w-px bg-border" />
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium whitespace-nowrap">{labStatus.working} / {labStatus.total} Máquinas Livres</span>
          </div>
          <Link to="/dashboard">
            <Button size="sm" variant="ghost" className="h-8 rounded-full text-[10px] md:text-xs gap-1">
              Reservar <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative py-12 md:py-24 overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white mb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="relative z-10 px-6 md:px-16 max-w-3xl">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md">
            CIEP 165 Brigadeiro Sérgio Carvalho
          </Badge>
          <h1 className="text-3xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Sala de Informática: <span className="text-blue-400">Inovação e Futuro</span>
          </h1>
          <p className="text-base md:text-xl text-slate-300 mb-8 max-w-xl">
            Bem-vindo ao portal de tecnologia do CIEP 165. Aqui você aprende programação, robótica e domina o mundo digital.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/login">
              <Button size="lg" className="rounded-full px-6 md:px-8 bg-blue-600 hover:bg-blue-700 text-white border-none text-sm md:text-base">
                Acessar Minha Conta
              </Button>
            </Link>
            <Link to="/courses">
              <Button size="lg" variant="outline" className="rounded-full px-6 md:px-8 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10 text-sm md:text-base">
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Cursos em Destaque</h2>
            <p className="text-muted-foreground text-sm md:text-base">Comece sua jornada tecnológica hoje mesmo.</p>
          </div>
          <Link to="/courses">
            <Button variant="ghost" className="group text-sm">
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
                id={course.id}
                title={course.name}
                instructor={course.users?.name || 'A definir'}
                thumbnail={course.image_url}
                students={course.student_count}
                duration={course.duration}
                category={course.category}
              />
            ))}
          </div>
        )}
      </section>

      {/* Community Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-12 border shadow-sm">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Nossa Sala de Informática</h2>
            <p className="text-sm md:text-lg text-muted-foreground mb-8">
              O CIEP 165 oferece um espaço moderno para que os alunos possam explorar ferramentas digitais, desde o básico da informática até a programação avançada.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Users className="text-blue-600 h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">Aprendizado Colaborativo</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">Alunos ajudando alunos a crescer.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Globe className="text-green-600 h-5 w-5 md:h-6 md:w-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm md:text-base">Conexão com o Mundo</h4>
                  <p className="text-xs md:text-sm text-muted-foreground">Acesso ilimitado ao conhecimento global.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=60" 
              alt="Alunos estudando" 
              className="rounded-2xl shadow-2xl w-full h-auto"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;