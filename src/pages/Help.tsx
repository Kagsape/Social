"use client";

import React from 'react';
import Layout from '@/components/Layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HelpCircle, MessageCircle, Mail, Phone } from 'lucide-react';

const Help = () => {
  const faqs = [
    {
      question: "Como faço para me matricular em um curso?",
      answer: "Basta acessar a página de Cursos, escolher o que mais te interessa e clicar no botão 'Matricular-se Agora'. Você precisa estar logado para isso."
    },
    {
      question: "Como reservo um computador no laboratório?",
      answer: "No seu Dashboard de Aluno, existe um formulário de reserva. Escolha o computador disponível, a data e o horário desejado."
    },
    {
      question: "Esqueci minha senha, o que fazer?",
      answer: "Na página de login, clique em 'Esqueci minha senha' ou procure o professor responsável na Sala de Informática para resetar seu acesso."
    },
    {
      question: "Posso usar o laboratório fora do horário de aula?",
      answer: "Sim, desde que haja um professor presente e você tenha feito a reserva prévia do computador pelo portal."
    },
    {
      question: "Como ganho pontos no ranking?",
      answer: "Você ganha pontos ao concluir cursos, participar de eventos, postar projetos na galeria e interagir de forma positiva no feed da comunidade."
    }
  ];

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
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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