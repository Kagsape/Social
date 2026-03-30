import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ExternalLink, BookOpen, Code, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const resources = [
  {
    title: "Manual de Programação C++",
    description: "Guia completo para iniciantes na linguagem C++ usada no laboratório.",
    type: "PDF",
    category: "Estudo",
    icon: FileText,
    link: "#"
  },
  {
    title: "Visual Studio Code",
    description: "O editor de código principal para nossos projetos de desenvolvimento.",
    type: "Software",
    category: "Ferramenta",
    icon: Code,
    link: "https://code.visualstudio.com/"
  },
  {
    title: "Introdução a Redes",
    description: "Videoaula sobre os fundamentos de redes de computadores.",
    type: "Vídeo",
    category: "Aula",
    icon: Video,
    link: "#"
  },
  {
    title: "Documentação Supabase",
    description: "Aprenda a usar o backend do nosso portal.",
    type: "Link",
    category: "Documentação",
    icon: ExternalLink,
    link: "https://supabase.com/docs"
  },
  {
    title: "Apostila de Hardware",
    description: "Material de apoio para as aulas de montagem e manutenção.",
    type: "PDF",
    category: "Estudo",
    icon: BookOpen,
    link: "#"
  },
  {
    title: "Packet Tracer",
    description: "Simulador de redes da Cisco para práticas de laboratório.",
    type: "Software",
    category: "Ferramenta",
    icon: Download,
    link: "#"
  }
];

const Resources = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Recursos e Materiais</h1>
        <p className="text-muted-foreground mt-2">
          Acesse softwares, apostilas e links úteis para seus estudos no CIEP 165.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <resource.icon className="h-6 w-6 text-primary" />
                </div>
                <Badge variant="secondary">{resource.type}</Badge>
              </div>
              <CardTitle className="mt-4">{resource.title}</CardTitle>
              <CardDescription>{resource.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-6">
                {resource.description}
              </p>
              <Button className="w-full" asChild>
                <a href={resource.link} target="_blank" rel="noopener noreferrer">
                  {resource.type === 'Software' ? 'Baixar' : 'Acessar'}
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Resources;
