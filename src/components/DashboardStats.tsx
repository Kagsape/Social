"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Monitor, CalendarCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface DashboardStatsProps {
  stats: {
    totalStudents?: number;
    totalCourses?: number;
    totalComputers?: number;
    activeReservations?: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const { userProfile } = useAuth();
  const isStudent = userProfile?.role === 'student';
  const isTeacher = userProfile?.role === 'teacher';

  const cards = [
    {
      title: "Meus Cursos",
      value: stats.totalCourses || 0,
      icon: BookOpen,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20"
    },
    ...(isStudent || isTeacher ? [{
      title: "Computadores Disponíveis",
      value: stats.totalComputers || 0,
      icon: Monitor,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20"
    }] : []),
    ...(isTeacher ? [{
      title: "Total de Alunos",
      value: stats.totalStudents || 0,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20"
    }] : []),
    {
      title: "Reservas Ativas",
      value: stats.activeReservations || 0,
      icon: CalendarCheck,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card key={index} className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStats;