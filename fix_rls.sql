-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Asegurarnos que la tabla leads permite inserts del Webhook (anon)
CREATE POLICY "Allow public insert leads" ON leads FOR INSERT TO anon WITH CHECK (true);

-- 2. Asegurarnos que la tabla orders permite inserts del Webhook (anon)
CREATE POLICY "Allow public insert orders" ON orders FOR INSERT TO anon WITH CHECK (true);

-- 3. Por precaución, si la columna 'status' es requerida en leads, le damos un valor por defecto
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'active';

-- 4. Lo mismo para conversations por si acaso
CREATE POLICY "Allow public update conversations" ON conversations FOR UPDATE TO anon USING (true) WITH CHECK (true);
