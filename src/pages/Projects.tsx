import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Heart, MessageSquare, Share2, ExternalLink } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const initialProjects = [
  {
    id: 1,
    title: "Robô Seguidor de Linha",
    description: "Um robô construído com Arduino que utiliza sensores infravermelhos para seguir uma linha preta no chão.",
    image: "https://images.unsplash.com/photo-1531746790731-6c087fecd05a?w=800&auto=format&fit=crop&q=60",
    author: "Ana Silva",
    authorAvatar: "https://i.pravatar.cc/150?u=ana",
    likes: 45,
    comments: 12,
    tags: ["Robótica", "Arduino", "C++"]
  },
  {
    id: 2,
    title: "App de Gestão Escolar",
    description: "Protótipo de um aplicativo mobile para ajudar alunos a organizarem seus horários e notas.",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60",
    author: "João Pereira",
    authorAvatar: "https://i.pravatar.cc/150?u=joao",
    likes: 32,
    comments: 8,
    tags: ["Mobile", "React Native", "UI/UX"]
  },
  {
    id: 3,
    title: "Site de Receitas Saudáveis",
    description: "Um site responsivo com receitas focadas em alimentação saudável para estudantes.",
    image: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=60",
    author: "Maria Santos",
    authorAvatar: "https://i.pravatar.cc/150?u=maria",
    likes: 28,
    comments: 5,
    tags: ["Web", "HTML/CSS", "JavaScript"]
  },
  {
    id: 4,
    title: "Jogo de Plataforma 2D",
    description: "Um jogo simples de plataforma desenvolvido no laboratório usando a engine Unity.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=60",
    author: "Pedro Oliveira",
    authorAvatar: "https://i.pravatar.cc/150?u=pedro",
    likes: 56,
    comments: 15,
    tags: ["Games", "Unity", "C#"]
  }
];

const Projects = () => {
  const [projects, setProjects] = useState(initialProjects);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newProject = {
      id: projects.length + 1,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
      author: "Você",
      authorAvatar: "https://i.pravatar.cc/150?u=you",
      likes: 0,
      comments: 0,
      tags: (formData.get('tags') as string).split(',').map(t => t.trim())
    };

    setProjects([newProject, ...projects]);
    setIsDialogOpen(false);
    toast({
      title: "Projeto enviado!",
      description: "Seu projeto foi publicado com sucesso na galeria.",
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Galeria de Projetos</h1>
            <p className="text-muted-foreground">
              Explore e compartilhe os trabalhos incríveis desenvolvidos pelos alunos do CIEP 165.
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full px-6">
                <Plus className="mr-2 h-4 w-4" /> Postar Projeto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <form onSubmit={handleAddProject}>
                <DialogHeader>
                  <DialogTitle>Compartilhar Projeto</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes do seu projeto para que todos possam ver.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título do Projeto</Label>
                    <Input id="title" name="title" placeholder="Ex: Robô Seguidor de Linha" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea id="description" name="description" placeholder="Conte um pouco sobre o que você criou..." required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input id="tags" name="tags" placeholder="Ex: Robótica, Arduino, C++" required />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Publicar Projeto</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project) => (
            <Card key={project.id} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-muted/60">
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="secondary" className="rounded-full">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex gap-1 flex-wrap">
                    {project.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] px-2 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">{project.title}</CardTitle>
                <CardDescription className="line-clamp-2">{project.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-4 border-t flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={project.authorAvatar} />
                    <AvatarFallback>{project.author.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium">{project.author}</span>
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex items-center gap-1 text-xs">
                    <Heart className="h-3 w-3" /> {project.likes}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <MessageSquare className="h-3 w-3" /> {project.comments}
                  </div>
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
