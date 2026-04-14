"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, isUserReallyOnline } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, MessageSquare } from 'lucide-react';

interface ChatListProps {
  onSelectConversation: (id: string) => void;
  selectedId?: string;
}

const ChatList = ({ onSelectConversation, selectedId }: ChatListProps) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const { data, error } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversations (id, last_message_at)
          `)
          .eq('user_id', user.id);

        if (error) throw error;

        const formatted = await Promise.all((data || []).map(async (item: any) => {
          const { data: other } = await supabase
            .from('conversation_participants')
            .select('users (*)')
            .eq('conversation_id', item.conversation_id)
            .neq('user_id', user.id)
            .single();
          
          return {
            id: item.conversation_id,
            last_message_at: item.conversations.last_message_at,
            other_user: (other as any)?.users
          };
        }));

        setConversations(formatted.sort((a, b) => 
          new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
        ));
      } catch (error) {
        console.error('Erro ao buscar conversas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();

    const channel = supabase
      .channel('conversations_list_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (payload) => {
        setConversations(prev => prev.map(conv => {
          if (conv.other_user?.id === payload.new.id) {
            return { ...conv, other_user: payload.new };
          }
          return conv;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground space-y-2">
        <MessageSquare className="h-8 w-8 opacity-20" />
        <p className="text-sm">Nenhuma conversa iniciada.</p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => {
        const isOnline = isUserReallyOnline(conv.other_user?.is_online, conv.other_user?.last_seen);
        
        return (
          <button
            key={conv.id}
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 p-4 transition-colors hover:bg-muted/50 text-left",
              selectedId === conv.id && "bg-muted"
            )}
          >
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.other_user?.avatar_url} />
                <AvatarFallback>{conv.other_user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isOnline && (
                <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h4 className="font-bold text-sm truncate">{conv.other_user?.name}</h4>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              <p className={cn(
                "text-xs truncate",
                isOnline ? "text-green-600 font-medium" : "text-muted-foreground"
              )}>
                {isOnline ? 'Online agora' : 'Clique para ver as mensagens'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;