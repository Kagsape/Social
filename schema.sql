-- Habilitar RLS na tabela de posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa autenticada pode ver os posts
CREATE POLICY "Anyone can view posts" 
ON posts FOR SELECT 
USING (true);

-- Política: Usuários autenticados podem criar seus próprios posts
CREATE POLICY "Authenticated users can create posts" 
ON posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar seus próprios posts
CREATE POLICY "Users can update their own posts" 
ON posts FOR UPDATE 
USING (auth.uid() = user_id);

-- Política: Usuários podem deletar seus próprios posts
CREATE POLICY "Users can delete their own posts" 
ON posts FOR DELETE 
USING (auth.uid() = user_id);

-- Política: Administradores podem deletar qualquer post
CREATE POLICY "Admins can delete any post" 
ON posts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);