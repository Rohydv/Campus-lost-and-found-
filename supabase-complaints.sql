-- ============================================================
-- SCHEMA: Create complaints table and set up RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' or 'resolved'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- 1. Select Policy: Students can view their own complaints; admins can view all complaints
CREATE POLICY "complaints_select"
  ON public.complaints FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Insert Policy: Authenticated users can insert their own complaints
CREATE POLICY "complaints_insert"
  ON public.complaints FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Update Policy: Only admins can update complaints (e.g., mark them as resolved)
CREATE POLICY "complaints_update_admin"
  ON public.complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 4. Delete Policy: Only admins can delete complaints
CREATE POLICY "complaints_delete_admin"
  ON public.complaints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
