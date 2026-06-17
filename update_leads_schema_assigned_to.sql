-- ============================================================
-- NEXUS CRM MIGRATION: ADD ASSIGNED_TO TO LEADS
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Add assigned_to column to leads referencing auth.users(id)
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
