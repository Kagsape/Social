"use client";

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings, 
  Plus, 
  Users, 
  BookOpen, 
  BarChart3, 
  Trash2, 
  Edit,
  ShieldCheck
} from 'lucide-react';
import { showSuccess } from '@/utils/toast';

const Admin = () => {
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Alterações salvas com sucesso!");
  };

  return (
    <Layout>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <ShieldCheck className="h-10 w-10 text-primary" />
              Sala de Controle
            </h1>
            <p className="text-muted-foreground text-lg">Gerencie o conteúdo e usuários do CIEP 165.</p>
          </div>
          <Button className="rounded-full gap-2">
            <Plus className="h-4 w-4" /> Novo Curso
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg gap-2">
              <BarChart3 className="h-4 w-4" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="courses" className="rounded-lg gap-2">
              <BookOpen className="h-4 w-4" /> Cursos
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-lg gap-2">
              <Users className="h-4 w-4" /> Alunos
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg gap-2">
              <Settings className="h-4 w-4" /> Configurações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-blue-50 dark:bg-blue-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-blue-600">Total de Alunos</CardTitle>
                  <div className="text-3xl font-bold">312</div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">+12% desde o mês passado</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-green-600">Cursos Ativos</CardTitle>
                  <div className="text-3xl font-bold">8</div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">2 novos cursos em rascunho</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-purple-50 dark:bg-purple-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-purple-600">Acessos Hoje</CardTitle>
                  <div className="text-3xl font-bold">45</div>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">Pico às 14:00 (Horário da aula)</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Gerenciar Cursos</CardTitle>
                <CardDescription>Edite ou remova os cursos disponíveis na plataforma.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "Apropriação Digital", students: 120, status: "Publicado" },
                    { name: "Python para Iniciantes", students: 60, status: "Publicado" },
                    { name: "Robótica com Arduino", students: 45, status: "Publicado" },
                    { name: "Lógica com Scratch", students: 85, status: "Publicado" }
                  ].map((course) => (
                    <div key={course.name} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                      <div>
                        <h4 className="font-bold">{course.name}</h4>
                        <p className="text-sm text-muted-foreground">{course.students} alunos matriculados</p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-lg">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-lg text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Configurações do Site</CardTitle>
                <CardDescription>Altere informações globais do portal do CIEP 165.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site-name">Nome da Escola</Label>
                      <Input id="site-name" defaultValue="CIEP 165 Brigadeiro Sérgio Carvalho" className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="announcement">Aviso Global (Banner)</Label>
                      <Input id="announcement" placeholder="Ex: Matrículas abertas para Robótica!" className="rounded-xl" />
                    </div>
                  </div>
                  <Button type="submit" className="rounded-xl px-8">Salvar Alterações</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Admin;