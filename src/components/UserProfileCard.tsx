"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from './AuthProvider';
import { User, Mail, Shield, GraduationCap, BookOpen } from 'lucide-react';

const UserProfileCard = () => {
  const { user, userProfile } = useAuth();

  if (!user || !userProfile) return null;

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'teacher': return <BookOpen className="h-4 w-4" />;
      case 'student': return <GraduationCap className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'teacher': return 'default';
      case 'student': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full max-w-sm border-none shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {userProfile.name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold">{userProfile.name}</h3>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            <Badge variant={getRoleBadgeVariant(userProfile.role) as any} className="gap-2">
              {getRoleIcon(userProfile.role)}
              {userProfile.role === 'admin' ? 'Administrador' : 
               userProfile.role === 'teacher' ? 'Professor' : 'Aluno'}
            </Badge>
          </div>

          {userProfile.student_id && (
            <div className="w-full pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Matrícula</span>
                <span className="font-mono font-medium">{userProfile.student_id}</span>
              </div>
            </div>
          )}

          {userProfile.teacher_id && (
            <div className="w-full pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Registro</span>
                <span className="font-mono font-medium">{userProfile.teacher_id}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;