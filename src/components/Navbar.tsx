"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Search, 
  User, 
  ShieldCheck,
  Monitor,
  Menu,
  Sun,
  Moon,
  MessageSquare,
  Trophy,
  FolderKanban,
  Calendar,
  FileText,
  GraduationCap
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from './AuthProvider';
import NotificationBell from './NotificationBell';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [globalSearch, setGlobalSearch] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (globalSearch.trim()) {
      navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
      setGlobalSearch('');
    }
  };
  
  const getNavItems = () => {
    const commonItems = [
      { name: 'Início', path: '/', icon: LayoutDashboard },
      { name: 'Recursos', path: '/resources', icon: FileText },
      { name: 'Ranking', path: '/leaderboard', icon: Trophy },
      { name: 'Projetos', path: '/projects', icon: FolderKanban },
      { name: 'Eventos', path: '/events', icon: Calendar },
    ];

    if (!userProfile) return commonItems;

    const roleBasedItems = [
      { name: 'Feed', path: '/feed', icon: Users },
      { name: 'Mensagens', path: '/messages', icon: MessageSquare },
      { name: 'Cursos', path: '/courses', icon: BookOpen },
      { name: 'Meu Aprendizado', path: '/dashboard', icon: GraduationCap }
    ];

    if (userProfile.role === 'teacher') {
      roleBasedItems.push({ name: 'Painel Professor', path: '/teacher', icon: LayoutDashboard });
    } else if (userProfile.role === 'admin') {
      roleBasedItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
    }

    return [...commonItems, ...roleBasedItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  CIEP 165
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 mt-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      location.pathname === item.path 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">CIEP 165</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-1">
            {navItems.slice(0, 5).map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors hover:bg-accent",
                  location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <form onSubmit={handleGlobalSearch} className="relative w-full max-w-[120px] md:max-w-[180px] hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-8 rounded-full bg-muted/50 border-none h-8 text-xs"
            />
          </form>
          
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={toggleTheme}>
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
            {userProfile && <NotificationBell />}
            {userProfile ? (
              <Link to="/profile">
                <Avatar className="h-8 w-8 border">
                  <AvatarImage src={userProfile.avatar_url} />
                  <AvatarFallback>{userProfile.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
            ) : (
              <Link to="/login">
                <Button size="sm" className="rounded-full px-4 h-8 text-xs font-bold">Entrar</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;