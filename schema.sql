-- 1. Tabela de Usuários (Profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'student' REFERENCES public.roles(name),
  avatar_url TEXT,
  student_id TEXT UNIQUE, -- Matrícula para alunos
  teacher_id TEXT UNIQUE, -- Registro para professores
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Cursos
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  category TEXT,
  teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Matrículas (Enrollments)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- 4. Tabela de Posts (Feed)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Curtidas (Likes)
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- 6. Tabela de Comentários (Comments)
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Tabela de Notificações (Notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Computadores do Laboratório
CREATE TABLE IF NOT EXISTS public.lab_computers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'working' CHECK (status IN ('working', 'broken', 'maintenance')),
  specs JSONB,
  last_maintained TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Tabela de Uso/Reserva do Laboratório
CREATE TABLE IF NOT EXISTS public.lab_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computer_id UUID REFERENCES public.lab_computers(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  purpose TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Tabela de Frequência (Attendance)
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  recorded_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, date)
);

-- 11. Tabela de Notas (Grades)
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.users(id),
  assignment_name TEXT NOT NULL,
  grade NUMERIC(5,2) NOT NULL,
  max_grade NUMERIC(5,2) DEFAULT 100,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, course_id, assignment_name)
);

-- 12. Tabela de Avisos (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_global BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Tabela de Cargos (Roles)
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir cargos padrão
INSERT INTO public.roles (name, permissions) VALUES
('admin', '{"delete_any_post": true, "manage_users": true, "manage_roles": true, "manage_system": true}'),
('teacher', '{"delete_any_post": false, "manage_users": false, "manage_roles": false, "manage_system": false}'),
('student', '{"delete_any_post": false, "manage_users": false, "manage_roles": false, "manage_system": false}')
ON CONFLICT (name) DO NOTHING;

-- Habilitar Row Level Security (RLS) em todas as tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_computers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança Básicas (Exemplos)
CREATE POLICY "Leitura pública de usuários" ON public.users FOR SELECT USING (true);
CREATE POLICY "Leitura pública de posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Leitura pública de comentários" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Leitura pública de curtidas" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Leitura pública de cargos" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Apenas Chief Admin gerencia cargos" ON public.roles FOR ALL USING (
  auth.jwt() ->> 'email' = 'xakatosh66@gmail.com'
);

CREATE POLICY "Usuários veem suas próprias notificações" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários atualizam suas próprias notificações" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Políticas de Inserção (Apenas usuários autenticados)
CREATE POLICY "Usuários autenticados criam posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários autenticados curtem posts" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários autenticados comentam posts" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);