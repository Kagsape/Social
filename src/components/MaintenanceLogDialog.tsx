"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Wrench, History, Loader2, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MaintenanceLogDialogProps {
  computerId: string;
  computerName: string;
}

const MaintenanceLogDialog: React.FC<MaintenanceLogDialogProps> = ({ computerId, computerName }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [newLog, setNewLog] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('computer_maintenance_logs')
        .select(`
          *,
          users (name)
        `)
        .eq('computer_id', computerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLog = async () => {
    if (!newLog.trim()) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('computer_maintenance_logs')
        .insert({
          computer_id: computerId,
          user_id: user?.id,
          description: newLog.trim()
        });

      if (error) throw error;
      showSuccess('Manutenção registrada!');
      setNewLog('');
      fetchLogs();
    } catch (error) {
      showError('Erro ao salvar registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog onOpenChange={(open) => open && fetchLogs()}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <History className="h-4 w-4" /> Histórico
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Manutenção: {computerName}
          </DialogTitle>
          <DialogDescription>
            Registre reparos, trocas de peças ou limpezas realizadas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Textarea 
              placeholder="Descreva o que foi feito..." 
              value={newLog}
              onChange={(e) => setNewLog(e.target.value)}
              rows={3}
            />
            <Button 
              onClick={handleAddLog} 
              disabled={submitting || !newLog.trim()} 
              className="w-full"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar Registro
            </Button>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <History className="h-4 w-4" /> Registros Anteriores
            </h4>
            <ScrollArea className="h-[250px] rounded-md border p-4">
              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin h-6 w-6" /></div>
              ) : logs.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">Nenhum registro encontrado.</p>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div key={log.id} className="border-b last:border-0 pb-3 space-y-1">
                      <p className="text-sm leading-relaxed">{log.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" /> {log.users?.name}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Plus } from 'lucide-react';
export default MaintenanceLogDialog;