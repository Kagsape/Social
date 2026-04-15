"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Loader2, ArrowLeft, History, Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StudentFilePage = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [newReport, setNewReport] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const { data: studentData } = await supabase
        .from('users')
        .select('*')
        .eq('id', studentId)
        .single();
      
      setStudent(studentData);

      const { data: reportsData } = await supabase
        .from('student_reports')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      
      setReports(reportsData || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const handleAddReport = async () => {
    if (!newReport.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_reports')
        .insert({
          student_id: studentId,
          teacher_id: (await supabase.auth.getUser()).data.user?.id,
          content: newReport.trim()
        });

      if (error) throw error;
      showSuccess('Anotação adicionada à ficha.');
      setNewReport('');
      fetchData();
    } catch (error) {
      showError('Erro ao salvar anotação.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10" /></div></Layout>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>

        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
            <AvatarImage src={student?.avatar_url} />
            <AvatarFallback className="text-2xl">{student?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{student?.name}</h1>
            <p className="text-muted-foreground">Matrícula: {student?.student_id}</p>
          </div>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Nova Anotação na Ficha
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              value={newReport} 
              onChange={(e) => setNewReport(e.target.value)} 
              placeholder="Descreva o desempenho, comportamento ou observações relevantes..." 
              rows={4}
            />
            <Button onClick={handleAddReport} disabled={saving || !newReport.trim()} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar na Ficha
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Histórico Pedagógico
          </h2>
          {reports.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Nenhum registro anterior.</p>
          ) : (
            reports.map(report => (
              <Card key={report.id} className="border-none shadow-sm">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase font-bold">
                    <span>Registrado em {format(new Date(report.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{report.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentFilePage;