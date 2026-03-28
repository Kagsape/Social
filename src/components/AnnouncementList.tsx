"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Megaphone, Trash2, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { showSuccess, showError } from '@/utils/toast';

const AnnouncementList = () => {
  const { user, userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          users:author_id (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Erro ao buscar avisos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    
    const channel = supabase
      .channel('announcements_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        fetchAnnouncements();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('Deseja realmente excluir este aviso?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('Aviso removido.');
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      showError('Erro ao excluir aviso.');
    }
  };

  if (loading && announcements.length === 0) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary/50" />
      </div>
    );
  }

  if (announcements.length === 0) return null;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center gap-2 px-1">
        <Megaphone className="h-5 w-5 text-primary" />
        <h2 className="font-bold text-lg">Avisos Recentes</h2>
      </div>
      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id} className="border-none shadow-sm bg-amber-50/50 dark:bg-amber-900/10 border-l-4 border-l-amber-400">
            <CardContent className="p-4">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm">{announcement.title}</h3>
                    {announcement.is_global && (
                      <Badge variant="outline" className="text-[10px] h-4 bg-amber-100 text-amber-700 border-amber-200">Global</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-3 pt-2 text-[10px] text-muted-foreground">
                    <span className="font-medium">Por: {announcement.users?.name}</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
                {(announcement.author_id === user?.id || userProfile?.role === 'admin') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteAnnouncement(announcement.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementList;