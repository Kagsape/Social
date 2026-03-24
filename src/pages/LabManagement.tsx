"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Monitor, Wrench, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
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

  useEffect(() => {
    fetchComputers();
  }, []);

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
      console.error('Error fetching computers:', error);
    } finally {
      setLoading(false);
    }
  };

  const addComputer = async (formData: any) => {
    try {
      const { error } = await supabase
        .from('lab_computers')
        .insert({
          name: formData.name,
          location: formData.location,
          status: 'working',
          specs: formData.specs || {}
        });

      if (error) throw error;
      showSuccess('Computador adicionado com sucesso!');
      fetchComputers();
    } catch (error) {
      console.error('Error adding computer:', error);
      showError('Erro ao adicionar computador');
    }
  };

  const updateComputerStatus = async (computerId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('lab_computers')
        .update({ status })
        .eq('id', computerId);

      if (error) throw error;
      showSuccess('Status atualizado com sucesso!');
      fetchComputers();
    } catch (error) {
      console.error('Error updating status:', error);
      showError('Erro ao atualizar status');
    }
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão do Laboratório</h1>
            <p className="text-muted-foreground">Administre os computadores da sala de informática.</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Computador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Computador</DialogTitle>
                <DialogDescription>
                  Preencha as informações do novo computador.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                addComputer({
                  name: formData.get('name'),
                  location: formData.get('location'),
                  specs: formData.get('specs')
                });
              }}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome do Computador</Label>
                    <Input id="name" name="name" placeholder="Ex: Computador 01" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização</Label>
                    <Input id="location" name="location" placeholder="Ex: Sala Principal" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="specs">Especificações (JSON)</Label>
                    <Input id="specs" name="specs" placeholder='{"cpu": "Intel i5", "ram": "8GB"}' />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Adicionar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {computers.map(computer => (
            <LabComputerCard
              key={computer.id}
              computer={computer}
              onReserve={() => {}}
              onMaintain={(id) => updateComputerStatus(id, 'maintenance')}
              showActions={userProfile?.role === 'admin'}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default LabManagement;