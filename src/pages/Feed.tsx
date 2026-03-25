"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Share2, Image as ImageIcon, Send, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Feed = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel('public:posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        fetchPosts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          users (id, name, avatar_url, role),
          likes (user_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async () => {
    if (!newPost.trim() || !user) return;
    
    if (!userProfile) {
      showError('Perfil de usuário não encontrado. Tente fazer login novamente.');
      return;
    }

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
      console.error('Error creating post:', error);
      showError(error.message || 'Erro ao publicar post');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!user) return;

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
      fetchPosts();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Deseja excluir este post?')) return;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      showSuccess('Post excluído');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      showError('Erro ao excluir post');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <Avatar className="h-10 w-10">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder={`O que você está pensando, ${userProfile?.name?.split(' ')[0] || 'usuário'}?`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none border-none focus-visible:ring-0 bg-muted/30 rounded-xl p-4"
                />
                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
                      <ImageIcon className="h-4 w-4" /> Foto
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 text-muted-foreground">
                      <ImageIcon className="h-4 w-4" /> Vídeo
                    </Button>
                  </div>
                  <Button 
                    onClick={createPost} 
                    disabled={!newPost.trim() || submitting}
                    className="rounded-full px-6"
                  >
                    {submitting ? 'Publicando...' : 'Publicar'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-white dark:bg-slate-900 rounded-xl border border-dashed">
              Nenhum post ainda. Seja o primeiro a publicar!
            </div>
          ) : (
            posts.map(post => {
              const hasLiked = post.likes?.some((l: any) => l.user_id === user?.id);
              const isAuthor = post.user_id === user?.id;
              const isAdmin = userProfile?.role === 'admin';

              return (
                <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border-2 border-primary/10">
                          <AvatarImage src={post.users?.avatar_url} />
                          <AvatarFallback>
                            {post.users?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-sm">{post.users?.name}</p>
                            {post.users?.role === 'teacher' && (
                              <Badge variant="secondary" className="text-[10px] h-4 px-1">Professor</Badge>
                            )}
                            {post.users?.role === 'admin' && (
                              <Badge variant="destructive" className="text-[10px] h-4 px-1">Admin</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      {(isAuthor || isAdmin) && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => deletePost(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
                    
                    <div className="flex items-center gap-6 pt-4 border-t">
                      <button 
                        onClick={() => toggleLike(post.id, hasLiked)}
                        className={`flex items-center gap-2 text-sm transition-colors ${hasLiked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                      >
                        <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current' : ''}`} />
                        <span className="font-medium">{post.likes?.length || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <MessageSquare className="h-5 w-5" />
                        <span className="font-medium">Comentar</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Share2 className="h-5 w-5" />
                        <span className="font-medium">Compartilhar</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;