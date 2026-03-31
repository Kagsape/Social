"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { User, Camera, Save, LogOut, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setAvatarUrl(userProfile.avatar_url || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Usamos upsert para garantir que o registro seja criado se não existir
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          name: name.trim(),
          avatar_url: avatarUrl.trim(),
          email: user.email, // Mantém o email obrigatório
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      await refreshProfile();
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      showError(error.message || 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const focusAvatarInput = () => {
    avatarInputRef.current?.focus();
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e como os outros te veem.</p>
        </div>

        <Card className="border-none shadow-lg overflow-hidden bg-white dark:bg-slate-900">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col items-center -mt-16 space-y-4">
              <div className="relative group" onClick={focusAvatarInput}>
                <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-xl cursor-pointer">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="text-white h-8 w-8" />
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-2xl font-bold">{name || 'Usuário'}</h2>
                <p className="text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-10 rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="avatar">URL da Foto de Perfil</Label>
                  <div className="relative">
                    <Camera className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="avatar"
                      ref={avatarInputRef}
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      className="pl-10 rounded-xl"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Insira o link de uma imagem para usar como avatar.</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="flex-1 gap-2 rounded-xl h-12 font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 gap-2 rounded-xl h-12 text-destructive hover:bg-destructive/10"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4" />
                  Sair da Conta
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;