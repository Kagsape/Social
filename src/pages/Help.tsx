"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
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
  ArrowRight,
  LifeBuoy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Help = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { data, error } = await supabase
          .from('faqs')
          .select('*')
          .order('created_at', { ascending: true });
        
        if (error) throw error;
        setFaqs(data || []);
      } catch (error) {
        console.error('Erro ao buscar FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-12 pb-12">
        <div className="text-center space-y-6 py-8">
          <div className="inline-flex p-4 bg-primary/10 rounded-3xl mb-2">
            <LifeBuoy className="h-10 w-10 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">Como podemos ajudar?</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Encontre respostas reais para suas dúvidas ou entre em contato com nossa equipe.
          </p>
          
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Busque por dúvidas frequentes..." 
              className="pl-12 h-12 rounded-2xl shadow-sm border-none bg-white dark:bg-slate-900 text-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2 px-2">
              <BookOpen className="h-6 w-6 text-primary" />
              Perguntas Frequentes
            </h2>

            <Card className="border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                  </div>
                ) : filteredFaqs.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/20" />
                    <p className="text-muted-foreground">Nenhuma informação encontrada no banco de dados.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq, i) => (
                      <AccordionItem key={faq.id} value={`item-${i}`} className="border-b last:border-0">
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

          <div className="space-y-6">
            <h2 className="text-2xl font-bold px-2">Suporte Direto</h2>
            <div className="grid grid-cols-1 gap-4">
              <a href="mailto:apropriacaomanutencao@gmail.com">
                <Card className="border-none shadow-sm hover:shadow-md transition-all group cursor-pointer bg-white dark:bg-slate-900">
                  <CardContent className="p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <Mail className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold">E-mail</h4>
                      <p className="text-xs text-muted-foreground">Suporte Oficial</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
                  </CardContent>
                </Card>
              </a>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;