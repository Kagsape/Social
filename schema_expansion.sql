-- 1. Ajustar a tabela courses para incluir created_by
ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- 2. Criar tabela de junção para múltiplos professores
CREATE TABLE IF NOT EXISTS course_teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(course_id, teacher_id)
);

-- 3. Habilitar RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers ENABLE ROW LEVEL SECURITY;

-- 4. Políticas para a tabela COURSES
-- Qualquer um pode ver os cursos
CREATE POLICY "Cursos são visíveis para todos" 
ON courses FOR SELECT USING (true);

-- Apenas professores podem criar cursos
CREATE POLICY "Professores podem criar cursos" 
ON courses FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id = auth.uid() AND role = 'teacher'
    )
);

-- Apenas o criador ou professores vinculados podem editar
CREATE POLICY "Criadores ou professores vinculados podem editar" 
ON courses FOR UPDATE 
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM course_teachers 
        WHERE course_id = id AND teacher_id = auth.uid()
    )
);

-- 5. Políticas para a tabela COURSE_TEACHERS
-- Professores podem ver seus vínculos
CREATE POLICY "Professores veem seus próprios vínculos" 
ON course_teachers FOR SELECT 
USING (teacher_id = auth.uid() OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- O criador do curso pode adicionar outros professores
CREATE POLICY "Criadores podem gerenciar professores do curso" 
ON course_teachers FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM courses 
        WHERE id = course_id AND created_by = auth.uid()
    )
);