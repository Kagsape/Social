"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { 
  Loader2, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  Shield, 
  GraduationCap, 
  BookOpen, 
  MessageSquare, 
  Heart,
  Edit3,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, likesReceived: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        // 1. Buscar Perfil
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Buscar Posts do Usuário
        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            id, content, created_at,
            likes (user_id)
          `)
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        const processedPosts = (postsData || []).map(post => ({
          ...post,
          likes_count: post.likes?.length || 0
        }));
        
        setPosts(processedPosts);

        // 3. Calcular Estatísticas
        const totalLikes = processedPosts.reduce((acc, post) => acc + post.likes_count, 0);
        setStats({
          posts: processedPosts.length,
          likesReceived: totalLikes
        });

      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Usuário não encontrado</h2>
          <Button variant="link" onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </Layout>
    );
  }

  const isOwnProfile = currentUser?.id === id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        {/* Header do Perfil */}
        <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-48 bg-gradient-to-r from-primary via-indigo-600 to-blue-500"></div>
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 px-4">
              <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-2xl">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 text-center md:text-left space-y-2 pb-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                  <h1 className="text-3xl font-bold">{profile.name}</h1>
                  <Badge variant="secondary" className="w-fit mx-auto md:mx-0 gap-1.5">
                    {profile.role === 'admin' ? <Shield className="h-3 w-3" /> : 
                     profile.role === 'teacher' ? <BookOpen className="h-3 w-3" /> : 
                     <GraduationCap className="h-3 w-3" />}
                    <span className="capitalize">{profile.role === 'student' ? 'Aluno' : profile.role === 'teacher' ? 'Professor' : 'Admin'}</span>
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {profile.email}</span>
                  {profile.location && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>}
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Desde {format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR })}</span>
                </div>
              </div>

              {isOwnProfile && (
                <Link to="/profile" className="mb-2">
                  <Button variant="outline" className="gap-2 rounded-full">
                    <Edit3 className="h-4 w-4" /> Editar Perfil
                  </Button>
                </Link>
              )}
            </div>

            {profile.bio && (
              <div className="mt-8 px-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Sobre</h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {profile.bio}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar de Stats */}
          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p className="text-2xl font-bold text-primary">{stats.posts}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Posts</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p className="text-2xl font-bold text-red-500">{stats.likesReceived}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Curtidas</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Posts */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold px-1 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Publicações
            </h2>
            
            {posts.length === 0 ? (
              <Card className="border-none shadow-sm bg-white dark:bg-slate-900 py-12 text-center">
                <CardContent className="text-muted-foreground">
                  Este usuário ainda não fez nenhuma publicação.
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <Card key={post.id} className="border-none shadow-sm bg-white dark:bg-slate-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-6 space-y-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Heart className="h-3 w-3 fill-red-500 text-red-500" /> {post.likes_count}</span>
                        <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <Link to="/feed" className="text-primary hover:underline font-bold">Ver no Feed</Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;