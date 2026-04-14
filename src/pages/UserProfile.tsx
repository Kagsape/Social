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
  MapPin,
  UserPlus,
  UserMinus,
  Clock,
  Hash
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import { cn } from "@/lib/utils";

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, userProfile: currentUserProfile } = useAuth();
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [stats, setStats] = useState({ posts: 0, likesReceived: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfile(profileData);

        const { data: postsData } = await supabase
          .from('posts')
          .select(`
            id, content, image_url, created_at,
            likes (user_id)
          `)
          .eq('user_id', id)
          .order('created_at', { ascending: false });

        const processedPosts = (postsData || []).map(post => ({
          ...post,
          likes_count: post.likes?.length || 0
        }));
        
        setPosts(processedPosts);

        const { count: followersCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', id);

        const { count: followingCount } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', id);

        if (currentUser && currentUser.id !== id) {
          const { data: followData } = await supabase
            .from('follows')
            .select('*')
            .eq('follower_id', currentUser.id)
            .eq('following_id', id)
            .maybeSingle();
          
          setIsFollowing(!!followData);
        }

        const totalLikes = processedPosts.reduce((acc, post) => acc + post.likes_count, 0);
        setStats({
          posts: processedPosts.length,
          likesReceived: totalLikes,
          followers: followersCount || 0,
          following: followingCount || 0
        });

      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();

    const channel = supabase
      .channel(`profile-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${id}`
      }, (payload) => {
        setProfile(payload.new);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, currentUser]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUser.id)
          .eq('following_id', id);
        
        setIsFollowing(false);
        setStats(prev => ({ ...prev, followers: prev.followers - 1 }));
        showSuccess(`Você deixou de seguir ${profile.name}`);
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUser.id,
            following_id: id
          });
        
        await supabase.from('notifications').insert({
          user_id: id,
          actor_id: currentUser.id,
          type: 'follow',
          message: `${currentUserProfile?.name} começou a te seguir.`
        });

        setIsFollowing(true);
        setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
        showSuccess(`Agora você segue ${profile.name}`);
      }
    } catch (error) {
      showError('Erro ao processar ação.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setChatLoading(true);
    try {
      const { data: existingParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', currentUser.id);
      
      const convIds = (existingParticipants || []).map(p => p.conversation_id);

      if (convIds.length > 0) {
        const { data: commonConv } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .in('conversation_id', convIds)
          .eq('user_id', id)
          .maybeSingle();
        
        if (commonConv) {
          navigate('/messages');
          return;
        }
      }

      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({})
        .select()
        .single();
      
      if (convError) throw convError;

      await supabase.from('conversation_participants').insert([
        { conversation_id: newConv.id, user_id: currentUser.id },
        { conversation_id: newConv.id, user_id: id }
      ]);

      navigate('/messages');
    } catch (error) {
      console.error('Erro ao iniciar chat:', error);
      showError('Erro ao iniciar conversa.');
    } finally {
      setChatLoading(false);
    }
  };

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
  const canSeeRegistrationId = isOwnProfile || currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'teacher';

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 mb-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-48 bg-gradient-to-r from-primary via-indigo-600 to-blue-500"></div>
          <CardContent className="relative pt-0 pb-8">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 px-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-2xl">
                  <AvatarImage src={profile.avatar_url} />
                  <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                    {profile.name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {profile.is_online && (
                  <span className="absolute bottom-2 right-2 h-6 w-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" />
                )}
              </div>
              
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
                  
                  {canSeeRegistrationId && (profile.student_id || profile.teacher_id) && (
                    <span className="flex items-center gap-1 font-mono font-bold text-primary">
                      <Hash className="h-4 w-4" /> ID: {profile.student_id || profile.teacher_id}
                    </span>
                  )}

                  {profile.location && (
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {profile.location}</span>
                  )}
                  {profile.is_online ? (
                    <span className="flex items-center gap-1 text-green-600 font-bold"><span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" /> Online agora</span>
                  ) : (
                    profile.last_seen && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Visto {formatDistanceToNow(new Date(profile.last_seen), { addSuffix: true, locale: ptBR })}</span>
                  )}
                  <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Desde {format(new Date(profile.created_at), "MMM yyyy", { locale: ptBR })}</span>
                </div>
              </div>

              <div className="flex gap-2 mb-2">
                {isOwnProfile ? (
                  <Link to="/profile">
                    <Button variant="outline" className="gap-2 rounded-full">
                      <Edit3 className="h-4 w-4" /> Editar Perfil
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      className="gap-2 rounded-full"
                      onClick={handleStartChat}
                      disabled={chatLoading}
                    >
                      {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                      Mensagem
                    </Button>
                    <Button 
                      variant={isFollowing ? "outline" : "default"} 
                      className={cn("gap-2 rounded-full px-6", isFollowing && "text-destructive hover:bg-destructive/10")}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                    >
                      {followLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        isFollowing ? <><UserMinus className="h-4 w-4" /> Deixar de Seguir</> : <><UserPlus className="h-4 w-4" /> Seguir</>
                      )}
                    </Button>
                  </>
                )}
              </div>
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
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p className="text-2xl font-bold">{stats.followers}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Seguidores</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-center">
                  <p className="text-2xl font-bold">{stats.following}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold">Seguindo</p>
                </div>
              </CardContent>
            </Card>
          </div>

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
                    {post.content && (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    )}
                    
                    {post.image_url && (
                      <div className="rounded-xl overflow-hidden border bg-muted/30">
                        <img 
                          src={post.image_url} 
                          alt="Post content" 
                          className="w-full h-auto max-h-[400px] object-contain mx-auto"
                          loading="lazy"
                        />
                      </div>
                    )}

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