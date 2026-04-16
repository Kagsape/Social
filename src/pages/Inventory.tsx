"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Package, 
  Loader2, 
  Filter, 
  Monitor, 
  Laptop,
  Trash2
} from 'lucide-react';
import InventoryItemCard from '@/components/InventoryItemCard';
import InventoryForm from '@/components/InventoryForm';
import LabComputerCard from '@/components/LabComputerCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';

const Inventory = () => {
  const { isAdmin, isTeacher, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('computers');
  
  // State para Equipamentos
  const [items, setItems] = useState<any[]>([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemSearch, setItemSearch] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // State para Computadores
  const [computers, setComputers] = useState<any[]>([]);
  const [compLoading, setCompLoading] = useState(true);
  const [compSearch, setCompSearch] = useState('');
  const [isCompDialogOpen, setIsCompDialogOpen] = useState(false);
  const [isAddingComp, setIsAddingComp] = useState(false);

  const fetchItems = async () => {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar inventário:', error);
    } finally {
      setItemsLoading(false);
    }
  };

  const fetchComputers = async () => {
    setCompLoading(true);
    try {
      const { data, error } = await supabase
        .from('lab_computers')
        .select('*')
        .order('name');
      if (error) throw error;
      setComputers(data || []);
    } catch (error) {
      console.error('Erro ao buscar computadores:', error);
    } finally {
      setCompLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchComputers();
  }, []);

  // Handlers para Equipamentos
  const handleDeleteItem = async (id: string) => {
    if (!confirm('Excluir este item permanentemente?')) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Item removido.');
      fetchItems();
    } catch (error) {
      showError('Erro ao remover item.');
    }
  };

  // Handlers para Computadores
  const handleAddComputer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAddingComp(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const { error } = await supabase.from('lab_computers').insert({
        name: formData.get('name') as string,
        location: formData.get('location') as string,
        status: 'working',
        specs: { info: formData.get('specs') as string }
      });

      if (error) throw error;
      showSuccess('Computador cadastrado!');
      setIsCompDialogOpen(false);
      fetchComputers();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setIsAddingComp(false);
    }
  };

  const updateCompStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase.from('lab_computers').update({ status }).eq('id', id);
      if (error) throw error;
      showSuccess('Status atualizado!');
      fetchComputers();
    } catch (error) {
      showError('Erro ao atualizar.');
    }
  };

  const deleteComputer = async (id: string) => {
    if (!confirm('Excluir este computador?')) return;
    try {
      const { error } = await supabase.from('lab_computers').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Removido!');
      fetchComputers();
    } catch (error) {
      showError('Erro ao remover.');
    }
  };

  const filteredItems = items.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredComps = computers.filter(c => c.name.toLowerCase().includes(compSearch.toLowerCase()));

  const canManage = isAdmin || isTeacher;

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recursos do Laboratório</h1>
            <p className="text-muted-foreground">Gestão centralizada de computadores e equipamentos.</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="computers" className="gap-2 rounded-lg">
              <Monitor className="h-4 w-4" /> Computadores
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-2 rounded-lg">
              <Package className="h-4 w-4" /> Equipamentos
            </TabsTrigger>
          </TabsList>

          {/* Aba de Computadores */}
          <TabsContent value="computers" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar computador..." 
                  className="pl-10 rounded-xl"
                  value={compSearch}
                  onChange={(e) => setCompSearch(e.target.value)}
                />
              </div>
              {canManage && (
                <Button className="gap-2 rounded-xl" onClick={() => setIsCompDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Novo Computador
                </Button>
              )}
            </div>

            {compLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : filteredComps.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                <Monitor className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p className="text-muted-foreground">Nenhum computador encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComps.map(comp => (
                  <div key={comp.id} className="relative group">
                    <LabComputerCard 
                      computer={comp} 
                      onMaintain={(id) => updateCompStatus(id, 'maintenance')}
                      showActions={canManage}
                    />
                    {isAdmin && (
                      <Button 
                        variant="destructive" size="icon" 
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        onClick={() => deleteComputer(comp.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba de Equipamentos */}
          <TabsContent value="items" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar equipamento..." 
                  className="pl-10 rounded-xl"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>
              {canManage && (
                <Button className="gap-2 rounded-xl" onClick={() => { setEditingItem(null); setIsItemDialogOpen(true); }}>
                  <Plus className="h-4 w-4" /> Novo Item
                </Button>
              )}
            </div>

            {itemsLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-3xl">
                <Package className="h-12 w-12 mx-auto opacity-20 mb-4" />
                <p className="text-muted-foreground">Nenhum equipamento encontrado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map(item => (
                  <InventoryItemCard 
                    key={item.id} 
                    item={item} 
                    onEdit={(i) => { setEditingItem(i); setIsItemDialogOpen(true); }}
                    onDelete={handleDeleteItem}
                    canEdit={canManage}
                    canDelete={isAdmin}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Equipamento'}</DialogTitle>
            </DialogHeader>
            <InventoryForm item={editingItem} onSuccess={() => { setIsItemDialogOpen(false); fetchItems(); }} />
          </DialogContent>
        </Dialog>

        <Dialog open={isCompDialogOpen} onOpenChange={setIsCompDialogOpen}>
          <DialogContent>
            <form onSubmit={handleAddComputer}>
              <DialogHeader>
                <DialogTitle>Novo Computador</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Identificação</Label>
                  <Input id="name" name="name" placeholder="Ex: PC-01" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input id="location" name="location" placeholder="Ex: Fila A" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specs">Especificações</Label>
                  <Input id="specs" name="specs" placeholder="Ex: i5, 8GB RAM" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isAddingComp}>
                  {isAddingComp ? 'Salvando...' : 'Cadastrar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inventory;