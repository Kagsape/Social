import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Feed from "./pages/Feed";
import CoursesPage from "./pages/CoursesPage";
import CourseDetails from "./pages/CourseDetails";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import LabManagement from "./pages/LabManagement";
import AdminCoursesPage from "./pages/AdminCoursesPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminRolesPage from "./pages/AdminRolesPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import ReservationsPage from "./pages/ReservationsPage";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Common Protected Routes */}
            <Route path="/feed" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <Feed />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/profile/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/courses" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <CoursesPage />
              </ProtectedRoute>
            } />
            <Route path="/courses/:id" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <CourseDetails />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/courses" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminCoursesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/lab" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <LabManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/reservations" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher']}>
                <ReservationsPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsersPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/roles" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminRolesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettingsPage />
              </ProtectedRoute>
            } />

            {/* Role Specific Dashboards */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="/teacher" element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;