"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, ExternalLink, Github, Heart, MessageSquare, Loader2 } from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          users (name, avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Erro ao buscar projetos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          title: formData.get('title'),
          description: formData.get('description'),
          link: formData.get('link'),
          user_id: user.id,
          tags: ['Projeto'] // Tags padrão
        });

      if (error) throw error;

      showSuccess('Projeto compartilhado com sucesso!');
      setIsDialogOpen(false);
      fetchProjects();
    } catch (error) {
      showError('Erro ao publicar projeto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Galeria de Projetos</h1>
            <p className="text-muted-foreground">Trabalhos incríveis criados pelos alunos do CIEP 165.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full px-6">
                <Plus className="h-4 w-4" /> Enviar Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddProject}>
                <DialogHeader>
                  <DialogTitle>Compartilhe seu Trabalho</DialogTitle>
                  <DialogDescription>
                    Mostre para a comunidade o que você andou criando na Sala de Informática.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título do Projeto</Label>
                    <Input id="title" name="title" placeholder="Ex: Meu Jogo em Scratch" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" placeholder="Conte um pouco sobre como você fez..." required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="link">Link (GitHub ou Site)</Label>
                    <Input id="link" name="link" placeholder="https://..." />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? 'Publicando...' : 'Publicar Projeto'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
            Nenhum projeto compartilhado ainda. Seja o primeiro!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Card key={project.id} className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group rounded-2xl">
                <div className="relative aspect-video overflow-hidden bg-muted flex items-center justify-center">
                  {project.image_url ? (
                    <img 
                      src={project.image_url} 
                      alt={project.title} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                      <Plus className="h-8 w-8 opacity-20" />
                      <span className="text-xs">Sem imagem</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {project.tags?.map((tag: string) => (
                      <Badge key={tag} className="bg-black/50 backdrop-blur-md border-none">{tag}</Badge>
                    ))}
                  </div>
                </div>
                <CardHeader className="p-5 pb-2">
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={project.users?.avatar_url} />
                      <AvatarFallback className="text-[10px]">{project.users?.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground font-medium">por {project.users?.name}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-5 pt-2">
                  <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                </CardContent>
                <CardFooter className="p-5 pt-0 flex items-center justify-between border-t mt-2">
                  <div className="flex items-center gap-4">
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors">
                      <Heart className="h-4 w-4" /> {project.likes_count || 0}
                    </button>
                    <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                      <MessageSquare className="h-4 w-4" /> {project.comments_count || 0}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {project.link && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <a href={project.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Projects;