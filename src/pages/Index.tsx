"use client";

import React from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Code2, Terminal, Cpu, Globe, Users } from 'lucide-react';

const Index = () => {
  const featuredCourses = [
    {
      title: "Mastering React & Next.js 14",
      instructor: "Diego Fernandes",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60",
      rating: 4.9,
      students: 1240,
      duration: "24h",
      category: "Frontend"
    },
    {
      title: "Node.js Avançado com TypeScript",
      instructor: "Rodrigo Gonçalves",
      thumbnail: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=60",
      rating: 4.8,
      students: 850,
      duration: "18h",
      category: "Backend"
    },
    {
      title: "UI/UX Design para Desenvolvedores",
      instructor: "Tiago Luchtenberg",
      thumbnail: "https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?w=800&auto=format&fit=crop&q=60",
      rating: 4.7,
      students: 2100,
      duration: "12h",
      category: "Design"
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-12 md:py-24 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white mb-16">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        </div>
        <div className="relative z-10 px-8 md:px-16 max-w-3xl">
          <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md">
            Nova Versão 2.0 Disponível
          </Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            Acelere sua carreira em <span className="text-blue-400">Tecnologia</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-xl">
            Aprenda com os melhores especialistas, conecte-se com outros profissionais e conquiste as melhores vagas do mercado.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button size="lg" className="rounded-full px-8 bg-blue-600 hover:bg-blue-700 text-white border-none">
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 bg-white/5 backdrop-blur-sm border-white/20 hover:bg-white/10">
              Ver Cursos
            </Button>
          </div>
        </div>
        
        {/* Floating Icons Decoration */}
        <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block opacity-20">
          <div className="grid grid-cols-2 gap-8 animate-pulse">
            <Code2 size={80} />
            <Terminal size={80} className="mt-12" />
            <Cpu size={80} />
            <Globe size={80} className="mt-12" />
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cursos em Destaque</h2>
            <p className="text-muted-foreground">Os cursos mais procurados pela comunidade esta semana.</p>
          </div>
          <Button variant="ghost" className="group">
            Ver todos <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredCourses.map((course, index) => (
            <CourseCard key={index} {...course} />
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 border shadow-sm">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">Faça parte da nossa comunidade</h2>
            <p className="text-lg text-muted-foreground mb-8">
              No InfoHub você não apenas estuda, você constrói networking. Compartilhe seus projetos, tire dúvidas e ajude outros desenvolvedores.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                  <Users className="text-blue-600 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Networking Real</h4>
                  <p className="text-sm text-muted-foreground">Conecte-se com recrutadores e devs seniores.</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                  <Globe className="text-green-600 h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-semibold">Fórum de Discussão</h4>
                  <p className="text-sm text-muted-foreground">Tire suas dúvidas técnicas em tempo real.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="relative">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60" 
              alt="Comunidade" 
              className="rounded-2xl shadow-2xl"
            />
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg border animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">JD</div>
                <div>
                  <p className="text-xs font-bold">João Silva postou:</p>
                  <p className="text-xs text-muted-foreground">"Acabei de finalizar meu primeiro app!"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;