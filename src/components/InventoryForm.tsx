"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Save } from 'lucide-react';

interface InventoryFormProps {
  item?: any;
  onSuccess: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    total_quantity: 0,
    available_quantity: 0,
    condition: 'bom',
    location: ''
  });

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name,
        category: item.category,
        total_quantity: item.total_quantity,
        available_quantity: item.available_quantity,
        condition: item.condition,
        location: item.location || ''
      });
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (item) {
        const { error } = await supabase
          .from('inventory_items')
          .update(formData)
          .eq('id', item.id);
        if (error) throw error;
        showSuccess('Item atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('inventory_items')
          .insert(formData);
        if (error) throw error;
        showSuccess('Item cadastrado com sucesso!');
      }
      onSuccess();
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar item.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Equipamento</Label>
          <Input 
            id="name" 
            value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} 
            placeholder="Ex: Mouse Logitech G203" 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input 
            id="category" 
            value={formData.category} 
            onChange={(e) => setFormData({...formData, category: e.target.value})} 
            placeholder="Ex: Periféricos" 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total">Qtd. Total</Label>
          <Input 
            id="total" 
            type="number" 
            value={formData.total_quantity} 
            onChange={(e) => setFormData({...formData, total_quantity: parseInt(e.target.value)})} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="available">Qtd. Disponível</Label>
          <Input 
            id="available" 
            type="number" 
            value={formData.available_quantity} 
            onChange={(e) => setFormData({...formData, available_quantity: parseInt(e.target.value)})} 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Estado de Conservação</Label>
          <Select 
            value={formData.condition} 
            onValueChange={(v) => setFormData({...formData, condition: v})}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bom">Bom</SelectItem>
              <SelectItem value="ruim">Ruim</SelectItem>
              <SelectItem value="quebrado">Quebrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Localização</Label>
          <Input 
            id="location" 
            value={formData.location} 
            onChange={(e) => setFormData({...formData, location: e.target.value})} 
            placeholder="Ex: Armário 02, Prateleira A" 
          />
        </div>
      </div>

      <Button type="submit" className="w-full gap-2" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {item ? 'Salvar Alterações' : 'Cadastrar Equipamento'}
      </Button>
    </form>
  );
};

export default InventoryForm;