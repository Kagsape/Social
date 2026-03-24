"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementFormProps {
  courseId?: string;
  onAnnouncementCreated?: () => void;
}

const AnnouncementForm: React.FC<AnnouncementFormProps> = ({ courseId, onAnnouncementCreated }) => {
  const { user, userProfile } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGlobal, setIsGlobal] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userProfile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title,
          content,
          author_id: user.id,
          course_id: courseId,
          is_global: isGlobal,
          expires_at: expiresAt?.toISOString()
        });

      if (error) throw error;

      showSuccess('Aviso publicado com sucesso!');
      setTitle('');
      setContent('');
      setIsGlobal(false);
      setExpiresAt(undefined);
      onAnnouncementCreated?.();
    } catch (error) {
      console.error('Error creating announcement:', error);
      showError('Erro ao publicar aviso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar Novo Aviso</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do aviso"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Digite o conteúdo do aviso..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Expiração (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expiresAt ? format(expiresAt, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="global"
              checked={isGlobal}
              onCheckedChange={setIsGlobal}
            />
            <Label htmlFor="global">Aviso Global (para todos os cursos)</Label>
          </div>

          <Button type="submit" disabled={saving || !title.trim() || !content.trim()} className="w-full">
            {saving ? 'Publicando...' : 'Publicar Aviso'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AnnouncementForm;