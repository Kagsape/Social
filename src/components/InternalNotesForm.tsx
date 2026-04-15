"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, Plus, X } from 'lucide-react';

interface InternalNotesFormProps {
  lessonId: string;
  onClose?: () => void;
}

const InternalNotesForm: React.FC<InternalNotesFormProps> = ({ lessonId, onClose }) => {
  const [notes, setNotes] = useState('');
  const [teachers, setTeachers] = useState<string[]>([]);
  const [helped, setHelped] = useState<string[]>([]);
  const [disrupted, setDisrupted] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExisting = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('lesson_internal_notes')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();
      
      if (data) {
        setNotes(data.notes || '');
        setTeachers(data.teachers_present || []);
        setHelped(data.students_helped || []);
        setDisrupted(data.students_disrupted || []);
      }
      setLoading(false);
    };
    fetchExisting();
  }, [lessonId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lesson_internal_notes')
        .upsert({
          lesson_id: lessonId,
          notes,
          teachers_present: teachers,
          students_helped: helped,
          students_disrupted: disrupted
        }, { onConflict: 'lesson_id' });

      if (error) throw error;
      showSuccess('Observações internas salvas.');
      onClose?.();
    } catch (error) {
      showError('Erro ao salvar observações.');
    } finally {
      setSaving(false);
    }
  };

  const ListInput = ({ label, items, setItems, placeholder }: any) => {
    const [val, setVal] = useState('');
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex gap-2">
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} onKeyDown={(e) => {
            if (e.key === 'Enter' && val.trim()) {
              e.preventDefault();
              setItems([...items, val.trim()]);
              setVal('');
            }
          }} />
          <Button type="button" size="icon" onClick={() => { if(val.trim()) { setItems([...items, val.trim()]); setVal(''); } }}><Plus className="h-4 w-4" /></Button>
        </div>
        <div className="flex flex-wrap gap-1">
          {items.map((item: string, i: number) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {item} <X className="h-3 w-3 cursor-pointer" onClick={() => setItems(items.filter((_: any, idx: number) => idx !== i))} />
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6 py-4">
      <ListInput label="Professores Presentes" items={teachers} setItems={setTeachers} placeholder="Nome do professor" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ListInput label="Alunos que Ajudaram" items={helped} setItems={setHelped} placeholder="Nome do aluno" />
        <ListInput label="Alunos que Atrapalharam" items={disrupted} setItems={setDisrupted} placeholder="Nome do aluno" />
      </div>
      <div className="space-y-2">
        <Label>Observações Pedagógicas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes sobre o comportamento da turma..." rows={4} />
      </div>
      <Button onClick={handleSave} className="w-full" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Observações'}
      </Button>
    </div>
  );
};

import { Badge } from "@/components/ui/badge";
export default InternalNotesForm;