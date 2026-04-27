"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, MapPin, Users, ArrowRight, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import EventForm from '@/components/EventForm';

const Events = () => {
  const { user, userProfile, isAdmin, isTeacher } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [participatingIds, setParticipatingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants (user_id)
        `)
        .order('date', { ascending: true });
      
      if (error) throw error;
      setEvents(data || []);

      if (user) {
        const { data: myParticipations } = await supabase
          .from('event_participants')
          .select('event_id')
          .eq('user_id', user.id);
        
        setParticipatingIds(myParticipations?.map(p => p.event_id) || []);
      }
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleParticipate = async (eventId: string) => {
    if (!user) {
      showError('Você precisa estar logado para participar.');
      return;
    }

    setActionLoading(eventId);
    const isParticipating = participatingIds.includes(eventId);

    try {
      if (isParticipating) {
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('user_id', user.id);
        
        setParticipatingIds(prev => prev.filter(id => id !== eventId));
        showSuccess('Sua participação foi removida.');
      } else {
        await supabase
          .from('event_participants')
          .insert({ event_id: eventId, user_id: user.id });
        
        setParticipatingIds(prev => [...prev, eventId]);
        showSuccess('Presença confirmada no evento!');
      }
      fetchEvents();
    } catch (error) {
      showError('Erro ao processar participação.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Excluir este evento permanentemente?')) return;

    try {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Evento removido.');
      fetchEvents();
    } catch (error) {
      showError('Erro ao excluir evento.');
    }
  };

  const canManage = isAdmin || isTeacher;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Eventos e Atividades</h1>
            <p className="text-muted-foreground">Fique por dentro de tudo o que acontece na nossa comunidade.</p>
          </div>
          {canManage && <EventForm onEventCreated={fetchEvents} />}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-2xl">
                Nenhum evento programado no momento.
              </div>
            ) : (
              events.map((event) => {
                const isParticipating = participatingIds.includes(event.id);
                const participantCount = event.event_participants?.length || 0;

                return (
                  <Card key={event.id} className="border-none shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col md:flex-row relative group">
                    <div className="bg-primary/5 p-6 flex flex-col items-center justify-center text-center min-w-[150px] border-r">
                      <span className="text-3xl font-black text-primary">
                        {format(new Date(event.date), "dd")}
                      </span>
                      <span className="text-xs uppercase font-bold text-muted-foreground">
                        {format(new Date(event.date), "MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <CardContent className="p-6 flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{event.category}</Badge>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Users className="h-3 w-3" /> {participantCount} inscritos
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {event.time}
                          </div>
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
                        <div className="flex gap-2">
                          {canManage && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteEvent(event.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant={isParticipating ? "outline" : "default"}
                            className={cn("gap-2 rounded-xl", isParticipating && "border-green-500 text-green-600 hover:bg-green-50")}
                            onClick={() => handleParticipate(event.id)}
                            disabled={actionLoading === event.id}
                          >
                            {actionLoading === event.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isParticipating ? (
                              <><CheckCircle2 className="h-3 w-3" /> Inscrito</>
                            ) : (
                              <>Participar <ArrowRight className="h-3 w-3" /></>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
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
                <Button variant="secondary" className="w-full rounded-xl">Enviar Sugestão</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;