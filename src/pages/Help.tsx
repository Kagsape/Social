"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  Loader2, 
  Search, 
  BookOpen, 
  ShieldAlert,
  ArrowRight,
  LifeBuoy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const STATIC_FAQS = [
  {
    question: "Como faço para reservar um computador?",
    answer: "Para reservar um computador, acesse seu Dashboard (se for aluno) ou o Painel do Professor. Lá você encontrará o formulário de reserva onde poderá escolher a máquina e o horário desejado."
  },
  {
    question: "Esqueci minha senha, o que fazer?",
    answer: "Na página de login, clique em 'Esqueci minha senha'. Você receberá um e-mail com as instruções para criar uma nova senha de acesso."
  },
  {
    question: "Como posso ver minhas notas?",
    answer: "Suas notas ficam disponíveis no seu Dashboard de Aluno, dentro da seção de cada curso em que você está matriculado."
  },
  {
    question: "O laboratório funciona em quais horários?",
    answer: "O laboratório de informática do CIEP 165 funciona de segunda a sexta, das 08:00 às 17:00, conforme a disponibilidade de monitores e professores."
  }
];

const Help = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableMissing, setTableMissing] = useState(false);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setFaqs(data || []);
      } catch (error: any) {
        console.error('Erro ao buscar FAQs:', error);
        if (error.code === 'PGRST205') {
          setTableMissing(true);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const displayFaqs = faqs.length > 0 ? faqs : STATIC_FAQS;
  
  const filteredFaqs = displayFaqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 py-8">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl mb-2">
            <LifeBuoy className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Como podemos ajudar?</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encontre respostas rápidas para suas dúvidas ou entre em contato com nossa equipe de suporte.
          </p>
          
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Busque por 'reserva', 'senha', 'notas'..." 
              className="pl-12 h-12 rounded-2xl shadow-sm border-none bg-white dark:bg-slate-900 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                Perguntas Frequentes
              </h2>
              {tableMissing && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 bg-amber-50">
                  Modo Offline
                </Badge>
              )}
            </div>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  </div>
                ) : filteredFaqs.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/20" />
                    <p className="text-muted-foreground">Nenhum resultado encontrado para sua busca.</p>
                    <Button variant="link" onClick={() => setSearchTerm('')}>Limpar busca</Button>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, i) => (
                      <AccordionItem key={i} value={`item-${i}`} className="border-b last:border-0">
                        <AccordionTrigger className="text-left font-bold py-4 hover:no-underline hover:text-primary transition-colors">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-slate-600 dark:text-slate-400 leading-relaxed pb-4">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Sidebar */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-2">Suporte Direto</h2>
            
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl text-green-600 group-hover:bg-green-600 group-hover:text-white transition-all">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">Chat Online</h4>
                    <p className="text-xs text-muted-foreground">Fale com um monitor agora</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">E-mail</h4>
                    <p className="text-xs text-muted-foreground">suporte@ciep165.edu.br</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-slate-900">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                    <Phone className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">Telefone</h4>
                    <p className="text-xs text-muted-foreground">(21) 0000-0000</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                </CardContent>
              </Card>
            </div>

            {tableMissing && (
              <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                <CardContent className="p-4 flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    <strong>Nota do Sistema:</strong> A tabela de FAQs não foi encontrada. Exibindo perguntas padrão do sistema.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;