"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Monitor, User, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

const ReservationsPage = () => {
  const { user, userProfile } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReservations();
  }, [user]);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('lab_usage')
        .select(`
          *,
          lab_computers (name, location),
          users!lab_usage_teacher_id_fkey (name)
        `);

      if (userProfile?.role === 'student') {
        query = query.eq('teacher_id', user?.id);
      } else if (userProfile?.role === 'teacher') {
        query = query.eq('teacher_id', user?.id);
      }

      const { data, error } = await query
        .order('start_time', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('lab_usage')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      
      showSuccess(`Reserva ${status === 'cancelled' ? 'cancelada' : 'atualizada'} com sucesso.`);
      fetchReservations();
    } catch (error) {
      showError('Erro ao atualizar reserva.');
    } finally {
      setActionLoading(null);
    }
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta reserva?')) return;
    
    setActionLoading(id);
    try {
      const { error } = await supabase
        .from('lab_usage')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      showSuccess('Reserva excluída.');
      fetchReservations();
    } catch (error) {
      showError('Erro ao excluir reserva.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline">Agendado</Badge>;
      case 'in_progress':
        return <Badge variant="default">Em Andamento</Badge>;
      case 'completed':
        return <Badge variant="secondary">Concluído</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Reservas do Laboratório</h1>
          <p className="text-muted-foreground">Visualize e gerencie as reservas de computadores.</p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma reserva encontrada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservations.map(reservation => (
              <Card key={reservation.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {reservation.lab_computers?.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {reservation.lab_computers?.location}
                      </p>
                    </div>
                    {getStatusBadge(reservation.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(reservation.start_time), "PPP", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(reservation.start_time), "HH:mm", { locale: ptBR })} - {' '}
                        {format(new Date(reservation.end_time), "HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{reservation.users?.name || 'N/A'}</span>
                    </div>
                  </div>

                  {reservation.purpose && (
                    <p className="text-sm text-muted-foreground border-t pt-3">
                      {reservation.purpose}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2 border-t">
                    {reservation.status === 'scheduled' && (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => updateStatus(reservation.id, 'in_progress')}
                          disabled={actionLoading === reservation.id}
                        >
                          Iniciar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          disabled={actionLoading === reservation.id}
                        >
                          Cancelar
                        </Button>
                      </>
                    )}
                    {reservation.status === 'in_progress' && (
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => updateStatus(reservation.id, 'completed')}
                        disabled={actionLoading === reservation.id}
                      >
                        Finalizar
                      </Button>
                    )}
                    {(userProfile?.role === 'admin' || reservation.status === 'cancelled' || reservation.status === 'completed') && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="w-full text-destructive"
                        onClick={() => deleteReservation(reservation.id)}
                        disabled={actionLoading === reservation.id}
                      >
                        Excluir Registro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReservationsPage;