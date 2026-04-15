-- Tabela de Itens do Inventário
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER NOT NULL DEFAULT 0,
  condition TEXT NOT NULL CHECK (condition IN ('bom', 'ruim', 'quebrado')),
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Logs de Movimentação
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'add', 'remove', 'update'
  quantity INTEGER,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para inventory_items
-- 1. Todos os usuários autenticados podem visualizar
CREATE POLICY "Permitir visualização para todos" ON inventory_items
  FOR SELECT USING (auth.role() = 'authenticated');

-- 2. Apenas Admin pode inserir novos itens
CREATE POLICY "Apenas Admin insere itens" ON inventory_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Admin e Professor podem atualizar itens
CREATE POLICY "Admin e Professor atualizam itens" ON inventory_items
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
  );

-- 4. Apenas Admin pode deletar itens
CREATE POLICY "Apenas Admin deleta itens" ON inventory_items
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Políticas para inventory_logs
CREATE POLICY "Visualizar logs" ON inventory_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Inserir logs" ON inventory_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);