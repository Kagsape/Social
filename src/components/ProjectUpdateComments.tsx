"use client";

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Send, Trash2, Pin, PinOff } from 'lucide-react';
import { showError, showSuccess } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface ProjectUpdateCommentsProps {
  updateId: string;
  canPin?: boolean; // Propriedade para saber se o usuário atual pode fixar comentários
}

const ProjectUpdateComments = ({ updateId, canPin = false }: ProjectUpdateCommentsProps) => {
  const { user, userProfile } = useAuth();
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_update_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          is_pinned,
          users (id, name, avatar_url)
        `)
        .eq('update_id', updateId)
        .order('is_pinned', { ascending: false }) // Fixados primeiro
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
  }, [updateId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_update_comments')
        .insert({
          update_id: updateId,
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

  const togglePin = async (commentId: string, currentPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('project_update_comments')
        .update({ is_pinned: !currentPinned })
        .eq('id', commentId);

      if (error) throw error;
      
      showSuccess(currentPinned ? 'Comentário desfixado.' : 'Comentário fixado no topo!');
      fetchComments();
    } catch (error) {
      showError('Erro ao alterar estado do comentário.');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Excluir este comentário?')) return;
    try {
      const { error } = await supabase.from('project_update_comments').delete().eq('id', commentId);
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
          <p className="text-[10px] text-muted-foreground text-center py-2">Nenhum comentário ainda.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={cn(
              "flex gap-3 group relative p-2 rounded-xl transition-colors",
              comment.is_pinned ? "bg-primary/5 border border-primary/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
            )}>
              <Link to={`/profile/${comment.user_id}`}>
                <Avatar className="h-7 w-7 hover:opacity-80 transition-opacity">
                  <AvatarImage src={comment.users?.avatar_url} />
                  <AvatarFallback className="text-[8px]">{comment.users?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Link to={`/profile/${comment.user_id}`} className="text-[10px] font-bold hover:underline truncate">
                      {comment.users?.name}
                    </Link>
                    {comment.is_pinned && (
                      <span className="flex items-center gap-1 text-[8px] font-black text-primary uppercase tracking-tighter">
                        <Pin className="h-2 w-2 fill-current" /> Fixado
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed">{comment.content}</p>
                
                <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canPin && (
                    <button 
                      onClick={() => togglePin(comment.id, comment.is_pinned)}
                      className={cn(
                        "text-[9px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all",
                        comment.is_pinned 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-white dark:bg-slate-900 text-muted-foreground hover:text-primary border-muted"
                      )}
                    >
                      {comment.is_pinned ? <><PinOff className="h-2.5 w-2.5" /> Desfixar</> : <><Pin className="h-2.5 w-2.5" /> Fixar</>}
                    </button>
                  )}
                  {(comment.user_id === user?.id || userProfile?.role === 'admin') && (
                    <button 
                      onClick={() => deleteComment(comment.id)}
                      className="text-[9px] font-bold text-muted-foreground hover:text-destructive flex items-center gap-1 px-2 py-0.5 rounded-full border border-muted bg-white dark:bg-slate-900"
                    >
                      <Trash2 className="h-2.5 w-2.5" /> Excluir
                    </button>
                  )}
                </div>
              </div>
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
            className="h-8 text-[10px] rounded-full bg-slate-50 dark:bg-slate-800/50 border-none focus-visible:ring-1"
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

export default ProjectUpdateComments;