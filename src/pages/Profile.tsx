"use client";

import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { User, Camera, Save, LogOut, ShieldCheck } from 'lucide-react';

const Profile = () => {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);

  const MASTER_EMAIL = 'xakatosh66@gmail.com';

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
      const { error } = await supabase
        .from('users')
        .update({
          name,
          avatar_url: avatarUrl,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      showSuccess('Perfil atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      showError(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const makeMeAdmin = async () => {
    if (!user) return;
    setPromoting(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      showSuccess('Agora você é um Administrador!');
    } catch (error: any) {
      showError('Erro ao promover cargo.');
    } finally {
      setPromoting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">Gerencie suas informações e permissões.</p>
          </div>
          {userProfile?.role !== 'admin' && user?.email === MASTER_EMAIL && (
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2 border-primary text-primary hover:bg-primary/10"
              onClick={makeMeAdmin}
              disabled={promoting}
            >
              <ShieldCheck className="h-4 w-4" />
              {promoting ? 'Promovendo...' : 'Ser Administrador'}
            </Button>
          )}
        </div>

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
          <CardContent className="relative pt-0">
            <div className="flex flex-col items-center -mt-16 space-y-4">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-900 shadow-xl">
                  <AvatarImage src={avatarUrl} />
                  <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                    {name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
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
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="pl-10"
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
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://exemplo.com/sua-foto.jpg"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button type="submit" className="flex-1 gap-2" disabled={loading}>
                  <Save className="h-4 w-4" />
                  {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="flex-1 gap-2 text-destructive hover:bg-destructive/10"
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