-- Tabela de Cursos
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'Geral',
    code TEXT UNIQUE,
    image_url TEXT,
    duration TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) -- Campo para compatibilidade com queries existentes
);

-- Tabela de Vínculo Professor-Curso (Muitos para Muitos)
CREATE TABLE IF NOT EXISTS public.course_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, teacher_id)
);

-- Habilitar RLS
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_teachers ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA COURSES
-- 1. Professores podem criar cursos
CREATE POLICY "Teachers can create courses" ON public.courses
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher')
    );

-- 2. Professores podem ver e editar seus próprios cursos
CREATE POLICY "Teachers can manage their own courses" ON public.courses
    FOR ALL USING (
        created_by = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.course_teachers WHERE course_id = courses.id AND teacher_id = auth.uid())
    );

-- 3. Alunos podem ver cursos onde estão matriculados
CREATE POLICY "Students can view enrolled courses" ON public.courses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.enrollments WHERE course_id = courses.id AND student_id = auth.uid())
    );

-- POLÍTICAS PARA COURSE_TEACHERS
CREATE POLICY "Teachers can link themselves to courses" ON public.course_teachers
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can view their links" ON public.course_teachers
    FOR SELECT USING (teacher_id = auth.uid());