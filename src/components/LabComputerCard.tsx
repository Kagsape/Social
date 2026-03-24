"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Wrench, CheckCircle, XCircle } from 'lucide-react';

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
          color: 'text-green-600'
        };
      case 'broken':
        return {
          label: 'Quebrado',
          variant: 'destructive' as const,
          icon: XCircle,
          color: 'text-red-600'
        };
      case 'maintenance':
        return {
          label: 'Manutenção',
          variant: 'secondary' as const,
          icon: Wrench,
          color: 'text-yellow-600'
        };
      default:
        return {
          label: 'Desconhecido',
          variant: 'outline' as const,
          icon: Monitor,
          color: 'text-gray-600'
        };
    }
  };

  const statusConfig = getStatusConfig(computer.status);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            {computer.name}
          </CardTitle>
          <Badge variant={statusConfig.variant} className="gap-1">
            <statusConfig.icon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
        {computer.location && (
          <p className="text-sm text-muted-foreground">{computer.location}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {computer.specs && (
          <div className="text-sm space-y-1">
            <p className="font-medium">Especificações:</p>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto">
              {JSON.stringify(computer.specs, null, 2)}
            </pre>
          </div>
        )}
        
        {computer.last_maintained && (
          <p className="text-xs text-muted-foreground">
            Última manutenção: {new Date(computer.last_maintained).toLocaleDateString('pt-BR')}
          </p>
        )}

        {showActions && computer.status === 'working' && (
          <Button 
            onClick={() => onReserve?.(computer.id)} 
            className="w-full"
            size="sm"
          >
            Reservar
          </Button>
        )}

        {showActions && computer.status === 'broken' && (
          <Button 
            onClick={() => onMaintain?.(computer.id)} 
            variant="outline"
            className="w-full"
            size="sm"
          >
            Solicitar Reparo
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default LabComputerCard;