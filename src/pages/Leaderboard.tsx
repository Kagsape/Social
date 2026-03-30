"use client";

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, TrendingUp } from 'lucide-react';

const Leaderboard = () => {
  const topStudents = [
    { name: "Ana Silva", points: 1250, courses: 5, rank: 1, avatar: "" },
    { name: "João Pereira", points: 1100, courses: 4, rank: 2, avatar: "" },
    { name: "Maria Oliveira", points: 950, courses: 4, rank: 3, avatar: "" },
    { name: "Pedro Santos", points: 800, courses: 3, rank: 4, avatar: "" },
    { name: "Lucas Costa", points: 750, courses: 3, rank: 5, avatar: "" },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-slate-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Ranking da Comunidade</h1>
          <p className="text-muted-foreground text-lg">Os alunos mais engajados na Sala de Informática.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {topStudents.slice(0, 3).map((student) => (
            <Card key={student.rank} className={`border-none shadow-lg relative overflow-hidden ${student.rank === 1 ? 'scale-105 ring-2 ring-primary' : ''}`}>
              {student.rank === 1 && <div className="absolute top-0 right-0 p-2 bg-primary text-white rounded-bl-lg"><Star className="h-4 w-4 fill-current" /></div>}
              <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{student.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md">
                    {getRankIcon(student.rank)}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-xl">{student.name}</h3>
                  <p className="text-sm text-muted-foreground">{student.courses} cursos concluídos</p>
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-1">{student.points} pts</Badge>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top 10 Alunos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {topStudents.map((student) => (
                <div key={student.rank} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 text-center">
                      {getRankIcon(student.rank)}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{student.name}</p>
                      <p className="text-xs text-muted-foreground">{student.courses} cursos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary">{student.points}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pontos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;