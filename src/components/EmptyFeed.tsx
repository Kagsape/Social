"use client";

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquarePlus } from 'lucide-react';

const EmptyFeed = () => {
  return (
    <Card className="border-none shadow-sm bg-white dark:bg-slate-900 py-12">
      <CardContent className="flex flex-col items-center text-center space-y-4">
        <div className="p-4 bg-primary/5 rounded-full">
          <MessageSquarePlus className="h-12 w-12 text-primary/20" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">O feed está silencioso</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Seja o primeiro a compartilhar algo com a comunidade do CIEP 165!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmptyFeed;