"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Wrench, CheckCircle, XCircle, MapPin, Info } from 'lucide-react';
import MaintenanceLogDialog from './MaintenanceLogDialog';
import { cn } from '@/lib/utils';

interface LabComputerCardProps {
  computer: {
    id: string;
    name: string;
    status: 'working' | 'broken' | 'maintenance';
    specs?: any;
    location?: string;
    last_maintained?: string;
  };
  onReserve?: (computerId: string) => void;
  onMaintain?: (computerId: string) => void;
  showActions?: boolean;
}

const LabComputerCard: React.FC<LabComputerCardProps> = ({ 
  computer, 
  onReserve, 
  onMaintain, 
  showActions = false 
}) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'working':
        return {
          label: 'Disponível',
          variant: 'default' as const,
          icon: CheckCircle,
          color: 'text-green-600',
          bg: 'bg-green-50 dark:bg-green-900/10'
        };
      case 'broken':
        return {
          label: 'Quebrado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600',
          bg: 'bg-red-50 dark:bg-red-900/10'
        };
      case 'maintenance':
        return {
          label: 'Manutenção',
          variant: 'secondary' as const,
          icon: Wrench,
          color: 'text-yellow-600',
          bg: 'bg-yellow-50 dark:bg-yellow-900/10'
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          icon: Monitor,
          color: 'text-gray-600',
          bg: 'bg-slate-50 dark:bg-slate-900/10'
        };
    }
  };

  const statusConfig = getStatusConfig(computer.status);

  return (
    <Card className={cn(
      "hover:shadow-lg transition-all border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden",
      computer.status === 'broken' && "border-l-4 border-l-red-500"
    )}>
      <CardHeader className={cn("pb-3", statusConfig.bg)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className={cn("h-5 w-5", statusConfig.color)} />
            {computer.name}
          </CardTitle>
          <Badge variant={statusConfig.variant} className="gap-1">
            <statusConfig.icon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <MapPin className="h-3 w-3 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">{computer.location || 'Sem localização'}</p>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-4">
        {computer.specs && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Especificações
            </p>
            <div className="text-xs bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-dashed">
              {typeof computer.specs === 'string' ? computer.specs : JSON.stringify(computer.specs.info || computer.specs)}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2 border-t">
          <p className="text-[10px] text-muted-foreground">
            {computer.last_maintained ? `Última manutenção: ${new Date(computer.last_maintained).toLocaleDateString('pt-BR')}` : 'Sem histórico de manutenção'}
          </p>
          {showActions && (
            <MaintenanceLogDialog computerId={computer.id} computerName={computer.name} />
          )}
        </div>

        {showActions && (
          <div className="flex gap-2">
            {computer.status === 'working' ? (
              <Button 
                onClick={() => onMaintain?.(computer.id)} 
                variant="outline"
                className="w-full h-9 text-xs gap-2"
              >
                <Wrench className="h-3 w-3" /> Marcar Manutenção
              </Button>
            ) : (
              <Button 
                onClick={() => onMaintain?.(computer.id)} 
                className="w-full h-9 text-xs gap-2"
              >
                <CheckCircle className="h-3 w-3" /> Marcar como Funcional
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LabComputerCard;