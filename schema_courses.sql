-- Script para configuração da tabela de cursos e políticas de segurança

-- Garantir que a tabela existe
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'Geral',
  image_url TEXT,
  duration TEXT,
  teacher_id UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes para evitar o erro "already exists"
DROP POLICY IF EXISTS "Cursos são públicos para usuários autenticados" ON courses;
DROP POLICY IF EXISTS "Professores podem criar cursos" ON courses;
DROP POLICY IF EXISTS "Criadores podem editar seus cursos" ON courses;
DROP POLICY IF EXISTS "Admins podem tudo nos cursos" ON courses;

-- 1. Todos os usuários autenticados podem ver os cursos
CREATE POLICY "Cursos são públicos para usuários autenticados"
ON courses FOR SELECT
TO authenticated
USING (true);

-- 2. Professores e Admins podem criar cursos
CREATE POLICY "Professores podem criar cursos"
ON courses FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  )
);

-- 3. Criadores podem editar seus próprios cursos
CREATE POLICY "Criadores podem editar seus cursos"
ON courses FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR auth.uid() = teacher_id)
WITH CHECK (auth.uid() = created_by OR auth.uid() = teacher_id);

-- 4. Admins têm controle total
CREATE POLICY "Admins podem tudo nos cursos"
ON courses FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  )
);