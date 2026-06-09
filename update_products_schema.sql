-- Script to add image_url to the products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS image_url TEXT;
