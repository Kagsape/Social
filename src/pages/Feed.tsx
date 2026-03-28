"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Share2, Image as ImageIcon, Trash2, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CommentSection from '@/components/CommentSection';
import { Link } from 'react-router-dom';

const Feed = () => {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (
            id,
            name,
            avatar_url,
            role
          ),
          likes (
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedPosts = (data || []).map(post => ({
        ...post,
        likes_count: Array.isArray(post.likes) ? post.likes.length : 0,
        has_liked: Array.isArray(post.likes) ? post.likes.some((l: any) => l.user_id === user?.id) : false
      }));
      
      setPosts(processedPosts);
    } catch (err: any) {
      console.error('[Feed] Erro ao buscar posts:', err);
      setError(err.message || 'Erro ao carregar o feed.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading) {
      fetchPosts();

      const channel = supabase
        .channel('feed_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts())
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, fetchPosts]);

  const createPost = async () => {
    if (!newPost.trim() || !user) return;
    
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          content: newPost,
          user_id: user.id
        });

      if (error) throw error;

      showSuccess('Post publicado!');
      setNewPost('');
      fetchPosts();
    } catch (error: any) {
      showError('Erro ao publicar.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) {
      showError('Você precisa estar logado para curtir.');
      return;
    }

    try {
      if (hasLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error: any) {
      showError('Erro ao processar curtida.');
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      showSuccess('Post removido.');
    } catch (error: any) {
      showError('Erro ao excluir post.');
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Autenticando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex flex-col items-center gap-3 text-destructive">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p className="text-sm font-medium">Erro ao carregar feed</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => fetchPosts()} className="mt-2 gap-2">
                <RefreshCw className="h-3 w-3" /> Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {userProfile?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder={`No que você está pensando, ${userProfile?.name?.split(' ')[0] || 'aluno'}?`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none border-none focus-visible:ring-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
                />
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground hover:text-primary">
                      <ImageIcon className="h-4 w-4" /> Foto
                    </Button>
                  </div>
                  <Button 
                    onClick={createPost} 
                    disabled={!newPost.trim() || submitting}
                    className="rounded-full px-6 font-semibold"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {submitting ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
              <p className="text-sm text-muted-foreground">Buscando posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="py-16 text-center space-y-2">
                <div className="bg-slate-100 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-bold text-lg">O feed está vazio</h3>
                <p className="text-muted-foreground">Seja o primeiro a compartilhar algo!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map(post => (
              <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${post.user_id}`}>
                        <Avatar className="h-10 w-10 border hover:opacity-80 transition-opacity">
                          <AvatarImage src={post.users?.avatar_url} />
                          <AvatarFallback className="bg-slate-200 dark:bg-slate-700">
                            {post.users?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${post.user_id}`} className="font-bold text-sm hover:underline">
                            {post.users?.name || 'Usuário'}
                          </Link>
                          {post.users?.role === 'teacher' && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              Professor
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                    {(post.user_id === user?.id || userProfile?.role === 'admin') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground hover:text-destructive rounded-full" 
                        onClick={() => deletePost(post.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-6 pt-4 border-t">
                    <button 
                      onClick={() => toggleLike(post.id, post.has_liked)}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-all hover:scale-110",
                        post.has_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500"
                      )}
                    >
                      <Heart className={cn("h-5 w-5", post.has_liked && "fill-current")} />
                      <span className="font-bold">{post.likes_count}</span>
                    </button>
                    <button 
                      onClick={() => setActiveComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))}
                      className={cn(
                        "flex items-center gap-2 text-sm transition-colors",
                        activeComments[post.id] ? "text-primary" : "text-muted-foreground hover:text-primary"
                      )}
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="font-medium">Comentar</span>
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/feed#post-${post.id}`);
                        showSuccess('Link copiado!');
                      }}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Share2 className="h-5 w-5" />
                      <span className="font-medium">Compartilhar</span>
                    </button>
                  </div>

                  {activeComments[post.id] && (
                    <CommentSection postId={post.id} />
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;