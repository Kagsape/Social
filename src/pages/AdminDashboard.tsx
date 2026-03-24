"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Monitor, Calendar, Plus, Settings, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import LabComputerCard from '@/components/LabComputerCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AdminDashboard = () => {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie todo o sistema da sala de informática.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <BookOpen className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Computadores</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <Monitor className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Reservas Hoje</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <Calendar className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-20 flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Novo Curso</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Curso</DialogTitle>
                  <DialogDescription>
                    Crie um novo curso para os alunos.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-name">Nome do Curso</Label>
                    <Input id="course-name" placeholder="Digite o nome do curso" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-desc">Descrição</Label>
                    <Input id="course-desc" placeholder="Descrição do curso" />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Criar Curso</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button className="h-20 flex-col gap-2">
              <Users className="h-6 w-6" />
              <span>Gerenciar Usuários</span>
            </Button>

            <Button className="h-20 flex-col gap-2">
              <Monitor className="h-6 w-6" />
              <span>Gerenciar Lab</span>
            </Button>

            <Button className="h-20 flex-col gap-2">
              <Settings className="h-6 w-6" />
              <span>Configurações</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Computadores Disponíveis</h2>
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Computador 01</h3>
                  <p className="text-sm text-muted-foreground">Sala Principal</p>
                </div>
                <Badge variant="default">Disponível</Badge>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Computador 02</h3>
                  <p className="text-sm text-muted-foreground">Sala Principal</p>
                </div>
                <Badge variant="default">Disponível</Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;