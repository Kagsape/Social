"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, ArrowLeft } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversationId: string;
  onBack?: () => void;
}

const ChatWindow = ({ conversationId, onBack }: ChatWindowProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const fetchOtherUser = useCallback(async () => {
    if (!conversationId || !user) return;
    
    const { data: participant } = await supabase
      .from('conversation_participants')
      .select('users (*)')
      .eq('conversation_id', conversationId)
      .neq('user_id', user.id)
      .single();
    
    if (participant) setOtherUser((participant as any).users);
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchOtherUser();

        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        
        setMessages(msgs || []);
      } catch (error) {
        console.error('Erro ao carregar chat:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Canal para mensagens e broadcast de "digitando"
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new]);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId !== user.id) {
          setIsOtherTyping(payload.payload.isTyping);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users'
      }, (payload) => {
        if (otherUser && payload.new.id === otherUser.id) {
          setOtherUser(payload.new);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, fetchOtherUser, otherUser?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOtherTyping]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user?.id, isTyping: true }
      });

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user?.id, isTyping: false }
        });
      }, 2000);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      // Parar de digitar imediatamente ao enviar
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: user.id, isTyping: false }
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="p-4 border-b flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={otherUser?.avatar_url} />
            <AvatarFallback>{otherUser?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          {otherUser?.is_online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full" />
          )}
        </div>
        <div>
          <h3 className="font-bold text-sm">{otherUser?.name}</h3>
          <p className={cn(
            "text-[10px] font-medium",
            otherUser?.is_online ? "text-green-500" : "text-muted-foreground"
          )}>
            {otherUser?.is_online ? 'Online agora' : (
              otherUser?.last_seen ? `Visto ${formatDistanceToNow(new Date(otherUser.last_seen), { addSuffix: true, locale: ptBR })}` : 'Offline'
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div 
              key={msg.id} 
              className={cn(
                "flex flex-col max-w-[80%]",
                isMe ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div className={cn(
                "px-4 py-2 rounded-2xl text-sm",
                isMe 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-muted rounded-tl-none"
              )}>
                {msg.content}
              </div>
              <span className="text-[9px] text-muted-foreground mt-1">
                {format(new Date(msg.created_at), "HH:mm", { locale: ptBR })}
              </span>
            </div>
          );
        })}
        
        {isOtherTyping && (
          <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-medium">{otherUser?.name?.split(' ')[0]} está digitando...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <Input
          placeholder="Digite sua mensagem..."
          value={newMessage}
          onChange={handleTyping}
          className="rounded-full bg-muted border-none focus-visible:ring-1"
        />
        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!newMessage.trim() || sending}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
};

export default ChatWindow;