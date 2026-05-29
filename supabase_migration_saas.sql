-- ============================================================
-- NexusCRM SaaS Migration: Multi-Tenant Tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. TABLE: team_members
-- Links auth users to companies (clients) with roles
-- ============================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'vendedor',  -- admin, vendedor, soporte, marketing
  full_name TEXT,
  email TEXT,
  status TEXT DEFAULT 'activo',           -- activo, suspendido, invitado
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, client_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own memberships
CREATE POLICY "Users see own memberships" ON team_members
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users with admin role can manage team members in their company
CREATE POLICY "Admins manage team" ON team_members
  FOR ALL USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.client_id = team_members.client_id
        AND tm.role = 'admin'
    )
  );

-- 2. TABLE: products
-- Per-company product catalog / inventory for AI agent
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL DEFAULT 0,
  category TEXT,
  active BOOLEAN DEFAULT true,
  promo_text TEXT,            -- Active promotion text (e.g., "Free Casigua with purchase")
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Policy: Team members can read products of their company
CREATE POLICY "Team reads products" ON products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.client_id = products.client_id
    )
  );

-- Policy: Admins can manage products
CREATE POLICY "Admins manage products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.user_id = auth.uid()
        AND tm.client_id = products.client_id
        AND tm.role = 'admin'
    )
  );

-- 3. SEED: Link existing Naturel admin to team_members
-- Replace the user_id with your actual admin user UUID from auth.users
-- ============================================================
-- First, find the existing client and user_id
DO $$
DECLARE
  v_client_id UUID;
  v_user_id UUID;
  v_email TEXT;
BEGIN
  -- Get the Naturel client (or the first client)
  SELECT id, user_id INTO v_client_id, v_user_id
  FROM clients
  WHERE user_id IS NOT NULL
  LIMIT 1;

  IF v_client_id IS NOT NULL AND v_user_id IS NOT NULL THEN
    -- Get user email
    SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

    -- Insert into team_members if not already there
    INSERT INTO team_members (user_id, client_id, role, full_name, email, status)
    VALUES (v_user_id, v_client_id, 'admin', 'Super Admin', v_email, 'activo')
    ON CONFLICT (user_id, client_id) DO NOTHING;

    RAISE NOTICE 'Seeded team_member: user=%, client=%, email=%', v_user_id, v_client_id, v_email;
  ELSE
    RAISE NOTICE 'No existing client found with user_id. Manual seeding required.';
  END IF;
END $$;

-- 4. SEED: Migrate Naturel products into the products table
-- ============================================================
DO $$
DECLARE
  v_client_id UUID;
BEGIN
  SELECT id INTO v_client_id FROM clients WHERE name ILIKE '%naturel%' LIMIT 1;

  IF v_client_id IS NULL THEN
    SELECT id INTO v_client_id FROM clients LIMIT 1;
  END IF;

  IF v_client_id IS NOT NULL THEN
    INSERT INTO products (client_id, name, description, price, category, active, promo_text) VALUES
      (v_client_id, 'KOLOSAL', 'Limpieza profunda de colon, mejora digestión y estreñimiento', 0, 'Digestión', true, NULL),
      (v_client_id, 'MR. FIBRA VERDE', 'Fibra natural de linaza y psyllium para tránsito intestinal - Sabor Té Verde', 0, 'Digestión', true, 'Por la compra de MR. FIBRA VERDE, llévate GRATIS una CASIGUA'),
      (v_client_id, 'MR. FIBRA CIRUELA', 'Fibra natural de linaza y psyllium para tránsito intestinal - Sabor Ciruela', 0, 'Digestión', true, NULL),
      (v_client_id, 'BERENLIN', 'Antioxidante potente, ayuda a la salud de la piel y control de peso', 0, 'Salud General', true, NULL),
      (v_client_id, 'CIR/LAN', 'Mejora la circulación y depuración de la sangre', 0, 'Circulación', true, NULL),
      (v_client_id, 'BRIL-PROS', 'Salud de la próstata y sistema urinario', 0, 'Salud Masculina', true, NULL),
      (v_client_id, 'OXTMAX', 'Regenerador de cartílagos y salud articular', 0, 'Articulaciones', true, NULL),
      (v_client_id, '7 TOROS', 'Energizante natural y vigorizante', 0, 'Energía', true, NULL)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Seeded % products for client %', 8, v_client_id;
  END IF;
END $$;

-- Done! Verify with:
-- SELECT * FROM team_members;
-- SELECT * FROM products;
