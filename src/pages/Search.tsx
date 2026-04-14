"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { Search as SearchIcon, Users, BookOpen, FolderKanban, Loader2 } from 'lucide-react';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    courses: any[];
    projects: any[];
  }>({ users: [], courses: [], projects: [] });

  useEffect(() => {
    if (!query.trim()) return;

    const performSearch = async () => {
      setLoading(true);
      try {
        const [usersRes, coursesRes, projectsRes] = await Promise.all([
          supabase.from('users').select('*').ilike('name', `%${query}%`).limit(5),
          supabase.from('courses').select('*').ilike('name', `%${query}%`).limit(5),
          supabase.from('projects').select('*, users(name)').ilike('title', `%${query}%`).limit(5)
        ]);

        setResults({
          users: usersRes.data || [],
          courses: coursesRes.data || [],
          projects: projectsRes.data || []
        });
      } catch (error) {
        console.error('Erro na busca:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query]);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <SearchIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Resultados para "{query}"</h1>
            <p className="text-muted-foreground">Encontramos o seguinte na comunidade.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="all">Tudo</TabsTrigger>
              <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Pessoas</TabsTrigger>
              <TabsTrigger value="courses" className="gap-2"><BookOpen className="h-4 w-4" /> Cursos</TabsTrigger>
              <TabsTrigger value="projects" className="gap-2"><FolderKanban className="h-4 w-4" /> Projetos</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8">
              {/* Seção de Pessoas */}
              {results.users.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Pessoas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {results.users.map(user => (
                      <Link key={user.id} to={`/profile/${user.id}`}>
                        <Card className="hover:bg-accent transition-colors border-none shadow-sm">
                          <CardContent className="p-4 flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-sm">{user.name}</p>
                              <Badge variant="outline" className="text-[10px] capitalize">{user.role}</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {/* Seção de Cursos */}
              {results.courses.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-lg font-bold flex items-center gap-2"><BookOpen className="h-5 w-5" /> Cursos</h2>
                  <div className="grid grid-cols-1 gap-3">
                    {results.courses.map(course => (
                      <Link key={course.id} to={`/courses/${course.id}`}>
                        <Card className="hover:bg-accent transition-colors border-none shadow-sm">
                          <CardContent className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-bold">{course.name}</p>
                              <p className="text-xs text-muted-foreground">{course.code}</p>
                            </div>
                            <Badge>{course.category}</Badge>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.users.length === 0 && results.courses.length === 0 && results.projects.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  Nenhum resultado encontrado para sua busca.
                </div>
              )}
            </TabsContent>
            
            {/* Outros TabsContent seriam similares filtrando apenas um tipo */}
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Search;