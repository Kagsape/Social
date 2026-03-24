"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Monitor, Calendar, Plus, Settings, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import DashboardStats from '@/components/DashboardStats';
import LabComputerCard from '@/components/LabComputerCard';
import ComputerReservationForm from '@/components/ComputerReservationForm';
import AnnouncementForm from '@/components/AnnouncementForm';
import NotificationBell from '@/components/NotificationBell';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalComputers: 0,
    activeReservations: 0
  });
  const [computers, setComputers] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAdminData();
    }
  }, [user]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all stats
      const [
        { count: studentCount },
        { count: teacherCount },
        { count: courseCount },
        { count: computerCount },
        { count: reservationCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('lab_computers').select('*', { count: 'exact', head: true }),
        supabase.from('lab_usage').select('*', { count: 'exact', head: true }).eq('status', 'scheduled').gte('start_time', new Date().toISOString())
      ]);

      setStats({
        totalStudents: studentCount || 0,
        totalTeachers: teacherCount || 0,
        totalCourses: courseCount || 0,
        totalComputers: computerCount || 0,
        activeReservations: reservationCount || 0
      });

      // Fetch computers
      const { data: computersData } = await supabase
        .from('lab_computers')
        .select('*')
        .order('name');
      setComputers(computersData || []);

      // Fetch recent users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      setRecentUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintainComputer = async (computerId: string) => {
    try {
      await supabase
        .from('lab_computers')
        .update({ status: 'maintenance' })
        .eq('id', computerId);
      
      fetchAdminData();
    } catch (error) {
      console.error('Error updating computer:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-primary" />
              Painel Administrativo
            </h1>
            <p className="text-muted-foreground">Gerencie o sistema completo.</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
          </div>
        </div>

        {/* Stats */}
        <DashboardStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Lab Computers */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Monitor className="h-6 w-6" />
                  Laboratório
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/lab">Gerenciar Todos</Link>
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computers.slice(0, 4).map(computer => (
                  <LabComputerCard
                    key={computer.id}
                    computer={computer}
                    onMaintain={handleMaintainComputer}
                    showActions
                  />
                ))}
              </div>
            </section>

            {/* Recent Users */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Usuários Recentes
                </h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/admin/users">Ver Todos</Link>
                </Button>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentUsers.map(user => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <Badge variant={
                          user.role === 'admin' ? 'destructive' :
                          user.role === 'teacher' ? 'default' : 'secondary'
                        }>
                          {user.role === 'admin' ? 'Admin' : 
                           user.role === 'teacher' ? 'Professor' : 'Aluno'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Administrativas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/users">
                    <Users className="h-4 w-4 mr-2" />
                    Gerenciar Usuários
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/courses">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Gerenciar Cursos
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/lab">
                    <Monitor className="h-4 w-4 mr-2" />
                    Gerenciar Laboratório
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline" asChild>
                  <Link to="/admin/reservations">
                    <Calendar className="h-4 w-4 mr-2" />
                    Todas as Reservas
                  </Link>
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Relatórios
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              </CardContent>
            </Card>

            {/* Global Announcement */}
            <AnnouncementForm />

            {/* Quick Reservation */}
            <ComputerReservationForm />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;