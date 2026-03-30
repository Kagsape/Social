"use client";

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Laptop, Book, Code } from 'lucide-react';

const Resources = () => {
  const resources = [
    {
      title: "Visual Studio Code",
      description: "O editor de código mais popular para desenvolvimento web e software.",
      category: "Software",
      icon: Code,
      link: "https://code.visualstudio.com/"
    },
    {
      title: "Guia de Informática Básica",
      description: "PDF completo com os primeiros passos para dominar o computador.",
      category: "PDF",
      icon: FileText,
      link: "#"
    },
    {
      title: "Node.js Installer",
      description: "Ambiente de execução JavaScript necessário para rodar aplicações modernas.",
      category: "Software",
      icon: Laptop,
      link: "https://nodejs.org/"
    },
    {
      title: "Documentação MDN",
      description: "A melhor fonte de consulta para HTML, CSS e JavaScript.",
      category: "Link",
      icon: Book,
      link: "https://developer.mozilla.org/"
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos e Materiais</h1>
          <p className="text-muted-foreground">Softwares, apostilas e links úteis para seus estudos.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((res, i) => (
            <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all group">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <res.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline">{res.category}</Badge>
                </div>
                <CardTitle className="text-xl">{res.title}</CardTitle>
                <CardDescription>{res.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={res.link} target="_blank" rel="noopener noreferrer">
                    {res.category === 'Software' || res.category === 'PDF' ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    {res.category === 'Software' || res.category === 'PDF' ? 'Baixar Agora' : 'Acessar Link'}
                  </a>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Resources;