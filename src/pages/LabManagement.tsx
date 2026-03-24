"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Monitor, Wrench, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newComputer, setNewComputer] = useState({
    name: '',
    status: 'working',
    location: '',
    specs: {}
  });

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

  const addComputer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('lab_computers')
        .insert({
          ...newComputer,
          specs: newComputer.specs || { os: 'Windows', ram: '8GB', cpu: 'Intel i5' }
        });

      if (error) throw error;

      showSuccess('Computador adicionado com sucesso!');
      setNewComputer({ name: '', status: 'working', location: '', specs: {} });
      setIsAddDialogOpen(false);
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
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', computerId);

      if (error) throw error;
      fetchComputers();
    } catch (error) {
      console.error('Error updating computer:', error);
    }
  };

  const deleteComputer = async (computerId: string) => {
    if (!confirm('Tem certeza que deseja remover este computador?')) return;

    try {
      const { error } = await supabase
        .from('lab_computers')
        .delete()
        .eq('id', computerId);

      if (error) throw error;
      showSuccess('Computador removido com sucesso!');
      fetchComputers();
    } catch (error) {
      console.error('Error deleting computer:', error);
      showError('Erro ao remover computador');
    }
  };

  const workingCount = computers.filter(c => c.status === 'working').length;
  const brokenCount = computers.filter(c => c.status === 'broken').length;
  const maintenanceCount = computers.filter(c => c.status === 'maintenance').length;

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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Gestão do Laboratório</h1>
            <p className="text-muted-foreground">Administre os computadores e reservas.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar Computador
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={addComputer}>
                <DialogHeader>
                  <DialogTitle>Novo Computador</DialogTitle>
                  <DialogDescription>
                    Adicione um novo computador ao laboratório.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newComputer.name}
                      onChange={(e) => setNewComputer({...newComputer, name: e.target.value})}
                      placeholder="Ex: PC-01"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Localização (opcional)</Label>
                    <Input
                      id="location"
                      value={newComputer.location}
                      onChange={(e) => setNewComputer({...newComputer, location: e.target.value})}
                      placeholder="Ex: Sala 101"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      value={newComputer.status}
                      onChange={(e) => setNewComputer({...newComputer, status: e.target.value})}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="working">Funcionando</option>
                      <option value="maintenance">Manutenção</option>
                      <option value="broken">Quebrado</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!newComputer.name.trim()}>
                    Adicionar
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600">Disponíveis</CardTitle>
              <div className="text-2xl font-bold">{workingCount}</div>
            </CardHeader>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-600">Manutenção</CardTitle>
              <div className="text-2xl font-bold">{maintenanceCount}</div>
            </CardHeader>
          </Card>
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Quebrados</CardTitle>
              <div className="text-2xl font-bold">{brokenCount}</div>
            </CardHeader>
          </Card>
        </div>

        {/* Computers Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {computers.map(computer => (
              <LabComputerCard
                key={computer.id}
                computer={computer}
                onMaintain={(id) => updateComputerStatus(id, 'maintenance')}
                showActions
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LabManagement;