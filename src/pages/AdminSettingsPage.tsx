"use client";

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Settings, 
  Bell, 
  Lock, 
  Globe, 
  Palette, 
  Save,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettingsPage = () => {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [allowEnrollment, setAllowEnrollment] = useState(true);
  const [schoolName, setSchoolName] = useState('CIEP 165 Brigadeiro Sérgio Carvalho');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*');
      
      if (error) throw error;
      
      if (data) {
        const enrollment = data.find(s => s.key === 'allow_online_enrollment');
        const name = data.find(s => s.key === 'school_name');
        
        if (enrollment) setAllowEnrollment(enrollment.value === true);
        if (name) setSchoolName(name.value as string);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: 'allow_online_enrollment', value: allowEnrollment, updated_at: new Date().toISOString() },
        { key: 'school_name', value: schoolName, updated_at: new Date().toISOString() }
      ];

      const { error } = await supabase
        .from('settings')
        .upsert(updates);

      if (error) throw error;
      showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      showError('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie as preferências globais e segurança do portal.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <div className="w-full overflow-x-auto pb-1 scrollbar-hide">
            <TabsList className="bg-muted/50 p-1 rounded-xl inline-flex min-w-full md:min-w-0">
              <TabsTrigger value="general" className="rounded-lg gap-2 whitespace-nowrap">
                <Globe className="h-4 w-4" /> Geral
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-lg gap-2 whitespace-nowrap">
                <Bell className="h-4 w-4" /> Notificações
              </TabsTrigger>
              <TabsTrigger value="security" className="rounded-lg gap-2 whitespace-nowrap">
                <Lock className="h-4 w-4" /> Segurança
              </TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-lg gap-2 whitespace-nowrap">
                <Palette className="h-4 w-4" /> Aparência
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="general">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Informações da Instituição</CardTitle>
                <CardDescription>Configure os dados básicos do CIEP 165.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="school-name">Nome da Instituição</Label>
                    <Input 
                      id="school-name" 
                      value={schoolName} 
                      onChange={(e) => setSchoolName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-email">E-mail de Contato</Label>
                    <Input id="school-email" defaultValue="contato@ciep165.edu.br" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Funcionalidades Ativas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Matrículas Online</Label>
                        <p className="text-sm text-muted-foreground">Permitir que novos alunos se cadastrem sozinhos nos cursos.</p>
                      </div>
                      <Switch 
                        checked={allowEnrollment} 
                        onCheckedChange={setAllowEnrollment} 
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Reservas de Laboratório</Label>
                        <p className="text-sm text-muted-foreground">Habilitar o sistema de agendamento de computadores.</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Configurações de Notificação</CardTitle>
                <CardDescription>Escolha como o sistema deve alertar os usuários.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-mails de Boas-vindas</Label>
                      <p className="text-sm text-muted-foreground">Enviar e-mail automático para novos usuários.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle>Segurança e Acesso</CardTitle>
                <CardDescription>Controle as políticas de acesso ao sistema.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Logs de Atividade</Label>
                      <p className="text-sm text-muted-foreground">Registrar todas as ações administrativas.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
                
                <Separator />
                
                <div className="pt-4">
                  <Button variant="destructive" className="gap-2">
                    <ShieldAlert className="h-4 w-4" /> Resetar Todas as Senhas
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancelar</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSettingsPage;