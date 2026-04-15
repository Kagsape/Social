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

  // Se o AuthProvider ainda estiver carregando a sessão/perfil, não renderiza nada
  // (O AuthProvider já mostra a tela de loading, isso é uma camada extra de segurança)
  if (loading) {
    return null; 
  }

  // Se não houver usuário logado, redireciona para o login salvando a rota de origem
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificação de perfil incompleto (usuários que logaram mas não validaram matrícula)
  const isCompletingProfile = location.pathname === '/complete-profile';
  const hasNoId = userProfile && !userProfile.student_id && !userProfile.teacher_id;

  if (hasNoId && !isCompletingProfile && !isAdmin) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Verificação de permissão por cargo (Admin tem acesso livre)
  if (allowedRoles.length > 0 && !isAdmin) {
    const hasRequiredRole = roles.some(role => allowedRoles.includes(role));
    if (!hasRequiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;