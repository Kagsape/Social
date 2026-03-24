... the entire file with the corrected import ...
＜/dyad-write>

But I must ensure that the file content is exactly as before except for the import line.

Looking at the code I provided for `ReservationsPage.tsx`, the import line is:

```tsx
import { useAuth } from './AuthProvider';
```

I need to change it to:

```tsx
import { useAuth } from '@/components/AuthProvider';
```

And the rest of the file remains the same.

But wait, in the same file, I also import `Layout` from `@/components/Layout`. So using `@/components/AuthProvider` is consistent.

So I'll do that.

But also, note that the file might have been modified by the user. But since I'm the one who created it, I'll assume it's as I provided.

Let me write the corrected file.

However, the user might have other pages with the same issue. But I'll only fix this one as per the request.

But the instruction says: "Only edit files that are related to the user's request". The user's request is to fix the error in `ReservationsPage.tsx`. So I'll only edit that file.

But the error might be because the `AuthProvider` is not exported correctly? But I exported it as `useAuth`. So that should be fine.

So I'll change the import and leave the rest.

But wait, the user's codebase might have a different structure. But from the provided files, we see that `AuthProvider.tsx` is in `src/components/`. So the import should be from `@/components/AuthProvider`.

Let me write the corrected file.

But note: the user might be using a different alias. But in the `vite.config.ts` we have:

```ts
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},
```

So `@` points to `src`. Therefore, `@/components/AuthProvider` is correct.

So I'll change the import.

Now, I'll write the entire `ReservationsPage.tsx` file with the corrected import.

But to be precise, I'll only change the import line and keep the rest exactly as in the code I provided earlier.

However, the user might have a different version of the file. But since I'm the one who created it, I'll assume it's the same.

Let me output the corrected file.

But wait, the user's error message shows the file path as `src/pages/ReservationsPage.tsx` and the import is `./AuthProvider`. So I'll change that to `@/components/AuthProvider`.

I'll now write the corrected file.</think><dyad-write path="src/pages/ReservationsPage.tsx" description="Fixing import path for AuthProvider - should use @/components instead of relative path">
"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Monitor, Clock, User, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ReservationsPage = () => {
  const { user, userProfile } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          courses (name),
          users!lab_usage_teacher_id_fkey (name)
        `)
        .order('start_time', { ascending: false });

      // Filter based on user role
      if (userProfile?.role === 'teacher') {
        query = query.eq('teacher_id', user?.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('lab_usage')
        .update({ status: 'cancelled' })
        .eq('id', reservationId);

      if (error) throw error;
      showSuccess('Reserva cancelada com sucesso!');
      fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      showError('Erro ao cancelar reserva');
    }
  };

  const completeReservation = async (reservationId: string) => {
    try {
      const { error } = await supabase
        .from('lab_usage')
        .update({ status: 'completed' })
        .eq('id', reservationId);

      if (error) throw error;
      showSuccess('Reserva marcada como concluída!');
      fetchReservations();
    } catch (error) {
      console.error('Error completing reservation:', error);
      showError('Erro ao concluir reserva');
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Reservas do Laboratório</h1>
          <p className="text-muted-foreground">Visualize e gerencie todas as reservas.</p>
        </div>

        {reservations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              Nenhuma reserva encontrada.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reservations.map(reservation => {
              const start = formatDateTime(reservation.start_time);
              const end = formatDateTime(reservation.end_time);
              
              return (
                <Card key={reservation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Monitor className="h-5 w-5" />
                          {reservation.lab_computers?.name}
                          {reservation.lab_computers?.location && (
                            <span className="text-sm font-normal text-muted-foreground">
                              ({reservation.lab_computers.location})
                            </span>
                          )}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{start.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{start.time} - {end.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <span>{reservation.users?.name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(reservation.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reservation.courses?.name && (
                      <p className="text-sm mb-2">
                        <strong>Curso:</strong> {reservation.courses.name}
                      </p>
                    )}
                    {reservation.purpose && (
                      <p className="text-sm text-muted-foreground mb-4">
                        <strong>Propósito:</strong> {reservation.purpose}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {reservation.status === 'scheduled' && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => completeReservation(reservation.id)}
                            className="gap-2"
                          >
                            <CheckCircle className="h-4 w-4" /> Concluir
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2">
                                <XCircle className="h-4 w-4" /> Cancelar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancelar reserva?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Não</AlertDialogCancel>
                                <AlertDialogAction onClick={() => cancelReservation(reservation.id)}>
                                  Sim, cancelar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ReservationsPage;