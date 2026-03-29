"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Heart, Share2, Image as ImageIcon, Trash2, Loader2, AlertCircle, RefreshCw, X } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import CommentSection from '@/components/CommentSection';
import AnnouncementList from '@/components/AnnouncementList';
import { Link } from 'react-router-dom';

const FeedSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <Card key={i} className="border-none shadow-sm bg-white dark:bg-slate-900">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-6 pt-4 border-t">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-12" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

const Feed = () => {
  const { user, userProfile, loading: authLoading, hasPermission } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchingRef = useRef(false);

  const fetchPosts = useCallback(async (isSilent = false) => {
    if (fetchingRef.current || !user?.id) return;
    
    fetchingRef.current = true;
    if (!isSilent) setLoading(true);
    
    try {
      const { data, error: supabaseError } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          created_at,
          user_id,
          users (id, name, avatar_url, role),
          likes (user_id)
        `)
        .order('created_at', { ascending: false });

      if (supabaseError) throw supabaseError;

      const processedPosts = (data || []).map(post => ({
        ...post,
        likes_count: Array.isArray(post.likes) ? post.likes.length : 0,
        has_liked: Array.isArray(post.likes) ? post.likes.some((l: any) => l.user_id === user.id) : false
      }));
      
      setPosts(processedPosts);
      setError(null);
    } catch (err: any) {
      console.error('[Feed] Erro ao buscar posts:', err);
      setError('Erro ao carregar o feed.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && user?.id) {
      fetchPosts();

      // Real-time subscription para posts
      const channel = supabase
        .channel('feed_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
          fetchPosts(true);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [authLoading, user?.id, fetchPosts]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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
      setImagePreview(null);
    } catch (error: any) {
      showError('Erro ao publicar.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleLike = async (post: any) => {
    if (!user) return;
    const hasLiked = post.has_liked;

    // Atualização otimista
    setPosts(prev => prev.map(p => {
      if (p.id === post.id) {
        return {
          ...p,
          has_liked: !hasLiked,
          likes_count: hasLiked ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));

    try {
      if (hasLiked) {
        await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      } else {
        await supabase.from('likes').insert({ post_id: post.id, user_id: user.id });
        
        // Criar notificação se não for o próprio post
        if (post.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: 'like',
            post_id: post.id,
            message: `${userProfile?.name} curtiu seu post.`
          });
        }
      }
    } catch (error: any) {
      fetchPosts(true);
    }
  };

  const deletePost = async (postId: string) => {
    if (!confirm('Tem certeza que deseja excluir este post?')) return;
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      showSuccess('Post removido.');
    } catch (error: any) {
      showError('Erro ao excluir post.');
    }
  };

  if (authLoading) return <Layout><div className="max-w-2xl mx-auto space-y-6"><FeedSkeleton /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <AnnouncementList />

        {error && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-6 flex flex-col items-center gap-3 text-destructive text-center">
              <AlertCircle className="h-10 w-10 opacity-50" />
              <p className="font-bold">{error}</p>
              <Button variant="outline" size="sm" onClick={() => fetchPosts()} className="gap-2">
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
                <AvatarFallback className="bg-primary text-primary-foreground">{userProfile?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-4">
                <Textarea
                  placeholder={`No que você está pensando, ${userProfile?.name?.split(' ')[0]}?`}
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="min-h-[100px] resize-none border-none focus-visible:ring-0 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4"
                />
                
                {imagePreview && (
                  <div className="relative rounded-xl overflow-hidden border">
                    <img src={imagePreview} alt="Preview" className="w-full h-auto max-h-80 object-cover" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={() => setImagePreview(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2 border-t">
                  <div className="flex gap-2">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleImageSelect}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="rounded-full gap-2 text-muted-foreground hover:text-primary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-4 w-4" /> Foto
                    </Button>
                  </div>
                  <Button 
                    onClick={createPost} 
                    disabled={!newPost.trim() || submitting}
                    className="rounded-full px-6 font-semibold"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Publicar'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && posts.length === 0 ? (
            <FeedSkeleton />
          ) : (
            posts.map(post => (
              <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Link to={`/profile/${post.user_id}`}>
                        <Avatar className="h-10 w-10 border hover:opacity-80 transition-opacity">
                          <AvatarImage src={post.users?.avatar_url} />
                          <AvatarFallback>{post.users?.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/profile/${post.user_id}`} className="font-bold text-sm hover:underline">
                            {post.users?.name}
                          </Link>
                          {post.users?.role === 'teacher' && <Badge variant="secondary" className="text-[10px] h-4 px-1">Professor</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR }) : 'Agora'}
                        </p>
                      </div>
                    </div>
                    {(post.user_id === user?.id || hasPermission('delete_any_post')) && (
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive rounded-full" onClick={() => deletePost(post.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{post.content}</p>
                  <div className="flex items-center gap-6 pt-4 border-t">
                    <button onClick={() => toggleLike(post)} className={cn("flex items-center gap-2 text-sm transition-all", post.has_liked ? "text-red-500" : "text-muted-foreground hover:text-red-500")}>
                      <Heart className={cn("h-5 w-5", post.has_liked && "fill-current")} />
                      <span className="font-bold">{post.likes_count}</span>
                    </button>
                    <button onClick={() => setActiveComments(prev => ({ ...prev, [post.id]: !prev[post.id] }))} className={cn("flex items-center gap-2 text-sm transition-colors", activeComments[post.id] ? "text-primary" : "text-muted-foreground hover:text-primary")}>
                      <MessageSquare className="h-5 w-5" />
                      <span className="font-medium">Comentar</span>
                    </button>
                    <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/feed#post-${post.id}`); showSuccess('Link copiado!'); }} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                      <Share2 className="h-5 w-5" />
                      <span className="font-medium">Compartilhar</span>
                    </button>
                  </div>
                  {activeComments[post.id] && <CommentSection postId={post.id} />}
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