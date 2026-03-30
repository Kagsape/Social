"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Monitor, Wrench, CheckCircle, XCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import LabComputerCard from '@/components/LabComputerCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const LabManagement = () => {
  const { userProfile } = useAuth();
  const [computers, setComputers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchComputers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_computers')
        .select('*')
        .order('name');

      if (error) throw error;
      setComputers(data || []);
    } catch (error) {
      console.error('[Lab] Erro ao buscar computadores:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComputers();
  }, []);

  const handleAddComputer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const specsRaw = formData.get('specs') as string;

    try {
      let specs = {};
      try {
        if (specsRaw) specs = JSON.parse(specsRaw);
      } catch (e) {
        console.warn('Specs não é um JSON válido, salvando como string');
        specs = { info: specsRaw };
      }

      const { error } = await supabase
        .from('lab_computers')
        .insert({
          name,
          location,
          status: 'working',
          specs
        });

      if (error) throw error;

      showSuccess('Computador adicionado com sucesso!');
      setIsDialogOpen(false);
      fetchComputers();
    } catch (error: any) {
      console.error('[Lab] Erro ao adicionar:', error);
      showError(error.message || 'Erro ao adicionar computador');
    } finally {
      setIsAdding(false);
    }
  };

  const updateComputerStatus = async (computerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lab_computers')
        .update({ status })
        .eq('id', computerId);

      if (error) throw error;
      showSuccess('Status atualizado!');
      fetchComputers();
    } catch (error) {
      showError('Erro ao atualizar status');
    }
  };

  const deleteComputer = async (id: string) => {
    if (!confirm('Excluir este computador permanentemente?')) return;
    try {
      const { error } = await supabase.from('lab_computers').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Removido!');
      fetchComputers();
    } catch (error) {
      showError('Erro ao remover');
    }
  };

  if (loading && computers.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão do Laboratório</h1>
            <p className="text-muted-foreground">Administre os computadores da sala de informática.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Computador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddComputer}>
                <DialogHeader>
                  <DialogTitle>Novo Computador</DialogTitle>
                  <DialogDescription>Cadastre uma nova máquina no sistema.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Identificação (Nome/Número)</Label>
                    <Input id="name" name="name" placeholder="Ex: PC-01" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização na Sala</Label>
                    <Input id="location" name="location" placeholder="Ex: Fila A, Mesa 02" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specs">Especificações (Opcional)</Label>
                    <Input id="specs" name="specs" placeholder='{"ram": "8GB", "cpu": "i5"}' />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isAdding}>
                    {isAdding ? 'Salvando...' : 'Cadastrar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {computers.length === 0 ? (
          <Card className="border-dashed py-12 text-center">
            <CardContent className="text-muted-foreground">
              Nenhum computador cadastrado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {computers.map(computer => (
              <div key={computer.id} className="relative group">
                <LabComputerCard
                  computer={computer}
                  onMaintain={(id) => updateComputerStatus(id, 'maintenance')}
                  showActions={userProfile?.role === 'admin'}
                />
                {userProfile?.role === 'admin' && (
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => deleteComputer(computer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LabManagement;