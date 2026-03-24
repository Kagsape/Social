"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Bell, 
  Search, 
  User, 
  ShieldCheck,
  Monitor,
  Calendar,
  BarChart3,
  Settings
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from './AuthProvider';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const location = useLocation();
  const { userProfile } = useAuth();
  
  const getNavItems = () => {
    const commonItems = [
      { name: 'Início', path: '/', icon: LayoutDashboard },
    ];

    if (!userProfile) {
      return commonItems;
    }

    const roleBasedItems = [];

    if (userProfile.role === 'student') {
      roleBasedItems.push(
        { name: 'Feed', path: '/feed', icon: Users },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      );
    } else if (userProfile.role === 'teacher') {
      roleBasedItems.push(
        { name: 'Feed', path: '/feed', icon: Users },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Painel', path: '/teacher', icon: LayoutDashboard }
      );
    } else if (userProfile.role === 'admin') {
      roleBasedItems.push(
        { name: 'Admin', path: '/admin', icon: ShieldCheck },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Laboratório', path: '/admin/lab', icon: Monitor },
        { name: 'Reservas', path: '/admin/reservations', icon: Calendar },
        { name: 'Usuários', path: '/admin/users', icon: Users },
        { name: 'Config', path: '/admin/settings', icon: Settings }
      );
    }

    return [...commonItems, ...roleBasedItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden md:inline-block">CIEP 165</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-1 justify-end max-w-md">
          <div className="relative w-full max-w-[200px] lg:max-w-[300px] hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {userProfile && <NotificationBell />}
            <Link to="/login">
              <Button variant="ghost" size="icon" className="rounded-full border">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;