"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const PERMISSIONS = [
  { id: 'delete_any_post', label: 'Excluir Qualquer Post', description: 'Permite excluir posts de outros usuários no feed.' },
  { id: 'manage_users', label: 'Gerenciar Usuários', description: 'Permite visualizar, editar e excluir usuários.' },
  { id: 'manage_roles', label: 'Gerenciar Cargos', description: 'Permite criar e editar cargos e permissões.' },
  { id: 'manage_system', label: 'Gerenciar Sistema', description: 'Acesso total às configurações críticas do sistema.' },
];

const AdminRolesPage = () => {
  const { userProfile } = useAuth();
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleName, setRoleName] = useState('');
  const [rolePermissions, setRolePermissions] = useState<Record<string, boolean>>({});

  const isChiefAdmin = userProfile?.email === 'xakatosh66@gmail.com';

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      showError('Erro ao carregar cargos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleOpenDialog = (role: any = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRolePermissions(role.permissions || {});
    } else {
      setEditingRole(null);
      setRoleName('');
      setRolePermissions(
        PERMISSIONS.reduce((acc, p) => ({ ...acc, [p.id]: false }), {})
      );
    }
    setIsDialogOpen(true);
  };

  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      showError('O nome do cargo é obrigatório');
      return;
    }

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('roles')
          .update({
            name: roleName,
            permissions: rolePermissions
          })
          .eq('id', editingRole.id);
        
        if (error) throw error;
        showSuccess('Cargo atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('roles')
          .insert({
            name: roleName,
            permissions: rolePermissions
          });
        
        if (error) throw error;
        showSuccess('Cargo criado com sucesso');
      }
      
      setIsDialogOpen(false);
      fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      showError(error.message || 'Erro ao salvar cargo');
    }
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (['admin', 'teacher', 'student'].includes(name)) {
      showError('Cargos do sistema não podem ser excluídos');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o cargo "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      showSuccess('Cargo excluído com sucesso');
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      showError('Erro ao excluir cargo. Verifique se existem usuários vinculados a este cargo.');
    }
  };

  const togglePermission = (permissionId: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [permissionId]: !prev[permissionId]
    }));
  };

  if (!isChiefAdmin) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <Shield className="h-16 w-16 text-destructive opacity-20" />
          <h2 className="text-2xl font-bold">Acesso Restrito</h2>
          <p className="text-muted-foreground text-center max-w-md">
            Apenas o Administrador Chefe tem permissão para gerenciar cargos e permissões do sistema.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cargos e Permissões</h1>
            <p className="text-muted-foreground">Defina o que cada nível de acesso pode fazer no sistema.</p>
          </div>
          <Button className="gap-2" onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" /> Novo Cargo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-20 bg-muted/50" />
                <CardContent className="h-40" />
              </Card>
            ))
          ) : roles.map((role) => (
            <Card key={role.id} className="border-none shadow-sm hover:shadow-md transition-all">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {Object.values(role.permissions || {}).filter(Boolean).length} Permissões
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(role)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {!['admin', 'teacher', 'student'].includes(role.name) && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRole(role.id, role.name)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {PERMISSIONS.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{p.label}</span>
                      {role.permissions?.[p.id] ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRole ? 'Editar Cargo' : 'Novo Cargo'}</DialogTitle>
              <DialogDescription>
                Configure o nome e as permissões para este cargo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Cargo</Label>
                <Input 
                  id="name" 
                  value={roleName} 
                  onChange={(e) => setRoleName(e.target.value.toLowerCase())}
                  placeholder="ex: moderador"
                  disabled={['admin', 'teacher', 'student'].includes(editingRole?.name)}
                />
                {['admin', 'teacher', 'student'].includes(editingRole?.name) && (
                  <p className="text-[10px] text-muted-foreground italic">
                    Cargos do sistema não podem ter o nome alterado.
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <Label>Permissões</Label>
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  {PERMISSIONS.map((p) => (
                    <div key={p.id} className="flex items-start justify-between gap-4">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">{p.label}</Label>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                      <Switch 
                        checked={!!rolePermissions[p.id]} 
                        onCheckedChange={() => togglePermission(p.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveRole} className="gap-2">
                <Save className="h-4 w-4" /> Salvar Cargo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminRolesPage;