"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, roles, isAdmin, loading, userProfile } = useAuth();
  const location = useLocation();

  // Se estiver carregando, mostra um spinner local em vez de bloquear o app todo
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse font-medium">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // Se não houver usuário autenticado, redireciona para o login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // E-mail do Administrador Mestre
  const isChiefAdmin = user.email === 'xakatosh66@gmail.com';

  // Verificação de perfil incompleto (usuários que entraram via Google mas não validaram ID)
  const isCompletingProfile = location.pathname === '/complete-profile';
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;

  // Se não tem ID, não é admin mestre e não está na página de completar perfil, redireciona
  if (hasNoId && !isCompletingProfile && !isAdmin && !isChiefAdmin) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Verificação de permissão por cargo (Admin mestre tem acesso livre)
  if (allowedRoles.length > 0 && !isAdmin && !isChiefAdmin) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;