"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus, Sparkles } from 'lucide-react';

const EmptyFeed = () => {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 py-16 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Sparkles className="h-24 w-24 text-primary" />
      </div>
      <CardContent className="flex flex-col items-center text-center space-y-6 relative z-10">
        <div className="p-6 bg-primary/5 rounded-full ring-8 ring-primary/5">
          <MessageSquarePlus className="h-12 w-12 text-primary animate-bounce" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">O feed está esperando por você!</h3>
          <p className="text-muted-foreground max-w-sm mx-auto text-lg">
            Ainda não há publicações por aqui. Que tal ser o primeiro a compartilhar algo incrível com a comunidade do CIEP 165?
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyFeed;