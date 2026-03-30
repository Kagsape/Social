import React from 'react';
import Layout from '@/components/Layout';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, HelpCircle, MessageCircle, Mail, Phone, ExternalLink } from 'lucide-react';

const faqs = [
  {
    question: "Como faço para reservar um computador?",
    answer: "Para reservar um computador, acesse a página de 'Laboratório' no menu lateral (se você for aluno) ou no painel de administração. Lá você verá o mapa do laboratório e poderá clicar em uma máquina livre para fazer sua reserva."
  },
  {
    question: "Esqueci minha senha, o que fazer?",
    answer: "Na página de login, clique em 'Esqueci minha senha'. Você receberá um e-mail com as instruções para redefinir sua senha. Se não receber o e-mail, procure o administrador do laboratório."
  },
  {
    question: "Como posso postar meus projetos na galeria?",
    answer: "Vá até a página de 'Projetos' e clique no botão 'Postar Projeto'. Preencha o título, descrição e adicione as tags relevantes. Seu projeto ficará visível para toda a comunidade do CIEP 165."
  },
  {
    question: "Quais são os horários de funcionamento do laboratório?",
    answer: "O laboratório de informática funciona de segunda a sexta-feira, das 08:00 às 17:00. Durante o período noturno, o acesso é restrito a turmas específicas de cursos técnicos."
  },
  {
    question: "Como ganho pontos no ranking?",
    answer: "Você ganha pontos ao concluir cursos, participar de eventos presenciais, postar projetos na galeria e interagir com outros alunos no feed de notícias."
  },
  {
    question: "Posso usar o laboratório para projetos pessoais?",
    answer: "Sim, desde que haja máquinas disponíveis e você tenha feito a reserva prévia. Projetos de estudo e desenvolvimento pessoal são incentivados!"
  }
];

const Help = () => {
  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Central de Ajuda</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para as dúvidas mais comuns ou entre em contato com nossa equipe de suporte.
          </p>
          
          <div className="max-w-xl mx-auto mt-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por ajuda..." 
              className="pl-10 h-12 rounded-full border-muted-foreground/20 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* FAQ Section */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border rounded-xl px-4 bg-card shadow-sm">
                  <AccordionTrigger className="hover:no-underline font-medium text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Section */}
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-2xl font-bold mb-6">Ainda precisa de ajuda?</h2>
            
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Suporte via Chat
                </CardTitle>
                <CardDescription>
                  Fale com um monitor em tempo real durante o horário de aula.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full rounded-full">Iniciar Chat</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outros Canais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-muted rounded-lg">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">E-mail</p>
                    <p className="text-muted-foreground">suporte@ciep165.edu.br</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-muted rounded-lg">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Telefone</p>
                    <p className="text-muted-foreground">(21) 1234-5678</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-2 bg-muted rounded-lg">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">Redes Sociais</p>
                    <p className="text-muted-foreground">@ciep165_oficial</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Help;
