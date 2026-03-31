"use client";

import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { User, Camera, Save, LogOut, Loader2, MapPin, FileText } from 'lucide-react';

const Profile = () => {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setAvatarUrl(userProfile.avatar_url || '');
      setBio(userProfile.bio || '');
      setLocation(userProfile.location || '');
    }
  }, [userProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Criamos o objeto de atualização dinamicamente para evitar erros de colunas inexistentes
      const updateData: any = {
        name: name.trim(),
        avatar_url: avatarUrl.trim(),
        updated_at: new Date().toISOString(),
      };

      // Só adicionamos bio e location se eles existirem no perfil (ou após você rodar o SQL)
      if (userProfile && 'bio' in userProfile) updateData.bio = bio.trim();
      if (userProfile && 'location' in userProfile) updateData.location = location.trim();

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      showError(error.message || 'Erro ao atualizar perfil. Verifique se as colunas existem no banco de dados.');
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
          <p className="text-muted-foreground">Gerencie suas informações e presença na comunidade.</p>
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
                <div className="flex items-center justify-center gap-2">
                  <p className="text-muted-foreground">{user?.email}</p>
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {userProfile?.role || 'student'}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="location">Localização</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="location" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        placeholder="Ex: Rio de Janeiro, RJ" 
                        className="pl-10 rounded-xl" 
                      />
                    </div>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                      id="bio" 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      placeholder="Conte um pouco sobre você..." 
                      className="pl-10 min-h-[100px] rounded-xl" 
                    />
                  </div>
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