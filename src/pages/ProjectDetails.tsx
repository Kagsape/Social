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
  Trash2,
  PlayCircle,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import ProjectUpdateComments from '@/components/ProjectUpdateComments';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newUpdate, setNewUpdate] = useState('');
  const [activeComments, setActiveComments] = useState<Record<string, boolean>>({});
  
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File, preview: string, type: 'image' | 'video' }>>([]);
  
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

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('video/') ? 'video' as const : 'image' as const
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleAddUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.trim() || !user) return;

    setSubmitting(true);
    try {
      const mediaUrls: string[] = [];

      for (const item of selectedFiles) {
        const fileExt = item.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const folder = item.type === 'video' ? 'project_videos' : 'project_logs';
        
        const { error: uploadError } = await supabase.storage
          .from('uploads')
          .upload(`${folder}/${fileName}`, item.file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(`${folder}/${fileName}`);
        mediaUrls.push(publicUrl);
      }

      const { error } = await supabase
        .from('project_updates')
        .insert({
          project_id: id,
          content: newUpdate.trim(),
          media_urls: mediaUrls,
          image_url: mediaUrls.length > 0 ? mediaUrls[0] : null
        });

      if (error) throw error;

      showSuccess('Progresso registrado com sucesso!');
      setNewUpdate('');
      setSelectedFiles([]);
      fetchData();
    } catch (error: any) {
      showError(error.message || 'Erro ao salvar atualização.');
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

  const isVideoUrl = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext)) || url.includes('project_videos');
  };

  const toggleComments = (updateId: string) => {
    setActiveComments(prev => ({
      ...prev,
      [updateId]: !prev[updateId]
    }));
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
            <div className="w-full md:w-72 rounded-2xl overflow-hidden shadow-lg border bg-slate-100 dark:bg-slate-800">
              <img 
                src={project.image_url} 
                alt="Capa" 
                className="w-full h-auto max-h-64 object-contain mx-auto" 
              />
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
                  
                  {selectedFiles.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {selectedFiles.map((item, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden bg-muted">
                          {item.type === 'video' ? (
                            <div className="w-full h-full flex items-center justify-center bg-black">
                              <PlayCircle className="h-6 w-6 text-white/50" />
                            </div>
                          ) : (
                            <img src={item.preview} alt="Preview" className="w-full h-full object-contain bg-slate-200 dark:bg-slate-800" />
                          )}
                          <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-5 w-5 rounded-full shadow-lg" 
                            onClick={() => removeSelectedFile(idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="gap-2 rounded-full" onClick={() => fileInputRef.current?.click()}>
                        <ImageIcon className="h-4 w-4" /> Adicionar Mídia
                      </Button>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*,video/*" 
                      multiple
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleMediaSelect} 
                    />
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
                updates.map((update) => {
                  const mediaList = (update.media_urls && update.media_urls.length > 0) 
                    ? update.media_urls 
                    : (update.image_url ? [update.image_url] : []);

                  return (
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
                            
                            {mediaList.length > 0 && (
                              <div className={cn(
                                "grid gap-2 rounded-xl overflow-hidden",
                                mediaList.length === 1 ? "grid-cols-1" : 
                                mediaList.length === 2 ? "grid-cols-2" : 
                                "grid-cols-2 md:grid-cols-3"
                              )}>
                                {mediaList.map((url: string, i: number) => (
                                  <div key={i} className={cn(
                                    "relative bg-slate-100 dark:bg-slate-800/50 border overflow-hidden",
                                    mediaList.length === 1 ? "min-h-[200px]" : "aspect-square"
                                  )}>
                                    {isVideoUrl(url) ? (
                                      <video 
                                        src={url} 
                                        controls 
                                        className="w-full h-full object-contain bg-black"
                                      />
                                    ) : (
                                      <img 
                                        src={url} 
                                        alt={`Update ${i}`} 
                                        className={cn(
                                          "w-full mx-auto object-contain",
                                          mediaList.length === 1 ? "h-auto max-h-[600px]" : "h-full"
                                        )}
                                        loading="lazy"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="pt-4 border-t flex items-center gap-4">
                              <button 
                                onClick={() => toggleComments(update.id)}
                                className={cn(
                                  "flex items-center gap-2 text-xs font-bold transition-colors",
                                  activeComments[update.id] ? "text-primary" : "text-muted-foreground hover:text-primary"
                                )}
                              >
                                <MessageSquare className="h-4 w-4" />
                                {activeComments[update.id] ? 'Ocultar Comentários' : 'Comentar'}
                              </button>
                            </div>

                            {activeComments[update.id] && (
                              <ProjectUpdateComments 
                                updateId={update.id} 
                                canPin={isOwner || isAdmin} 
                              />
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })
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