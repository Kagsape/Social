"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Edit3, Trash2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InventoryItemCardProps {
  item: any;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit, onDelete, canEdit, canDelete }) => {
  const getConditionConfig = (condition: string) => {
    switch (condition) {
      case 'bom':
        return { label: 'Bom Estado', variant: 'default' as const, icon: CheckCircle2, color: 'text-green-600' };
      case 'ruim':
        return { label: 'Estado Ruim', variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' };
      case 'quebrado':
        return { label: 'Quebrado', variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' };
      default:
        return { label: condition, variant: 'outline' as const, icon: Package, color: 'text-gray-600' };
    }
  };

  const config = getConditionConfig(item.condition);

  return (
    <Card className="hover:shadow-md transition-all border-none shadow-sm bg-white dark:bg-slate-900">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider">{item.category}</Badge>
            <CardTitle className="text-lg font-bold">{item.name}</CardTitle>
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
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Disponível</p>
            <p className="text-xl font-black">
              {item.available_quantity} <span className="text-xs text-muted-foreground font-normal">/ {item.total_quantity}</span>
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase font-bold">Localização</p>
            <div className="flex items-center gap-1 text-sm">
              <MapPin className="h-3 w-3 text-primary" />
              <span className="truncate">{item.location || 'Não definida'}</span>
            </div>
          </div>
        </div>

        {(canEdit || canDelete) && (
          <div className="flex gap-2 pt-2 border-t">
            {canEdit && (
              <Button variant="outline" size="sm" className="flex-1 gap-2" onClick={() => onEdit?.(item)}>
                <Edit3 className="h-3 w-3" /> Editar
              </Button>
            )}
            {canDelete && (
              <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10" onClick={() => onDelete?.(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InventoryItemCard;