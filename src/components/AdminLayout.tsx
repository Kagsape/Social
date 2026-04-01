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
  History,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/components/AuthProvider';
import { Card, CardContent } from "@/components/ui/card";
import Layout from './Layout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
  
  const CHIEF_ADMIN_EMAIL = 'xakatosh66@gmail.com';
  const isChiefAdmin = user?.email === CHIEF_ADMIN_EMAIL;
  
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Cursos', path: '/admin/courses', icon: BookOpen },
    { name: 'Laboratório', path: '/admin/lab', icon: Monitor },
    { name: 'Reservas', path: '/admin/reservations', icon: Calendar },
    { name: 'Usuários', path: '/admin/users', icon: Users },
    { name: 'Logs', path: '/admin/logs', icon: History },
    { name: 'Cargos', path: '/admin/roles', icon: ShieldCheck, chiefOnly: true },
    { name: 'Configurações', path: '/admin/settings', icon: Settings },
  ];

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 sticky top-24">
            <CardContent className="p-4">
              <div className="mb-6 px-2">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administração {isChiefAdmin && "(Chefe)"}
                </h2>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => {
                  if (item.chiefOnly && !isChiefAdmin) return null;
                  
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={cn("h-4 w-4", location.pathname === item.path ? "text-white" : "text-muted-foreground group-hover:text-primary")} />
                        {item.name}
                      </div>
                      {location.pathname === item.path && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  );
                })}
              </nav>
              
              <div className="mt-8 pt-6 border-t">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sair do Painel
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default AdminLayout;