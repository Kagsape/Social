-- Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Permitir visualização para todos" ON inventory_items;
DROP POLICY IF EXISTS "Apenas Admin insere itens" ON inventory_items;
DROP POLICY IF EXISTS "Admin e Professor atualizam itens" ON inventory_items;
DROP POLICY IF EXISTS "Apenas Admin deleta itens" ON inventory_items;

-- 1. SELECT: Permitir que QUALQUER usuário autenticado veja os itens
CREATE POLICY "Visualização global autenticada" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. INSERT: Permitir Admin e Professor
CREATE POLICY "Admin e Professor inserem itens" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'teacher')
    )
  );

-- 3. UPDATE: Permitir Admin e Professor
CREATE POLICY "Admin e Professor editam itens" ON inventory_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR role = 'teacher')
    )
  );

-- 4. DELETE: Apenas Admin
CREATE POLICY "Apenas Admin remove itens" ON inventory_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );