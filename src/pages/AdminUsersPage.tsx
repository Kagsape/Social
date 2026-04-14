"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  UserPlus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield, 
  User, 
  GraduationCap,
  Mail,
  Filter,
  Hash
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const AdminUsersPage = () => {
  const { userProfile } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Role change state
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [updatingRole, setUpdatingRole] = useState(false);

  const isChiefAdmin = userProfile?.email === 'xakatosh66@gmail.com';

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase.from('roles').select('name').order('name');
      if (error) throw error;
      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('users').select('*').order('name');
      
      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, [roleFilter]);

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>;
      case 'teacher':
        return <Badge variant="default" className="gap-1"><User className="h-3 w-3" /> Professor</Badge>;
      case 'student':
        return <Badge variant="secondary" className="gap-1"><GraduationCap className="h-3 w-3" /> Aluno</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{role}</Badge>;
    }
  };

  const handleOpenRoleDialog = (user: any) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    
    setUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', selectedUser.id);

      if (error) throw error;
      
      showSuccess(`Cargo de ${selectedUser.name} atualizado para ${newRole}`);
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      showError(error.message || 'Erro ao atualizar cargo');
    } finally {
      setUpdatingRole(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) throw error;
      showSuccess('Usuário removido com sucesso');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Erro ao remover usuário');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
            <p className="text-muted-foreground">Gerencie alunos, professores e administradores do sistema.</p>
          </div>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" /> Novo Usuário
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, e-mail ou matrícula..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Cargos</SelectItem>
                    <SelectItem value="admin">Administradores</SelectItem>
                    <SelectItem value="teacher">Professores</SelectItem>
                    <SelectItem value="student">Alunos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Nenhum usuário encontrado.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Usuário</th>
                      <th className="px-4 py-3">Matrícula</th>
                      <th className="px-4 py-3">Cargo</th>
                      <th className="px-4 py-3">E-mail</th>
                      <th className="px-4 py-3 rounded-r-lg text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {user.student_id ? (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono">{user.student_id}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-4 py-4 text-muted-foreground">{user.email}</td>
                        <td className="px-4 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="gap-2" onClick={() => handleOpenRoleDialog(user)}>
                                <Shield className="h-4 w-4" /> Alterar Cargo
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2">
                                <Edit className="h-4 w-4" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={() => deleteUser(user.id)}>
                                <Trash2 className="h-4 w-4" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Change Dialog */}
        <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Alterar Cargo</DialogTitle>
              <DialogDescription>
                Selecione o novo cargo para <strong>{selectedUser?.name}</strong>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="role">Cargo</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.name} value={role.name}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleUpdateRole} disabled={updatingRole}>
                {updatingRole ? 'Atualizando...' : 'Salvar Alteração'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsersPage;