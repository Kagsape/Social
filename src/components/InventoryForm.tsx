"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Save, Plus, Minus, Monitor, Package } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface InventoryFormProps {
  item?: any;
  onSuccess: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'item' | 'computer'>(item?.specs ? 'computer' : 'item');
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    total_quantity: 1,
    available_quantity: 1,
    condition: 'bom',
    status: 'working',
    location: '',
    specs: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        category: item.category || '',
        total_quantity: item.total_quantity || 1,
        available_quantity: item.available_quantity || 1,
        condition: item.condition || 'bom',
        status: item.status || 'working',
        location: item.location || '',
        specs: item.specs ? (typeof item.specs === 'string' ? item.specs : item.specs.info) : ''
      });
      setType(item.specs ? 'computer' : 'item');
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (type === 'computer') {
        const payload = {
          name: formData.name,
          location: formData.location,
          status: formData.status as any,
          specs: { info: formData.specs }
        };

        if (item?.id) {
          const { error } = await supabase.from('lab_computers').update(payload).eq('id', item.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('lab_computers').insert(payload);
          if (error) throw error;
        }
      } else {
        const payload = {
          name: formData.name,
          category: formData.category,
          total_quantity: formData.total_quantity,
          available_quantity: formData.available_quantity,
          condition: formData.condition,
          location: formData.location
        };

        if (item?.id) {
          const { error } = await supabase.from('inventory_items').update(payload).eq('id', item.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('inventory_items').insert(payload);
          if (error) throw error;
        }
      }

      showSuccess('Ativo salvo com sucesso!');
      onSuccess();
    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      {!item && (
        <Tabs value={type} onValueChange={(v: any) => setType(v)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="computer" className="gap-2"><Monitor className="h-4 w-4" /> Computador</TabsTrigger>
            <TabsTrigger value="item" className="gap-2"><Package className="h-4 w-4" /> Equipamento</TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nome / Identificação</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder={type === 'computer' ? "Ex: PC-01" : "Ex: Mouse USB"} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>Localização</Label>
          <Input 
            value={formData.location} 
            onChange={(e) => setFormData({...formData, location: e.target.value})} 
            placeholder="Ex: Fila A / Armário 01" 
          />
        </div>
      </div>

      {type === 'computer' ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status de Operação</Label>
            <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="working">Disponível / Funcionando</SelectItem>
                <SelectItem value="maintenance">Em Manutenção</SelectItem>
                <SelectItem value="broken">Quebrado / Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Especificações Técnicas</Label>
            <Textarea 
              value={formData.specs} 
              onChange={(e) => setFormData({...formData, specs: e.target.value})} 
              placeholder="Processador, RAM, HD..." 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input 
                value={formData.category} 
                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                placeholder="Ex: Periféricos" 
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={formData.condition} onValueChange={(v) => setFormData({...formData, condition: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bom">Bom</SelectItem>
                  <SelectItem value="ruim">Ruim</SelectItem>
                  <SelectItem value="quebrado">Quebrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Qtd. Total</Label>
              <Input 
                type="number" 
                value={formData.total_quantity} 
                onChange={(e) => setFormData({...formData, total_quantity: parseInt(e.target.value) || 0})} 
              />
            </div>
            <div className="space-y-2">
              <Label>Qtd. Disponível</Label>
              <Input 
                type="number" 
                value={formData.available_quantity} 
                onChange={(e) => setFormData({...formData, available_quantity: parseInt(e.target.value) || 0})} 
              />
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full gap-2 h-12 font-bold" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {item ? 'Salvar Alterações' : 'Cadastrar no Inventário'}
      </Button>
    </form>
  );
};

export default InventoryForm;