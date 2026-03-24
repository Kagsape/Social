"use client";

import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Heart, Share2, Image as ImageIcon, Send, Code2 } from 'lucide-react';

const PostCard = ({ author, content, time, likes, comments, avatar }: any) => (
  <Card className="mb-6 border-none shadow-sm bg-white dark:bg-slate-900">
    <CardHeader className="flex flex-row items-center gap-4 p-4">
      <Avatar>
        <AvatarImage src={avatar} />
        <AvatarFallback>{author[0]}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="font-bold text-sm">{author}</span>
        <span className="text-xs text-muted-foreground">{time}</span>
      </div>
    </CardHeader>
    <CardContent className="p-4 pt-0">
      <p className="text-sm leading-relaxed mb-4">{content}</p>
      <div className="flex items-center gap-6 pt-4 border-t">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-red-500 transition-colors">
          <Heart className="h-4 w-4" /> {likes}
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-blue-500 transition-colors">
          <MessageSquare className="h-4 w-4" /> {comments}
        </button>
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-green-500 transition-colors">
          <Share2 className="h-4 w-4" /> Compartilhar
        </button>
      </div>
    </CardContent>
  </Card>
);

const Feed = () => {
  const posts = [
    {
      author: "Ana Tech",
      content: "Pessoal, acabei de publicar um artigo sobre as novidades do React 19! O que vocês estão mais ansiosos para testar? 🚀 #reactjs #webdev",
      time: "há 2 horas",
      likes: 42,
      comments: 12,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60"
    },
    {
      author: "Marcos Dev",
      content: "Dica do dia: Sempre use TypeScript em projetos de grande escala. A produtividade e a segurança que ele traz compensam qualquer tempo extra de configuração inicial. 💻",
      time: "há 5 horas",
      likes: 128,
      comments: 24,
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&auto=format&fit=crop&q=60"
    }
  ];

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar - Profile Summary */}
        <div className="hidden lg:block space-y-6">
          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
            <div className="px-4 pb-4 -mt-10 text-center">
              <Avatar className="w-20 h-20 border-4 border-white mx-auto mb-3">
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <h3 className="font-bold text-lg">Seu Nome</h3>
              <p className="text-xs text-muted-foreground mb-4">Aluno CIEP 165</p>
              <div className="grid grid-cols-2 gap-4 py-4 border-t">
                <div>
                  <p className="font-bold text-sm">1.2k</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Seguidores</p>
                </div>
                <div>
                  <p className="font-bold text-sm">450</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Seguindo</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-none shadow-sm">
            <h4 className="font-bold text-sm mb-4">Trending Topics</h4>
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
          <Card className="p-4 border-none shadow-sm bg-white dark:bg-slate-900">
            <div className="flex gap-4 mb-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Textarea 
                placeholder="No que você está trabalhando hoje?" 
                className="min-h-[80px] bg-muted/30 border-none focus-visible:ring-1 resize-none"
              />
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ImageIcon className="h-4 w-4 mr-2" /> Foto
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <Code2 className="h-4 w-4 mr-2" /> Snippet
                </Button>
              </div>
              <Button size="sm" className="rounded-full px-6">
                <Send className="h-4 w-4 mr-2" /> Postar
              </Button>
            </div>
          </Card>

          {/* Posts List */}
          <div className="space-y-6">
            {posts.map((post, index) => (
              <PostCard key={index} {...post} />
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Feed;