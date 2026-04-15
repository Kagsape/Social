"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Package, Loader2, Filter } from 'lucide-react';
import InventoryItemCard from '@/components/InventoryItemCard';
import InventoryForm from '@/components/InventoryForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { showSuccess, showError } from '@/utils/toast';

const Inventory = () => {
  const { isAdmin, isTeacher } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const fetchItems = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item permanentemente?')) return;
    try {
      const { error } = await supabase.from('inventory_items').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Item removido do inventário.');
      fetchItems();
    } catch (error) {
      showError('Erro ao remover item.');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventário do Laboratório</h1>
            <p className="text-muted-foreground">Controle de equipamentos e materiais da Sala de Informática.</p>
          </div>
          {isAdmin && (
            <Button className="gap-2 rounded-full px-6" onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Adicionar Item
            </Button>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou categoria..." 
              className="pl-10 rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Filter className="h-4 w-4" /> Filtros
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl space-y-4">
            <Package className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
            <p className="text-muted-foreground">Nenhum item encontrado no inventário.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <InventoryItemCard 
                key={item.id} 
                item={item} 
                onEdit={handleEdit}
                onDelete={handleDelete}
                canEdit={isAdmin || isTeacher}
                canDelete={isAdmin}
              />
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Equipamento'}</DialogTitle>
              <DialogDescription>
                Preencha as informações abaixo para {editingItem ? 'atualizar' : 'cadastrar'} o item no sistema.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm 
              item={editingItem} 
              onSuccess={() => { setIsDialogOpen(false); fetchItems(); }} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inventory;