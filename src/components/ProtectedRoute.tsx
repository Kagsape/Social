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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isChiefAdmin = user.email === 'xakatosh66@gmail.com';
  const isCompletingProfile = location.pathname === '/complete-profile';
  
  // Verifica se o usuário tem matrícula vinculada
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;

  // Se não tem ID e não é admin mestre, obriga a completar o perfil
  if (hasNoId && !isCompletingProfile && !isAdmin && !isChiefAdmin) {
    return <Navigate to="/complete-profile" replace />;
  }

  if (allowedRoles.length > 0 && !isAdmin && !isChiefAdmin) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;