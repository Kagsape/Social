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
  X,
  Sun,
  Moon,
  MessageSquare,
  Trophy,
  FolderKanban,
  Calendar,
  HelpCircle,
  FileText
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from './AuthProvider';
import NotificationBell from './NotificationBell';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
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
      setIsSearchOpen(false);
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
      { name: 'Ajuda', path: '/help', icon: HelpCircle },
    ];

    if (!userProfile) {
      return commonItems;
    }

    const roleBasedItems = [];

    if (userProfile.role === 'student') {
      roleBasedItems.push(
        { name: 'Feed', path: '/feed', icon: Users },
        { name: 'Mensagens', path: '/messages', icon: MessageSquare },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      );
    } else if (userProfile.role === 'teacher') {
      roleBasedItems.push(
        { name: 'Feed', path: '/feed', icon: Users },
        { name: 'Mensagens', path: '/messages', icon: MessageSquare },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Painel', path: '/teacher', icon: LayoutDashboard }
      );
    } else if (userProfile.role === 'admin') {
      roleBasedItems.push(
        { name: 'Feed', path: '/feed', icon: Users },
        { name: 'Mensagens', path: '/messages', icon: MessageSquare },
        { name: 'Admin', path: '/admin', icon: ShieldCheck },
        { name: 'Cursos', path: '/courses', icon: BookOpen },
        { name: 'Laboratório', path: '/admin/lab', icon: Monitor }
      );
    }

    return [...commonItems, ...roleBasedItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="bg-primary p-1.5 rounded-lg">
                    <LayoutDashboard className="h-5 w-5 text-primary-foreground" />
                  </div>
                  CIEP 165
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      location.pathname === item.path 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent text-muted-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center space-x-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutDashboard className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">CIEP 165</span>
          </Link>
          
          <div className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.path ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 justify-end">
          <form onSubmit={handleGlobalSearch} className="relative w-full max-w-[150px] lg:max-w-[200px] hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar na comunidade..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1 h-9 text-sm"
            />
          </form>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-9 w-9"
              onClick={toggleTheme}
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>
            {userProfile && <NotificationBell />}
            {userProfile ? (
              <Link to="/profile">
                <Button variant="ghost" size="icon" className="rounded-full border overflow-hidden h-9 w-9">
                  {userProfile.avatar_url ? (
                    <img src={userProfile.avatar_url} alt="Perfil" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="icon" className="rounded-full border h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      {isSearchOpen && (
        <div className="md:hidden p-4 border-t bg-background animate-in slide-in-from-top duration-200">
          <form onSubmit={handleGlobalSearch} className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar na comunidade..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="pl-10 rounded-xl bg-muted/50 border-none"
              autoFocus
            />
          </form>
        </div>
      )}
    </nav>
  );
};

export default Navbar;