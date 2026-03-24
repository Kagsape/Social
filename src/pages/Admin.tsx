"use client";

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

const Admin = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  useEffect(() => {
    // Redirect to appropriate admin page based on role
    if (userProfile?.role === 'admin') {
      navigate('/admin');
    } else if (userProfile?.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/');
    }
  }, [userProfile, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Admin;