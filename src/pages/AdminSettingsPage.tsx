"use client";

import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Settings, Bell, Lock, Globe, Palette, Mail } from 'lucide-react';

const AdminSettingsPage = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    siteName: 'CIEP 165 Brigadeiro Sérgio Carvalho',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    announcement: ''
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // In a real implementation, you would save these to a settings table
      // For now, we'll just show a success message
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showSuccess('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
          <p className="text-muted-foreground">Gerencie as configurações globais da plataforma.</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Configurações Gerais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Nome do Site</Label>
                <Input
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="announcement">Aviso Global (Banner)</Label>
                <Input
                  id="announcement"
                  value={settings.announcement}
                  onChange={(e) => setSettings({...settings, announcement: e.target.value})}
                  placeholder="Ex: Matrículas abertas para Robótica!"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenanceMode">Modo Manutenção</Label>
                  <p className="text-sm text-muted-foreground">
                    Desativa o site para manutenção
                  </p>
                </div>
                <Switch
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allowRegistration">Permitir Cadastros</Label>
                  <p className="text-sm text-muted-foreground">
                    Permite que novos usuários se cadastrem
                  </p>
                </div>
                <Switch
                  id="allowRegistration"
                  checked={settings.allowRegistration}
                  onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notificações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Notificações por E-mail</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar e-mails sobre atualizações importantes
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Segurança
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Autenticação de Dois Fatores</Label>
                  <p className="text-sm text-muted-foreground">
                    Exigir 2FA para administradores
                  </p>
                </div>
                <Switch disabled />
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <Label>Sessão</Label>
                <div className="text-sm text-muted-foreground">
                  Tempo de sessão: 24 horas (configurável via Supabase)
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving} className="gap-2">
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default AdminSettingsPage;