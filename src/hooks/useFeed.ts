"use client";

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';

export const useFeed = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      setError('Erro ao carregar o feed.');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id]);

  const toggleLike = async (post: any) => {
    if (!user) return;
    const hasLiked = post.has_liked;

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
    } catch (error) {
      fetchPosts(true);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== postId));
      showSuccess('Post removido.');
    } catch (error) {
      showError('Erro ao excluir post.');
    }
  };

  return { posts, loading, error, fetchPosts, toggleLike, deletePost };
};