import React from 'react';
import Layout from '@/components/Layout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award, Star } from 'lucide-react';

const leaderboardData = [
  { id: 1, name: "Ana Silva", points: 2500, level: 15, courses: 8, avatar: "https://i.pravatar.cc/150?u=ana" },
  { id: 2, name: "João Pereira", points: 2350, level: 14, courses: 7, avatar: "https://i.pravatar.cc/150?u=joao" },
  { id: 3, name: "Maria Santos", points: 2100, level: 13, courses: 6, avatar: "https://i.pravatar.cc/150?u=maria" },
  { id: 4, name: "Pedro Oliveira", points: 1950, level: 12, courses: 5, avatar: "https://i.pravatar.cc/150?u=pedro" },
  { id: 5, name: "Carla Lima", points: 1800, level: 11, courses: 5, avatar: "https://i.pravatar.cc/150?u=carla" },
  { id: 6, name: "Lucas Souza", points: 1650, level: 10, courses: 4, avatar: "https://i.pravatar.cc/150?u=lucas" },
  { id: 7, name: "Beatriz Costa", points: 1500, level: 9, courses: 4, avatar: "https://i.pravatar.cc/150?u=beatriz" },
  { id: 8, name: "Marcos Rocha", points: 1350, level: 8, courses: 3, avatar: "https://i.pravatar.cc/150?u=marcos" },
];

const Leaderboard = () => {
  const topThree = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1: return <Medal className="h-6 w-6 text-slate-400" />;
      case 2: return <Award className="h-6 w-6 text-amber-600" />;
      default: return null;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Ranking de Alunos</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Destaque para os alunos mais ativos e engajados na nossa plataforma. 
            Ganhe pontos completando cursos, participando de eventos e ajudando a comunidade!
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {topThree.map((student, index) => (
            <Card key={student.id} className={`relative overflow-hidden border-2 ${index === 0 ? 'border-yellow-500 scale-105 shadow-xl' : 'border-muted'}`}>
              {index === 0 && (
                <div className="absolute top-0 right-0 bg-yellow-500 text-white px-3 py-1 rounded-bl-lg font-bold text-sm">
                  #1 LUGAR
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-background rounded-full p-1 shadow-md">
                    {getRankIcon(index)}
                  </div>
                </div>
                <CardTitle>{student.name}</CardTitle>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="secondary">Nível {student.level}</Badge>
                  <Badge variant="outline">{student.courses} Cursos</Badge>
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                  <Star className="h-6 w-6 fill-primary" />
                  {student.points.toLocaleString()} pts
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Full Leaderboard Table */}
        <Card>
          <CardHeader>
            <CardTitle>Classificação Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Posição</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Nível</TableHead>
                  <TableHead>Cursos</TableHead>
                  <TableHead className="text-right">Pontuação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboardData.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-bold">
                      {index + 1}º
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>{student.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Lvl {student.level}</Badge>
                    </TableCell>
                    <TableCell>{student.courses}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {student.points.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Leaderboard;
