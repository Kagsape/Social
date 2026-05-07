"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { showSuccess, showError } from '@/utils/toast';
import { 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  X, 
  Calendar, 
  History,
  BookOpen,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data: projectData } = await supabase
        .from('projects')
        .select('*, users(name, avatar_url)')
        .eq('id', id)
        .single();
      
      setProject(projectData);

      const { data: updatesData } = await supabase
        .from('project_updates')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      setUpdates(updatesData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim() || !user) return;

    setSubmitting(true);
    try {
      let imageUrl = null;
      if (imageFile) {
        const fileName = `${Math.random()}.${imageFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(`project_logs/${fileName}`, imageFile);
        if (uploadError) throw uploadError;
        imageUrl = supabase.storage.from('uploads').getPublicUrl(`project_logs/${fileName}`).data.publicUrl;
      }

      const { error } = await supabase
        .from('project_updates')
        .insert({
          project_id: id,
          content: newUpdate.trim(),
          image_url: imageUrl
        });

      if (error) throw error;

      showSuccess('Parte do projeto lançada!');
      setNewUpdate('');
      setImageFile(null);
      setImagePreview(null);
      fetchData();
    } catch (error) {
      showError('Erro ao salvar atualização.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteUpdate = async (updateId: string) => {
    if (!confirm('Excluir esta parte do diário?')) return;
    try {
      await supabase.from('project_updates').delete().eq('id', updateId);
      setUpdates(prev => prev.filter(u => u.id !== updateId));
      showSuccess('Removido.');
    } catch (error) {
      showError('Erro ao excluir.');
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10" /></div></Layout>;
  if (!project) return <Layout><div className="text-center py-20">Projeto não encontrado.</div></Layout>;

  const isOwner = user?.id === project.user_id;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate('/projects')} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar para Projetos
        </Button>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <Badge variant="secondary">Diário de Projeto</Badge>
              <h1 className="text-4xl font-black tracking-tight">{project.title}</h1>
              <div className="flex items-center gap-3 pt-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={project.users?.avatar_url} />
                  <AvatarFallback>{project.users?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">por {project.users?.name}</span>
              </div>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {project.description}
            </p>
          </div>
          {project.image_url && (
            <div className="w-full md:w-72 aspect-video rounded-2xl overflow-hidden shadow-lg border">
              <img src={project.image_url} alt="Capa" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8 border-t">
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Linha do Tempo
            </h2>

            {isOwner && (
              <Card className="border-none shadow-md bg-primary/5 border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider">O que você fez hoje?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Descreva o progresso, desafios ou novas ideias..." 
                    value={newUpdate}
                    onChange={(e) => setNewUpdate(e.target.value)}
                    className="bg-white dark:bg-slate-900 rounded-xl border-none shadow-inner"
                    rows={3}
                  />
                  {imagePreview && (
                    <div className="relative w-fit">
                      <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg border" />
                      <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setImagePreview(null); setImageFile(null); }}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={() => fileInputRef.current?.click()}>
                      <ImageIcon className="h-4 w-4" /> Adicionar Foto
                    </Button>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                    <Button onClick={handleAddUpdate} disabled={submitting || !newUpdate.trim()} className="rounded-full px-6">
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                      Lançar no Diário
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-12 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
              {updates.length === 0 ? (
                <div className="pl-12 py-8 text-muted-foreground italic">
                  Nenhuma atualização lançada ainda.
                </div>
              ) : (
                updates.map((update, index) => (
                  <div key={update.id} className="relative pl-12 animate-in fade-in slide-in-from-left-4">
                    <div className="absolute left-0 top-1 h-8 w-8 rounded-full bg-white dark:bg-slate-900 border-2 border-primary flex items-center justify-center z-10">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(update.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                        </div>
                        {isOwner && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteUpdate(update.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Card className="border-none shadow-sm overflow-hidden">
                        <CardContent className="p-6 space-y-4">
                          <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {update.content}
                          </p>
                          {update.image_url && (
                            <div className="rounded-xl overflow-hidden border bg-muted/30">
                              <img src={update.image_url} alt="Update" className="w-full h-auto max-h-[400px] object-contain mx-auto" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-slate-50 dark:bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-lg">Sobre o Autor</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  <AvatarImage src={project.users?.avatar_url} />
                  <AvatarFallback>{project.users?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{project.users?.name}</h4>
                  <p className="text-xs text-muted-foreground">Aluno do CIEP 165</p>
                </div>
                <Button variant="outline" className="w-full rounded-xl" onClick={() => navigate(`/profile/${project.user_id}`)}>
                  Ver Perfil
                </Button>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atualizações</span>
                  <span className="font-bold">{updates.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Iniciado em</span>
                  <span className="font-bold">{format(new Date(project.created_at), "dd/MM/yy")}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProjectDetails;