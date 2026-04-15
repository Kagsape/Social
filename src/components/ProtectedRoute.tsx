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

  // O AuthProvider já lida com a tela de loading global, 
  // mas mantemos aqui por segurança caso o componente seja montado isoladamente.
  if (loading) {
    return null; 
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se o usuário logou mas não tem perfil completo (ex: falta matrícula)
  const isCompletingProfile = location.pathname === '/complete-profile';
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;

  if (hasNoId && !isCompletingProfile && !isAdmin) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Verificação de cargos (Admin ignora restrições)
  if (allowedRoles.length > 0 && !isAdmin) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;