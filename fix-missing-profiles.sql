-- ============================================================
-- Run this in Supabase SQL Editor to fix missing profiles
-- for users who registered before the schema was set up
-- ============================================================

-- This inserts a profile row for any auth user who doesn't have one yet
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
  'student'
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Verify: shows all profiles now in the table
SELECT id, email, full_name, role, created_at FROM public.profiles;
