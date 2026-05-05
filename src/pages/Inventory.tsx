"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Package, 
  Loader2, 
  Monitor, 
  AlertCircle,
  RefreshCw,
  XCircle,
  Filter
} from 'lucide-react';
import InventoryItemCard from '@/components/InventoryItemCard';
import InventoryForm from '@/components/InventoryForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showSuccess, showError } from '@/utils/toast';

const Inventory = () => {
  const { isAdmin } = useAuth();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);

  const fetchAllAssets = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, compsRes] = await Promise.all([
        supabase.from('inventory_items').select('*'),
        supabase.from('lab_computers').select('*')
      ]);

      const combined = [
        ...(itemsRes.data || []).map(i => ({ ...i, assetType: 'item' })),
        ...(compsRes.data || []).map(c => ({ ...c, assetType: 'computer' }))
      ];

      setAssets(combined.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      showError('Erro ao carregar inventário.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllAssets();
  }, [fetchAllAssets]);

  const stats = useMemo(() => {
    const comps = assets.filter(a => a.assetType === 'computer');
    const items = assets.filter(a => a.assetType === 'item');
    
    return {
      totalComps: comps.length,
      workingComps: comps.filter(c => c.status === 'working').length,
      brokenComps: comps.filter(c => c.status === 'broken').length + items.filter(i => i.condition === 'quebrado').length,
      lowStock: items.filter(i => i.available_quantity <= 2 && i.available_quantity > 0).length
    };
  }, [assets]);

  const handleDelete = async (id: string, type: 'computer' | 'item') => {
    if (!confirm('Excluir este registro permanentemente?')) return;
    try {
      const table = type === 'computer' ? 'lab_computers' : 'inventory_items';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      showSuccess('Removido com sucesso.');
      fetchAllAssets();
    } catch (error) {
      showError('Erro ao remover.');
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || asset.assetType === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Ativos</h1>
            <p className="text-muted-foreground">Controle unificado de computadores e equipamentos.</p>
          </div>
          {isAdmin && (
            <Button className="gap-2 rounded-xl" onClick={() => { setEditingAsset(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo Ativo
            </Button>
          )}
        </div>

        {/* Dashboard Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                <Monitor className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Computadores</p>
                <p className="text-xl font-black">{stats.workingComps}<span className="text-xs text-muted-foreground font-normal">/{stats.totalComps}</span></p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Inoperantes</p>
                <p className="text-xl font-black">{stats.brokenComps}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Estoque Baixo</p>
                <p className="text-xl font-black">{stats.lowStock}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Ativos</p>
                <p className="text-xl font-black">{assets.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, categoria ou localização..." 
              className="pl-10 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter} className="w-fit">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">Tudo</TabsTrigger>
              <TabsTrigger value="computer" className="rounded-lg gap-2"><Monitor className="h-3 w-3" /> PCs</TabsTrigger>
              <TabsTrigger value="item" className="rounded-lg gap-2"><Package className="h-3 w-3" /> Itens</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-3xl">
            <Package className="h-12 w-12 mx-auto opacity-20 mb-4" />
            <p className="text-muted-foreground">Nenhum ativo encontrado com os filtros atuais.</p>
            <Button variant="link" onClick={() => { setSearch(''); setFilter('all'); }}>Limpar filtros</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map(asset => (
              <InventoryItemCard 
                key={`${asset.assetType}-${asset.id}`} 
                item={asset} 
                onEdit={(a) => { setEditingAsset(a); setIsDialogOpen(true); }}
                onDelete={handleDelete}
                canEdit={isAdmin}
              />
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Editar Ativo' : 'Novo Ativo'}</DialogTitle>
              <DialogDescription>
                Gerencie as informações do patrimônio da sala de informática.
              </DialogDescription>
            </DialogHeader>
            <InventoryForm item={editingAsset} onSuccess={() => { setIsDialogOpen(false); fetchAllAssets(); }} />
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Inventory;