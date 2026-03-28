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
      title: "Apropriação Digital",
      instructor: "Prof. da Sala de Informática",
      thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60",
      rating: 5.0,
      students: 120,
      duration: "20h",
      category: "Básico"
    },
    {
      title: "Python para Iniciantes",
      instructor: "Prof. da Sala de Informática",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=60",
      rating: 4.9,
      students: 60,
      duration: "30h",
      category: "Programação"
    },
    {
      title: "Robótica com Arduino",
      instructor: "Prof. da Sala de Informática",
      thumbnail: "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800&auto=format&fit=crop&q=60",
      rating: 4.8,
      students: 45,
      duration: "25h",
      category: "Hardware"
    },
    {
      title: "Criação de Jogos com Scratch",
      instructor: "Prof. da Sala de Informática",
      thumbnail: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
      rating: 4.9,
      students: 85,
      duration: "15h",
      category: "Programação"
    }
  ];

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
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Tabs defaultValue="all" className="w-full">
            <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
              <TabsList className="bg-muted/50 rounded-full p-1 inline-flex min-w-full md:min-w-0">
                <TabsTrigger value="all" className="rounded-full px-6 whitespace-nowrap">Todos</TabsTrigger>
                <TabsTrigger value="programacao" className="rounded-full px-6 whitespace-nowrap">Programação</TabsTrigger>
                <TabsTrigger value="hardware" className="rounded-full px-6 whitespace-nowrap">Hardware</TabsTrigger>
              </TabsList>
            </div>
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