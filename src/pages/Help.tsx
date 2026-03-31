"use client";

import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Mail, Phone, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Help = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
          <p className="text-muted-foreground">Tire suas dúvidas e aprenda a usar todas as ferramentas do portal.</p>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Perguntas Frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma pergunta frequente cadastrada.
              </div>
            ) : (
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, i) => (
                  <AccordionItem key={faq.id} value={`item-${i}`}>
                    <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl">
            <MessageCircle className="h-5 w-5 text-primary" />
            <span>Chat Online</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl">
            <Mail className="h-5 w-5 text-primary" />
            <span>E-mail</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 rounded-2xl">
            <Phone className="h-5 w-5 text-primary" />
            <span>Telefone</span>
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Help;