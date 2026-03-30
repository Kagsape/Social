import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, MapPin, Clock, Users, Bell } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const events = [
  {
    id: 1,
    title: "Workshop de Robótica",
    description: "Aprenda a montar seu primeiro robô com Arduino e sensores básicos.",
    date: new Date(2024, 5, 15),
    time: "14:00 - 17:00",
    location: "Laboratório 1",
    category: "Workshop",
    attendees: 25
  },
  {
    id: 2,
    title: "Hackathon CIEP 165",
    description: "Maratona de programação para resolver problemas da nossa escola.",
    date: new Date(2024, 5, 22),
    time: "08:00 - 18:00",
    location: "Auditório Principal",
    category: "Competição",
    attendees: 50
  },
  {
    id: 3,
    title: "Palestra: Futuro da IA",
    description: "Como a Inteligência Artificial está mudando o mercado de trabalho.",
    date: new Date(2024, 6, 5),
    time: "10:00 - 11:30",
    location: "Sala de Vídeo",
    category: "Palestra",
    attendees: 40
  },
  {
    id: 4,
    title: "Feira de Tecnologia",
    description: "Exposição dos projetos desenvolvidos pelos alunos durante o semestre.",
    date: new Date(2024, 6, 12),
    time: "09:00 - 16:00",
    location: "Pátio Central",
    category: "Exposição",
    attendees: 100
  }
];

const Events = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  const handleNotify = (title: string) => {
    toast({
      title: "Lembrete ativado!",
      description: `Você será notificado sobre o evento: ${title}`,
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Calendário de Eventos</h1>
          <p className="text-muted-foreground">
            Fique por dentro de todas as atividades, workshops e competições do CIEP 165.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <Card className="p-4 shadow-lg border-muted/60">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border-none"
              />
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Legenda</h3>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                  <span>Workshop</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span>Competição</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-3 w-3 rounded-full bg-purple-500"></div>
                  <span>Palestra</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Events List Section */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Próximos Eventos
            </h2>
            
            {events.map((event) => (
              <Card key={event.id} className="overflow-hidden hover:border-primary/50 transition-colors group">
                <div className="flex flex-col md:flex-row">
                  <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center min-w-[120px] border-r border-muted/40">
                    <span className="text-sm font-medium text-primary uppercase">
                      {event.date.toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-3xl font-bold text-primary">
                      {event.date.getDate()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {event.date.getFullYear()}
                    </span>
                  </div>
                  <div className="p-6 flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="bg-background">
                        {event.category}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="rounded-full hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleNotify(event.title)}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </div>
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="mb-4">
                      {event.description}
                    </CardDescription>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {event.time}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {event.location}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.attendees} inscritos
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;
