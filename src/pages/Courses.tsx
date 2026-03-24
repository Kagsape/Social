"use client";

import React from 'react';
import Layout from '@/components/Layout';
import CourseCard from '@/components/CourseCard';
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Courses = () => {
  const allCourses = [
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
    },
    {
      title: "Python para Data Science",
      instructor: "Letícia Silva",
      thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
      rating: 4.9,
      students: 3400,
      duration: "32h",
      category: "Data Science"
    },
    {
      title: "Segurança da Informação: Ethical Hacking",
      instructor: "Gabriel Pato",
      thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=60",
      rating: 4.9,
      students: 1500,
      duration: "40h",
      category: "Security"
    },
    {
      title: "DevOps com Docker e Kubernetes",
      instructor: "Fabrício Veronez",
      thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b193ef5?w=800&auto=format&fit=crop&q=60",
      rating: 4.8,
      students: 920,
      duration: "28h",
      category: "DevOps"
    }
  ];

  return (
    <Layout>
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4">Explore nossos Cursos</h1>
        <p className="text-muted-foreground text-lg">Aprenda as tecnologias mais demandadas pelo mercado com especialistas.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input placeholder="O que você quer aprender hoje?" className="pl-10 rounded-full" />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="bg-muted/50 rounded-full p-1">
              <TabsTrigger value="all" className="rounded-full px-6">Todos</TabsTrigger>
              <TabsTrigger value="frontend" className="rounded-full px-6">Frontend</TabsTrigger>
              <TabsTrigger value="backend" className="rounded-full px-6">Backend</TabsTrigger>
              <TabsTrigger value="mobile" className="rounded-full px-6">Mobile</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="icon" className="rounded-full shrink-0">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allCourses.map((course, index) => (
          <CourseCard key={index} {...course} />
        ))}
      </div>
    </Layout>
  );
};

export default Courses;