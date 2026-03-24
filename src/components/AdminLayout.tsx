"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Monitor, 
  Calendar, 
  Users, 
  Settings,
  ShieldCheck,
  BarChart3
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from './AuthProvider';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { userProfile } = useAuth();

  const adminNavItems = [
    { name: 'Visão Geral', path: '/admin', icon: LayoutDashboard },
    { name: 'Cursos', path: '/admin/courses', icon: BookOpen },
    { name: 'Laboratório', path: '/admin/lab', icon: Monitor },
    { name: 'Reservas', path: '/admin/reservations', icon: Calendar },
    { name: 'Usuários', path: '/admin/users', icon: Users },
    { name: 'Configurações', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <div className="container py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary p-2 rounded-lg">
                      <ShieldCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-bold">Admin</h3>
                      <p className="text-xs text-muted-foreground">{userProfile?.name}</p>
                    </div>
                  </div>
                  
                  <nav className="space-y-1">
                    {adminNavItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          location.pathname === item.path 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    ))}
                  </nav>
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm p-4">
                <h4 className="font-medium text-sm mb-3">Ações Rápidas</h4>
                <div className="space-y-2">
                  <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/courses">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Novo Curso
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/lab">
                      <Monitor className="h-4 w-4 mr-2" />
                      Adicionar PC
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Relatórios
                  </Button>
                </div>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;