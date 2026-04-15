"use client";

import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { FileUp, Loader2, X } from 'lucide-react';

interface LessonReportFormProps {
  courseId: string;
  onSuccess?: () => void;
}

const LessonReportForm: React.FC<LessonReportFormProps> = ({ courseId, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return null;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `slides/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const slidesUrl = await handleUpload();

      const { error } = await supabase
        .from('lesson_reports')
        .insert({
          course_id: courseId,
          title,
          content,
          slides_url: slidesUrl,
          created_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      showSuccess('Relatório de aula publicado!');
      setTitle('');
      setContent('');
      setFile(null);
      onSuccess?.();
    } catch (error: any) {
      showError(error.message || 'Erro ao publicar aula.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Novo Relatório de Aula</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Aula</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Introdução a Algoritmos" required />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo / Resumo</Label>
            <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="O que foi visto hoje?" rows={4} />
          </div>
          <div className="space-y-2">
            <Label>Slides ou Material (PDF/PPT)</Label>
            <div 
              className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div className="flex items-center justify-between bg-primary/5 p-2 rounded-lg">
                  <span className="text-xs truncate max-w-[200px]">{file.name}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-muted-foreground">
                  <FileUp className="h-6 w-6 opacity-50" />
                  <span className="text-xs">Clique para anexar material</span>
                </div>
              )}
            </div>
            <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </div>
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Publicar Aula
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LessonReportForm;