"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, isAdmin, loading, authError, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Verificando acesso...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-destructive/20 text-center space-y-6">
          <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Ops! Algo deu errado</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {authError}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()} 
            className="w-full gap-2 rounded-xl"
          >
            <RefreshCw className="h-4 w-4" /> Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se não tem ID vinculado e não é admin, obriga a completar o perfil
  const isChiefAdmin = user.email === 'xakatosh66@gmail.com';
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;

  if (hasNoId && location.pathname !== '/complete-profile' && !isAdmin && !isChiefAdmin) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;