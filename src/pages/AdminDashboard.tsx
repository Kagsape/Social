"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Monitor, Calendar, Plus, Settings, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import LabComputerCard from '@/components/LabComputerCard';
import AdminLayout from '@/components/AdminLayout';
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
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalComputers: 0,
    reservationsToday: 0
  });
  const [recentComputers, setRecentComputers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Fetch total courses
      const { count: courseCount } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      // Fetch total computers
      const { count: computerCount } = await supabase
        .from('lab_computers')
        .select('*', { count: 'exact', head: true });

      // Fetch reservations today
      const today = new Date().toISOString().split('T')[0];
      const { count: reservationCount } = await supabase
        .from('lab_usage')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', `${today}T00:00:00`)
        .lte('start_time', `${today}T23:59:59`);

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalComputers: computerCount || 0,
        reservationsToday: reservationCount || 0
      });

      // Fetch recent computers
      const { data: computers } = await supabase
        .from('lab_computers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentComputers(computers || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
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
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Cursos</p>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Computadores</p>
                <p className="text-2xl font-bold">{stats.totalComputers}</p>
              </div>
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Reservas Hoje</p>
                <p className="text-2xl font-bold">{stats.reservationsToday}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Ações Rápidas</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/admin/courses">
                <Button className="h-20 w-full flex-col gap-2">
                  <Plus className="h-6 w-6" />
                  <span>Novo Curso</span>
                </Button>
              </Link>

              <Link to="/admin/users">
                <Button className="h-20 w-full flex-col gap-2">
                  <Users className="h-6 w-6" />
                  <span>Gerenciar Usuários</span>
                </Button>
              </Link>

              <Link to="/admin/lab">
                <Button className="h-20 w-full flex-col gap-2">
                  <Monitor className="h-6 w-6" />
                  <span>Gerenciar Lab</span>
                </Button>
              </Link>

              <Link to="/admin/settings">
                <Button className="h-20 w-full flex-col gap-2">
                  <Settings className="h-6 w-6" />
                  <span>Configurações</span>
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Computadores Recentes</h2>
            <div className="grid grid-cols-1 gap-4">
              {recentComputers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  Nenhum computador cadastrado.
                </div>
              ) : (
                recentComputers.map(computer => (
                  <div key={computer.id} className="bg-white dark:bg-slate-900 p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{computer.name}</h3>
                        <p className="text-sm text-muted-foreground">{computer.location || 'Sem localização'}</p>
                      </div>
                      <Badge variant={computer.status === 'working' ? 'default' : 'destructive'}>
                        {computer.status === 'working' ? 'Disponível' : 'Indisponível'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;