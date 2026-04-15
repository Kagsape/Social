-- 1. Relatórios de Aula (Públicos para alunos do curso)
CREATE TABLE IF NOT EXISTS lesson_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  slides_url text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id)
);

-- 2. Notas Internas (Apenas Professores e Admins)
CREATE TABLE IF NOT EXISTS lesson_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lesson_reports(id) ON DELETE CASCADE,
  teachers_present text[], -- Nomes dos professores
  students_helped text[],  -- Nomes dos alunos que ajudaram
  students_disrupted text[], -- Nomes dos alunos que atrapalharam
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 3. Tabela de Professores por Curso (Múltiplos professores)
CREATE TABLE IF NOT EXISTS course_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(course_id, teacher_id)
);

-- 4. Ficha do Aluno (Relatórios individuais)
CREATE TABLE IF NOT EXISTS student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES users(id),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE lesson_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS RLS

-- Lesson Reports: Alunos veem todos, Professores gerenciam
CREATE POLICY "Anyone authenticated can view lesson reports" 
ON lesson_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers can manage lesson reports" 
ON lesson_reports FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- Internal Notes: Apenas Professores e Admins veem e gerenciam
CREATE POLICY "Teachers can manage internal notes" 
ON lesson_internal_notes FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- Student Reports: Alunos veem os seus, Professores gerenciam todos
CREATE POLICY "Students can view their own reports" 
ON student_reports FOR SELECT TO authenticated 
USING (student_id = auth.uid());

CREATE POLICY "Teachers can manage student reports" 
ON student_reports FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin')));

-- Course Teachers: Leitura pública, escrita Admin
CREATE POLICY "Public read course teachers" ON course_teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage course teachers" ON course_teachers FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));