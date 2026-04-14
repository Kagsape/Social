"use client";

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = [] }) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  const CHIEF_ADMIN_EMAIL = 'xakatosh66@gmail.com';

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

  // Bypass total para o Admin Chefe
  if (user.email === CHIEF_ADMIN_EMAIL) {
    return <>{children}</>;
  }

  // Se o usuário está logado mas NÃO tem matrícula, e NÃO está na página de completar perfil, redireciona
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;
  if (hasNoId && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (allowedRoles.length > 0 && userProfile && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;