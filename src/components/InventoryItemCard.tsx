"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  MapPin, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Monitor,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MaintenanceLogDialog from './MaintenanceLogDialog';

interface InventoryItemCardProps {
  item: any;
  onEdit?: (item: any) => void;
  onDelete?: (id: string, type: 'computer' | 'item') => void;
  onStatusChange?: (id: string, status: string) => void;
  canEdit: boolean;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onDelete, onStatusChange, canEdit }) => {
  const isComputer = !!item.specs || item.type === 'computer';
  
  const getConditionConfig = (condition: string) => {
    switch (condition) {
      case 'working':
      case 'bom':
        return { label: 'Operacional', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' };
      case 'maintenance':
      case 'ruim':
        return { label: 'Manutenção', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' };
      case 'broken':
      case 'quebrado':
        return { label: 'Danificado', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' };
      default:
        return { label: condition, variant: 'outline' as const, icon: Package, color: 'text-gray-600' };
    }
  };

  const status = item.status || item.condition;
  const config = getConditionConfig(status);
  
  // Lógica de estoque apenas para itens que não são computadores individuais
  const isLowStock = !isComputer && item.available_quantity <= 2 && item.available_quantity > 0;
  const isOutOfStock = !isComputer && item.available_quantity === 0;

  return (
    <Card className={cn(
      "hover:shadow-md transition-all border-none shadow-sm bg-white dark:bg-slate-900 relative overflow-hidden",
      (isOutOfStock || status === 'broken') && "opacity-80 grayscale-[0.3]"
    )}>
      {isLowStock && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 z-10">
          <AlertCircle className="h-2 w-2" /> ESTOQUE BAIXO
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
              {isComputer ? 'Estação de Trabalho' : (item.category || 'Equipamento')}
            </Badge>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              {isComputer ? <Monitor className="h-4 w-4 text-primary" /> : <Package className="h-4 w-4 text-primary" />}
              {item.name}
            </CardTitle>
          </div>
          <Badge variant={config.variant} className="gap-1">
            <config.icon className="h-3 w-3" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">
              {isComputer ? 'Status' : 'Disponível'}
            </p>
            <p className={cn(
              "text-xl font-black",
              isOutOfStock ? "text-red-600" : isLowStock ? "text-amber-600" : "text-foreground"
            )}>
              {isComputer ? (status === 'working' ? 'Ativo' : 'Inativo') : (
                <>{item.available_quantity} <span className="text-xs text-muted-foreground font-normal">/ {item.total_quantity}</span></>
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Localização</p>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="truncate">{item.location || 'Sala Principal'}</span>
            </div>
          </div>
        </div>

        {isComputer && item.specs && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-dashed text-[10px] text-muted-foreground">
            <span className="font-bold uppercase block mb-1">Especificações:</span>
            {typeof item.specs === 'string' ? item.specs : (item.specs.info || 'Configuração padrão')}
          </div>
        )}

        {canEdit && (
          <div className="flex gap-2 pt-2 border-t">
            <div className="flex-1 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 gap-2 h-9" onClick={() => onEdit?.(item)}>
                <Edit3 className="h-3 w-3" /> Editar
              </Button>
              {isComputer && (
                <MaintenanceLogDialog computerId={item.id} computerName={item.name} />
              )}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10" 
              onClick={() => onDelete?.(item.id, isComputer ? 'computer' : 'item')}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryItemCard;