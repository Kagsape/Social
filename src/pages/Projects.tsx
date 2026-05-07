"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Book, Heart, MessageSquare, Loader2, Image as ImageIcon, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let imageUrl = null;

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `projects/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('uploads')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrl;
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          title: formData.get('title'),
          description: formData.get('description'),
          link: formData.get('link'),
          image_url: imageUrl,
          user_id: user.id,
          tags: ['Em Desenvolvimento']
        });

      if (error) throw error;

      await supabase.rpc('increment_user_points', { 
        user_id: user.id, 
        points_to_add: 50 
      });

      showSuccess('Diário de projeto iniciado! Você ganhou 50 pontos.');
      setIsDialogOpen(false);
      setImageFile(null);
      setImagePreview(null);
      fetchProjects();
    } catch (error) {
      console.error('Erro ao iniciar projeto:', error);
      showError('Erro ao iniciar projeto.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Diários de Projetos</h1>
            <p className="text-muted-foreground">Acompanhe a jornada de criação dos alunos do CIEP 165.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-full px-6">
                <Plus className="h-4 w-4" /> Iniciar Novo Diário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <form onSubmit={handleAddProject}>
                <DialogHeader>
                  <DialogTitle>Começar uma Jornada</DialogTitle>
                  <DialogDescription>
                    Dê um título e uma descrição geral ao seu projeto. Você poderá postar o progresso depois.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Nome do Projeto</Label>
                    <Input id="title" name="title" placeholder="Ex: Meu Primeiro Robô" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Objetivo do Projeto</Label>
                    <Textarea id="description" name="description" placeholder="O que você pretende criar?" required />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Capa (Opcional)</Label>
                    <div 
                      className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative">
                          <img src={imagePreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                          <Button 
                            type="button"
                            variant="destructive" 
                            size="icon" 
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                            onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="h-8 w-8 opacity-50" />
                          <span className="text-xs">Selecione uma imagem de capa</span>
                        </div>
                      )}
                    </div>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Começar Diário
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
            Nenhum diário iniciado ainda. Comece o seu!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} to={`/projects/${project.id}`}>
                <Card className="overflow-hidden border-none shadow-sm hover:shadow-xl transition-all group rounded-2xl h-full flex flex-col">
                  <div className="relative aspect-video overflow-hidden bg-muted flex items-center justify-center">
                    {project.image_url ? (
                      <img 
                        src={project.image_url} 
                        alt={project.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Book className="h-8 w-8 opacity-20" />
                        <span className="text-xs">Sem capa</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-primary/90 backdrop-blur-md border-none">Diário</Badge>
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">{project.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={project.users?.avatar_url} />
                        <AvatarFallback className="text-[10px]">{project.users?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground font-medium">por {project.users?.name}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-2 flex-1">
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  </CardContent>
                  <CardFooter className="p-5 pt-0 flex items-center justify-between border-t mt-2">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Heart className="h-4 w-4" /> {project.likes_count || 0}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2 text-primary font-bold">
                      Ver Diário <ArrowRight className="h-3 w-3" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Projects;