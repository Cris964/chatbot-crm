-- ============================================================
-- NEXUS CRM MIGRATION: CONFIGURE STORAGE BUCKET FOR MEDIA
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Crear el bucket 'whatsapp_media' si no existe y hacerlo público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('whatsapp_media', 'whatsapp_media', true, 10485760, '{"image/*","audio/*","video/*"}')
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Eliminar políticas antiguas si existen para evitar duplicados
DROP POLICY IF EXISTS "Public Read whatsapp_media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert whatsapp_media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update whatsapp_media" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete whatsapp_media" ON storage.objects;

-- 3. Crear política para permitir la lectura pública de archivos en el bucket
CREATE POLICY "Public Read whatsapp_media" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'whatsapp_media' );

-- 4. Crear política para permitir la subida (insert) de archivos a usuarios autenticados
CREATE POLICY "Auth Insert whatsapp_media" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'whatsapp_media' );

-- 5. Crear política para permitir la actualización de archivos a usuarios autenticados
CREATE POLICY "Auth Update whatsapp_media" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'whatsapp_media' );

-- 6. Crear política para permitir la eliminación de archivos a usuarios autenticados
CREATE POLICY "Auth Delete whatsapp_media" 
ON storage.objects FOR DELETE 
TO authenticated 
USING ( bucket_id = 'whatsapp_media' );
