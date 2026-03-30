"use client";

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ArrowRight } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";

const Events = () => {
  const events = [
    {
      title: "Workshop de Robótica",
      date: "15 de Outubro",
      time: "14:00 - 16:00",
      location: "Sala de Informática",
      category: "Workshop",
      description: "Aprenda a montar e programar seu primeiro robô usando Arduino."
    },
    {
      title: "Maratona de Programação",
      date: "22 de Outubro",
      time: "09:00 - 17:00",
      location: "Laboratório 01",
      category: "Competição",
      description: "Desafios de lógica e código para testar suas habilidades."
    },
    {
      title: "Palestra: Futuro da IA",
      date: "28 de Outubro",
      time: "10:30 - 12:00",
      location: "Auditório",
      category: "Palestra",
      description: "Como a Inteligência Artificial está mudando o mercado de trabalho."
    }
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Eventos e Atividades</h1>
          <p className="text-muted-foreground">Fique por dentro de tudo o que acontece na nossa comunidade.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {events.map((event, i) => (
              <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row">
                <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center min-w-[150px] border-r">
                  <span className="text-3xl font-black text-primary">{event.date.split(' ')[0]}</span>
                  <span className="text-xs uppercase font-bold text-muted-foreground">{event.date.split(' ').slice(1).join(' ')}</span>
                </div>
                <CardContent className="p-6 flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{event.category}</Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {event.time}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {event.location}
                    </div>
                    <Button size="sm" className="gap-2">
                      Participar <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Calendário
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex justify-center">
                <Calendar
                  mode="single"
                  className="rounded-md border-none"
                />
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground border-none shadow-lg">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-lg">Sugira um Evento</h3>
                <p className="text-sm opacity-90">Tem uma ideia legal para um workshop ou palestra? Conta pra gente!</p>
                <Button variant="secondary" className="w-full">Enviar Sugestão</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;