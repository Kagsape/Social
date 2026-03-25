"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send, Trash2 } from 'lucide-react';
import { showError } from '@/utils/toast';

interface CommentSectionProps {
  postId: string;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            name,
            avatar_url
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;
      setNewComment('');
      fetchComments();
    } catch (error) {
      showError('Erro ao enviar comentário.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      showError('Erro ao excluir comentário.');
    }
  };

  return (
    <div className="pt-4 space-y-4 border-t mt-4">
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <Avatar className="h-7 w-7">
                <AvatarImage src={comment.users?.avatar_url} />
                <AvatarFallback className="text-[10px]">{comment.users?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{comment.users?.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs mt-1">{comment.content}</p>
              </div>
              {(comment.user_id === user?.id || userProfile?.role === 'admin') && (
                <button 
                  onClick={() => deleteComment(comment.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Avatar className="h-7 w-7">
            <AvatarImage src={userProfile?.avatar_url} />
            <AvatarFallback className="text-[10px]">{userProfile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Input
            placeholder="Escreva um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="h-8 text-xs rounded-full bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-8 w-8 rounded-full shrink-0"
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </form>
      )}
    </div>
  );
};

export default CommentSection;