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
    return null; 
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // E-mail do Administrador Mestre
  const isChiefAdmin = user.email === 'xakatosh66@gmail.com';

  // Verificação de perfil incompleto
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