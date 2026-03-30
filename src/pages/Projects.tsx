"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ExternalLink, Github, Heart, MessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Projects = () => {
  const [projects, setProjects] = useState([
    {
      id: 1,
      title: "Meu Primeiro Site",
      description: "Um site simples feito com HTML e CSS puro para apresentar meu currículo.",
      author: "Ana Silva",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=60",
      likes: 24,
      comments: 5,
      tags: ["HTML", "CSS"]
    },
    {
      id: 2,
      title: "Calculadora em Python",
      description: "Uma calculadora funcional que roda no terminal, feita durante as aulas de lógica.",
      author: "João Pereira",
      image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60",
      likes: 18,
      comments: 2,
      tags: ["Python", "Lógica"]
    }
  ]);

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Galeria de Projetos</h1>
            <p className="text-muted-foreground">Trabalhos incríveis criados pelos alunos do CIEP 165.</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full px-6">
                <Plus className="h-4 w-4" /> Enviar Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Compartilhe seu Trabalho</DialogTitle>
                <DialogDescription>
                  Mostre para a comunidade o que você andou criando na Sala de Informática.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título do Projeto</Label>
                  <Input id="title" placeholder="Ex: Meu Jogo em Scratch" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" placeholder="Conte um pouco sobre como você fez..." />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="link">Link (GitHub ou Site)</Label>
                  <Input id="link" placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">Publicar Projeto</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group rounded-2xl">
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  {project.tags.map(tag => (
                    <Badge key={tag} className="bg-black/50 backdrop-blur-md border-none">{tag}</Badge>
                  ))}
                </div>
              </div>
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.title}</CardTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]">{project.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-medium">por {project.author}</span>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
              </CardContent>
              <CardFooter className="p-5 pt-0 flex items-center justify-between border-t mt-2">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                    <Heart className="h-4 w-4" /> {project.likes}
                  </button>
                  <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                    <MessageSquare className="h-4 w-4" /> {project.comments}
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Github className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Projects;