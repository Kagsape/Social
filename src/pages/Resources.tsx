"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Laptop, Book, Code, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Resources = () => {
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setResources(data || []);
      } catch (error: any) {
        console.error('Erro ao buscar recursos:', error);
        // Se o erro for de tabela inexistente (PGRST205), marcamos o estado de erro
        if (error.code === 'PGRST205') {
          setError(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const getIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'software': return Code;
      case 'pdf': return FileText;
      case 'link': return Book;
      default: return Laptop;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recursos e Materiais</h1>
          <p className="text-muted-foreground">Softwares, apostilas e links úteis para seus estudos.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl p-8">
            <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
            <h3 className="text-lg font-bold mb-2">Configuração Necessária</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              A tabela de recursos ainda não foi criada no banco de dados. Por favor, execute o script SQL fornecido no painel do Supabase.
            </p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
            Nenhum recurso cadastrado ainda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((res) => {
              const Icon = getIcon(res.category);
              return (
                <Card key={res.id} className="border-none shadow-sm hover:shadow-md transition-all group">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Icon className="h-5 w-5" />
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
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Resources;