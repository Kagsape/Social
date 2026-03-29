"use client";

import React, { useEffect, useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Monitor, Calendar, Plus, Settings, BarChart3 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import LabComputerCard from '@/components/LabComputerCard';
import AdminLayout from '@/components/AdminLayout';
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const AdminDashboard = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalComputers: 0,
    reservationsToday: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentComputers, setRecentComputers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
      const { count: computerCount } = await supabase.from('lab_computers').select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { count: reservationCount } = await supabase
        .from('lab_usage')
        .select('*', { count: 'exact', head: true })
        .gte('start_time', `${today}T00:00:00`);

      setStats({
        totalUsers: userCount || 0,
        totalCourses: courseCount || 0,
        totalComputers: computerCount || 0,
        reservationsToday: reservationCount || 0
      });

      // Dados fictícios para o gráfico (em um app real, viria de uma query de agregação)
      setChartData([
        { name: 'Seg', reservas: 12 },
        { name: 'Ter', reservas: 19 },
        { name: 'Qua', reservas: 15 },
        { name: 'Qui', reservas: 22 },
        { name: 'Sex', reservas: 30 },
        { name: 'Sáb', reservas: 5 },
      ]);

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
            <p className="text-muted-foreground">Visão geral do ecossistema digital do CIEP 165.</p>
          </div>
          <Badge variant="outline" className="px-4 py-1 gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Sistema Online
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Usuários', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Cursos', value: stats.totalCourses, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Computadores', value: stats.totalComputers, icon: Monitor, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Reservas Hoje', value: stats.reservationsToday, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
          ].map((item, i) => (
            <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                  <p className="text-3xl font-black mt-1">{item.value}</p>
                </div>
                <div className={`${item.bg} p-3 rounded-xl`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Uso do Laboratório (Semanal)
              </h2>
              <Badge variant="secondary">Últimos 7 dias</Badge>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="reservas" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 4 ? '#2563eb' : '#94a3b8'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold">Ações Rápidas</h2>
            <div className="grid grid-cols-1 gap-3">
              <Link to="/admin/courses">
                <Button variant="outline" className="w-full justify-start h-14 rounded-xl gap-4 border-dashed hover:border-primary hover:bg-primary/5">
                  <div className="bg-blue-100 p-2 rounded-lg"><Plus className="h-4 w-4 text-blue-600" /></div>
                  Criar Novo Curso
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start h-14 rounded-xl gap-4 border-dashed hover:border-primary hover:bg-primary/5">
                  <div className="bg-green-100 p-2 rounded-lg"><Users className="h-4 w-4 text-green-600" /></div>
                  Gerenciar Usuários
                </Button>
              </Link>
              <Link to="/admin/lab">
                <Button variant="outline" className="w-full justify-start h-14 rounded-xl gap-4 border-dashed hover:border-primary hover:bg-primary/5">
                  <div className="bg-purple-100 p-2 rounded-lg"><Monitor className="h-4 w-4 text-purple-600" /></div>
                  Status do Laboratório
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;