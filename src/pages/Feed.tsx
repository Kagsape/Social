"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Heart, Share2, Image as ImageIcon, Send, Code2, Plus } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess } from '@/utils/toast';

interface Post {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
  likes: number;
  comments: number;
  course_id?: string;
  course_name?: string;
}

const Feed = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Fetch posts from announcements (global ones and course-specific)
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          users!announcements_author_id_fkey (name, avatar_url),
          courses (name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedPosts = data?.map(announcement => ({
        id: announcement.id,
        author_id: announcement.author_id,
        author_name: announcement.users?.name || 'Anônimo',
        author_avatar: announcement.users?.avatar_url,
        content: announcement.content,
        created_at: announcement.created_at,
        likes: 0,
        comments: 0,
        course_id: announcement.course_id,
        course_name: announcement.courses?.name
      })) || [];

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newPost.trim()) return;

    setPosting(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: 'Novo post',
          content: newPost,
          author_id: user.id,
          is_global: true
        });

      if (error) throw error;

      showSuccess('Post publicado com sucesso!');
      setNewPost('');
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      showError('Erro ao publicar post');
    } finally {
      setPosting(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Profile Summary */}
        <div className="hidden lg:block space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-4 pb-4 -mt-10 text-center">
              <Avatar className="w-20 h-20 border-4 border-white mx-auto mb-3">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {userProfile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">{userProfile?.name}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {userProfile?.role === 'admin' ? 'Administrador' : 
                 userProfile?.role === 'teacher' ? 'Professor' : 'Aluno'}
              </p>
              <div className="grid grid-cols-2 gap-4 py-4 border-t">
                <div>
                  <p className="font-bold text-sm">0</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Posts</p>
                </div>
                <div>
                  <p className="font-bold text-sm">0</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Seguidores</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-none shadow-sm">
            <h4 className="font-bold text-sm mb-4">Tópicos em Alta</h4>
            <div className="space-y-3">
              {['#python', '#arduino', '#scratch', '#ciep165', '#tecnologia'].map(tag => (
                <div key={tag} className="text-sm text-blue-600 hover:underline cursor-pointer font-medium">
                  {tag}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card className="p-4 border-none shadow-sm">
            <form onSubmit={createPost} className="space-y-4">
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{userProfile?.name?.charAt(0)?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <Textarea 
                  placeholder="Compartilhe algo com a comunidade..." 
                  className="min-h-[80px] bg-muted/30 border-none focus-visible:ring-1 resize-none"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
                    <ImageIcon className="h-4 w-4 mr-2" /> Foto
                  </Button>
                  <Button variant="ghost" size="sm" type="button" className="text-muted-foreground">
                    <Code2 className="h-4 w-4 mr-2" /> Código
                  </Button>
                </div>
                <Button size="sm" type="submit" disabled={posting || !newPost.trim()} className="rounded-full px-6">
                  <Send className="h-4 w-4 mr-2" /> {posting ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </form>
          </Card>

          {/* Posts List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum post ainda. Seja o primeiro a compartilhar!</p>
            </Card>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => (
                <Card key={post.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center gap-4 p-4">
                    <Avatar>
                      <AvatarImage src={post.author_avatar} />
                      <AvatarFallback>{post.author_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{post.author_name}</span>
                        {post.course_name && (
                          <Badge variant="outline" className="text-xs">
                            {post.course_name}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center gap-6 pt-4 mt-4 border-t">
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" /> {post.likes}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition-colors">
                        <MessageSquare className="h-4 w-4" /> {post.comments}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors">
                        <Share2 className="h-4 w-4" /> Compartilhar
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Feed;