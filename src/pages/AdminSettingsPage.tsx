"use client";

import React, { useState } from 'react';
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
  Mail,
  Save,
  ShieldAlert,
  Database
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminSettingsPage = () => {
  const { userProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      showSuccess('Configurações salvas com sucesso!');
      setSaving(false);
    }, 1000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie as preferências globais e segurança do portal.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="general" className="rounded-lg gap-2">
              <Globe className="h-4 w-4" /> Geral
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg gap-2">
              <Bell className="h-4 w-4" /> Notificações
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg gap-2">
              <Lock className="h-4 w-4" /> Segurança
            </TabsTrigger>
            <TabsTrigger value="appearance" className="rounded-lg gap-2">
              <Palette className="h-4 w-4" /> Aparência
            </TabsTrigger>
          </TabsList>

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
                    <Input id="school-name" defaultValue="CIEP 165 Brigadeiro Sérgio Carvalho" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-email">E-mail de Contato</Label>
                    <Input id="school-email" defaultValue="contato@ciep165.edu.br" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-phone">Telefone</Label>
                    <Input id="school-phone" defaultValue="(21) 0000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school-address">Endereço</Label>
                    <Input id="school-address" defaultValue="Rua Exemplo, 123 - Rio de Janeiro" />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Funcionalidades Ativas</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Matrículas Online</Label>
                        <p className="text-sm text-muted-foreground">Permitir que novos alunos se cadastrem sozinhos.</p>
                      </div>
                      <Switch defaultChecked />
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
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Alertas de Reserva</Label>
                      <p className="text-sm text-muted-foreground">Notificar professores sobre reservas confirmadas.</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Lembretes de Aula</Label>
                      <p className="text-sm text-muted-foreground">Enviar lembretes 15 minutos antes do início da aula.</p>
                    </div>
                    <Switch />
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
                      <Label>Autenticação de Dois Fatores (2FA)</Label>
                      <p className="text-sm text-muted-foreground">Exigir 2FA para administradores e professores.</p>
                    </div>
                    <Switch />
                  </div>
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