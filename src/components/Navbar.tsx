"use client";

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Search, 
  ShieldCheck,
  Menu,
  Sun,
  Moon,
  MessageSquare,
  Trophy,
  FolderKanban,
  Calendar,
  FileText,
  GraduationCap,
  ChevronDown,
  HelpCircle,
  Package
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, isAdmin, isTeacher } = useAuth();
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
  
  const mainItems = [
    { name: 'Início', path: '/', icon: LayoutDashboard },
    { name: 'Feed', path: '/feed', icon: Users, protected: true },
    { name: 'Mensagens', path: '/messages', icon: MessageSquare, protected: true },
    { name: 'Cursos', path: '/courses', icon: BookOpen, protected: true },
    { name: 'Inventário', path: '/inventory', icon: Package, protected: true },
  ];

  const secondaryItems = [
    { name: 'Meu Aprendizado', path: '/dashboard', icon: GraduationCap, protected: true },
    { name: 'Recursos', path: '/resources', icon: FileText },
    { name: 'Ranking', path: '/leaderboard', icon: Trophy },
    { name: 'Projetos', path: '/projects', icon: FolderKanban },
    { name: 'Eventos', path: '/events', icon: Calendar },
    { name: 'Ajuda', path: '/help', icon: HelpCircle },
  ];

  const adminItems = [];
  if (isTeacher) {
    adminItems.push({ name: 'Painel Professor', path: '/teacher', icon: LayoutDashboard });
  }
  if (isAdmin) {
    adminItems.push({ name: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  const allItems = [...mainItems, ...secondaryItems, ...adminItems];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
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
                {allItems.map((item) => {
                  if (item.protected && !userProfile) return null;
                  return (
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
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center space-x-2 shrink-0">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight hidden sm:inline-block">CIEP 165</span>
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1">
            {mainItems.map((item) => {
              if (item.protected && !userProfile) return null;
              return (
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
              );
            })}

            {/* Dropdown for secondary items */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="rounded-full px-3 h-8 text-xs gap-1 text-muted-foreground">
                  Mais <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-xl border-none">
                {secondaryItems.map((item) => {
                  if (item.protected && !userProfile) return null;
                  return (
                    <DropdownMenuItem key={item.path} asChild>
                      <Link to={item.path} className="flex items-center gap-2 cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        <span>{item.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                {adminItems.length > 0 && (
                  <>
                    <div className="h-px bg-muted my-1" />
                    {adminItems.map((item) => (
                      <DropdownMenuItem key={item.path} asChild>
                        <Link to={item.path} className="flex items-center gap-2 cursor-pointer font-bold text-primary">
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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