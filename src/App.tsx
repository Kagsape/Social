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
import AdminLogsPage from "./pages/AdminLogsPage";
import ReservationsPage from "./pages/ReservationsPage";
import Messages from "./pages/Messages";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Resources from "./pages/Resources";
import Leaderboard from "./pages/Leaderboard";
import Projects from "./pages/Projects";
import Events from "./pages/Events";
import Help from "./pages/Help";
import Search from "./pages/Search";

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
            <Route path="/search" element={<Search />} />
            
            {/* Public/Common Routes */}
            <Route path="/resources" element={<Resources />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/events" element={<Events />} />
            <Route path="/help" element={<Help />} />
            
            {/* Common Protected Routes */}
            <Route path="/feed" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <Feed />
              </ProtectedRoute>
            } />
            <Route path="/messages" element={
              <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                <Messages />
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
            <Route path="/admin/logs" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminLogsPage />
              </ProtectedRoute>
            } />

            {/* Role Specific Dashboards */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
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