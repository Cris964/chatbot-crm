-- 1. Actualizar tabla de Órdenes (Ventas)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sale_type VARCHAR(50) DEFAULT 'Digital',
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- 2. Actualizar tabla de Citas
ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS department VARCHAR(50) DEFAULT 'Trazzos';

-- 3. Cambiar rol de Crearte a Admin para visión global
UPDATE public.team_members 
SET role = 'admin' 
WHERE email = 'crearte@trazzos.com';

-- 4. Crear Storage Bucket para facturas (Usando la API de storage.buckets de Supabase)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('invoices', 'invoices', true, 5242880, '{"image/jpeg","image/jpg","image/png","application/pdf"}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para invoices
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'invoices' );

CREATE POLICY "Authenticated Insert" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'invoices' );

CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'invoices' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'invoices' );
