-- Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Posts do Feed
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Curtidas (Opcional)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
CREATE POLICY "Leitura pública de usuários" ON public.users FOR SELECT USING (true);
CREATE POLICY "Usuários editam próprio perfil" ON public.users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Leitura pública de posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Usuários autenticados postam" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários deletam próprios posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);