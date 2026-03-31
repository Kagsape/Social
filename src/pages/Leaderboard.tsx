"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Star, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Leaderboard = () => {
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Buscamos usuários ordenados por pontos (assumindo que a coluna existe)
        // Se não existir, ordenamos por nome apenas para mostrar dados reais
        const { data, error } = await supabase
          .from('users')
          .select('id, name, avatar_url, points, role')
          .eq('role', 'student')
          .order('points', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        setTopStudents(data || []);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-slate-400" />;
      case 3: return <Medal className="h-6 w-6 text-amber-600" />;
      default: return <span className="font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-black tracking-tight">Ranking da Comunidade</h1>
          <p className="text-muted-foreground text-lg">Os alunos mais engajados na Sala de Informática.</p>
        </div>

        {topStudents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topStudents.slice(0, 3).map((student, index) => (
              <Card key={student.id} className={`border-none shadow-lg relative overflow-hidden ${index === 0 ? 'scale-105 ring-2 ring-primary' : ''}`}>
                {index === 0 && <div className="absolute top-0 right-0 p-2 bg-primary text-white rounded-bl-lg"><Star className="h-4 w-4 fill-current" /></div>}
                <CardContent className="pt-8 flex flex-col items-center text-center space-y-4">
                  <div className="relative">
                    <Avatar className="h-20 w-20 border-4 border-background shadow-xl">
                      <AvatarImage src={student.avatar_url} />
                      <AvatarFallback className="text-2xl bg-primary text-primary-foreground">{student.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md">
                      {getRankIcon(index + 1)}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">Aluno Ativo</p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-1">{student.points || 0} pts</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Alunos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {topStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">Nenhum dado de ranking disponível.</div>
            ) : (
              <div className="divide-y">
                {topStudents.map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        {getRankIcon(index + 1)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>{student.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold">{student.name}</p>
                        <p className="text-xs text-muted-foreground">Estudante</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary">{student.points || 0}</p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;