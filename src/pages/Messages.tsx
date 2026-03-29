"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ChatList from '@/components/ChatList';
import ChatWindow from '@/components/ChatWindow';
import { Card } from "@/components/ui/card";
import { MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const Messages = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto h-[calc(100vh-12rem)] min-h-[500px]">
        <Card className="h-full border-none shadow-xl overflow-hidden flex bg-white dark:bg-slate-900">
          {/* Sidebar */}
          <div className={cn(
            "w-full md:w-80 border-r flex flex-col",
            selectedConversationId && "hidden md:flex"
          )}>
            <div className="p-4 border-b bg-slate-50 dark:bg-slate-800/50">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                Mensagens
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ChatList 
                onSelectConversation={setSelectedConversationId} 
                selectedId={selectedConversationId || undefined} 
              />
            </div>
          </div>

          {/* Chat Area */}
          <div className={cn(
            "flex-1 flex flex-col",
            !selectedConversationId && "hidden md:flex"
          )}>
            {selectedConversationId ? (
              <ChatWindow 
                conversationId={selectedConversationId} 
                onBack={() => setSelectedConversationId(null)} 
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="p-6 bg-primary/5 rounded-full">
                  <MessageSquare className="h-12 w-12 text-primary/20" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Suas Mensagens</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto">
                    Selecione uma conversa ao lado para começar a bater papo com outros alunos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Messages;