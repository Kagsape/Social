-- 1. Criar tabela de cargos (se não existir)
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de junção para múltiplos cargos
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, role_id)
);

-- 3. Inserir cargos padrão
INSERT INTO roles (name) VALUES ('student'), ('teacher'), ('admin')
ON CONFLICT (name) DO NOTHING;

-- 4. Função para verificar se o usuário é ADMIN
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Função genérica para verificar qualquer cargo
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.name = role_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Exemplo de RLS na tabela COURSES usando as novas funções
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Política: Admin tem acesso total
CREATE POLICY "Admins possuem acesso total em cursos" 
ON courses FOR ALL 
USING (is_admin());

-- Política: Professores podem criar
CREATE POLICY "Professores podem criar cursos" 
ON courses FOR INSERT 
WITH CHECK (has_role('teacher'));

-- Política: Professores podem editar seus cursos
CREATE POLICY "Professores editam seus próprios cursos" 
ON courses FOR UPDATE 
USING (
    created_by = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM course_teachers 
        WHERE course_id = id AND teacher_id = auth.uid()
    )
);

-- Política: Todos podem ver
CREATE POLICY "Cursos visíveis para todos" 
ON courses FOR SELECT 
USING (true);