"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Loader2, CheckCircle2, LogOut } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CompleteProfile = () => {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState('');
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    const isChiefAdmin = user?.email === 'xakatosh66@gmail.com';
    if (isChiefAdmin || (userProfile && (userProfile.student_id || userProfile.teacher_id))) {
      navigate('/feed');
    }
  }, [user, userProfile, navigate]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !registrationId.trim()) return;

    setLoading(true);
    const cleanId = registrationId.trim();

    try {
      const { data: whitelistEntry, error: whitelistError } = await supabase
        .from('registration_whitelist')
        .select('*')
        .eq('registration_id', cleanId)
        .maybeSingle();

      if (whitelistError) {
        console.error('Erro Whitelist:', whitelistError);
        throw new Error('Erro ao validar matrícula. Verifique as políticas de segurança do banco.');
      }

      if (!whitelistEntry) {
        throw new Error(`O ID "${cleanId}" não está na lista de autorizados.`);
      }

      if (whitelistEntry.role !== role) {
        const cargoCorreto = whitelistEntry.role === 'student' ? 'ALUNO' : 'PROFESSOR';
        throw new Error(`Este ID está autorizado apenas para o cargo de ${cargoCorreto}.`);
      }

      const idColumn = role === 'student' ? 'student_id' : 'teacher_id';
      
      const { error: updateError } = await supabase
        .from('users')
        .update({
          [idColumn]: cleanId,
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await supabase.auth.updateUser({
        data: { 
          role: role,
          [idColumn]: cleanId 
        }
      });

      showSuccess('Cadastro concluído!');
      await refreshProfile();
      navigate('/feed');
      
    } catch (error: any) {
      showError(error.message || 'Erro ao concluir cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md border-none shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-3 rounded-2xl">
              <ShieldAlert className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Conclua seu Cadastro</CardTitle>
          <CardDescription>
            Valide sua matrícula no CIEP 165 para acessar o portal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleComplete} className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de Conta</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Aluno</SelectItem>
                  <SelectItem value="teacher">Professor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg_id">Número de Matrícula / ID</Label>
              <Input
                id="reg_id"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="Digite seu ID autorizado"
                className="rounded-xl font-mono"
                required
              />
            </div>

            <div className="space-y-3">
              <Button type="submit" className="w-full rounded-xl h-12 font-bold" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Validar e Acessar
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full text-muted-foreground"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4 mr-2" /> Sair da conta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfile;