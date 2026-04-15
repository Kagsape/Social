"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, roles, isAdmin, loading, userProfile } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin sempre tem acesso
  if (isAdmin) {
    return <>{children}</>;
  }

  // Validação de matrícula obrigatória (exceto se estiver completando perfil)
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;
  if (hasNoId && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  // Verifica se o usuário possui algum dos cargos permitidos
  if (allowedRoles.length > 0) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;