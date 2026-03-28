"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ArrowLeft, Mail, Calendar, Shield, GraduationCap, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Erro ao buscar perfil:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'teacher': return <BookOpen className="h-4 w-4" />;
      default: return <GraduationCap className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-40 bg-gradient-to-r from-primary/80 to-indigo-600/80"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col items-center -mt-20 space-y-4">
              <Avatar className="h-40 w-40 border-4 border-white dark:border-slate-900 shadow-2xl">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-5xl bg-primary text-primary-foreground">
                  {profile.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold">{profile.name}</h1>
                <div className="flex flex-wrap justify-center gap-2">
                  <Badge variant="secondary" className="gap-1.5 py-1 px-3">
                    {getRoleIcon(profile.role)}
                    <span className="capitalize">{profile.role === 'student' ? 'Aluno' : profile.role === 'teacher' ? 'Professor' : 'Admin'}</span>
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md pt-6">
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Mail className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm font-medium truncate">{profile.email || 'Não informado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <p className="text-xs text-muted-foreground">Membro desde</p>
                    <p className="text-sm font-medium">
                      {profile.created_at ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Sobre</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Este usuário faz parte da comunidade do CIEP 165.
              </p>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">Nenhuma atividade pública recente para mostrar.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;