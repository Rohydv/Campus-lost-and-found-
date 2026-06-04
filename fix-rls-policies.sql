-- ============================================================
-- FIX: Make active items visible to ALL users (logged in or not)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Drop existing items select policy and replace with a simpler one
DROP POLICY IF EXISTS "items_select_active" ON public.items;

-- New policy: active items are public to everyone, 
-- owners and admins can also see their non-active items
CREATE POLICY "items_select_public"
  ON public.items FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Also fix profiles — make sure the join works by allowing all profile reads
DROP POLICY IF EXISTS "profiles_select_all" ON public.profiles;
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Verify: check your items are visible
SELECT id, title, type, status, user_id FROM public.items ORDER BY created_at DESC;
