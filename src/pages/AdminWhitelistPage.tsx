"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Search, 
  Loader2, 
  GraduationCap, 
  User,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminWhitelistPage = () => {
  const [whitelist, setWhitelist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tableExists, setTableExists] = useState(true);

  // Form state
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'teacher'>('student');

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registration_whitelist')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST204' || error.code === '42P01') {
          setTableExists(false);
        }
        throw error;
      }
      
      setWhitelist(data || []);
      setTableExists(true);
    } catch (error) {
      console.error('Erro ao buscar whitelist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('registration_whitelist')
        .insert({
          registration_id: newId.trim(),
          name: newName.trim(),
          role: newRole
        });

      if (error) throw error;

      showSuccess(`${newName} autorizado com sucesso.`);
      setNewId('');
      setNewName('');
      fetchWhitelist();
    } catch (error: any) {
      showError(error.message || 'Erro ao adicionar à lista.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Remover este ID da lista de autorizados?')) return;

    try {
      const { error } = await supabase
        .from('registration_whitelist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      showSuccess('ID removido.');
      fetchWhitelist();
    } catch (error) {
      showError('Erro ao remover ID.');
    }
  };

  const filteredList = whitelist.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.registration_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!tableExists) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 p-8 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-3xl">
          <AlertTriangle className="h-12 w-12 text-amber-500" />
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Tabela não encontrada</h2>
            <p className="text-muted-foreground max-w-md">
              A tabela <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">registration_whitelist</code> ainda não foi criada no seu banco de dados Supabase.
            </p>
          </div>
          <Button onClick={fetchWhitelist} variant="outline">Tentar Novamente</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lista Branca de Matrículas</h1>
          <p className="text-muted-foreground">Autorize alunos e professores a criarem contas no sistema.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="border-none shadow-sm h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Autorizar Novo ID
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg_id">Número de Matrícula / ID</Label>
                  <Input 
                    id="reg_id" 
                    value={newId} 
                    onChange={(e) => setNewId(e.target.value)} 
                    placeholder="Ex: 2024001" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg_name">Nome do Aluno/Professor</Label>
                  <Input 
                    id="reg_name" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    placeholder="Nome completo" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Aluno</SelectItem>
                      <SelectItem value="teacher">Professor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Autorizar Acesso
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar na lista de autorizados..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Card className="border-none shadow-sm">
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  </div>
                ) : filteredList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Nenhum ID autorizado encontrado.
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredList.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/5 rounded-lg">
                            {item.role === 'student' ? <GraduationCap className="h-5 w-5 text-blue-600" /> : <User className="h-5 w-5 text-purple-600" />}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-muted-foreground">ID: {item.registration_id}</span>
                              <Badge variant="outline" className="text-[10px] h-4 px-1 capitalize">{item.role}</Badge>
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteEntry(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWhitelistPage;