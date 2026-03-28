"use client";

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Search, 
  User, 
  ShieldCheck,
  Monitor,
  Menu,
  X
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
  const { userProfile } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
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
        { name: 'Feed', path: '/feed', icon: Users },
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
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
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

        <div className="flex items-center gap-2 flex-1 justify-end">
          <div className="relative w-full max-w-[200px] lg:max-w-[300px] hidden md:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
            />
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
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
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar cursos, posts..."
              className="pl-10 rounded-xl bg-muted/50 border-none"
              autoFocus
            />
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;