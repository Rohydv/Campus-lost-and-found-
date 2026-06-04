-- ============================================================
-- Campus Lost & Found Portal — Supabase SQL Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  avatar_url  TEXT,
  student_id  TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('lost', 'found')),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  category       TEXT NOT NULL CHECK (category IN (
                   'electronics', 'clothing', 'accessories', 'documents',
                   'keys', 'bags', 'books', 'sports', 'other'
                 )),
  location       TEXT NOT NULL,
  date_occurred  DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  image_url      TEXT,
  contact_email  TEXT NOT NULL,
  contact_phone  TEXT,
  is_anonymous   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  sender_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id      UUID NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  claimant_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_items_type      ON public.items(type);
CREATE INDEX IF NOT EXISTS idx_items_status    ON public.items(status);
CREATE INDEX IF NOT EXISTS idx_items_category  ON public.items(category);
CREATE INDEX IF NOT EXISTS idx_items_user_id   ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_created   ON public.items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_item     ON public.messages(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_item       ON public.claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant   ON public.claims(claimant_id);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at on items
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile when new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    'student'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims   ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
-- Anyone can read profiles (needed for item reporter display)
CREATE POLICY "profiles_select_all"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (created via trigger, but allow direct too)
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---- ITEMS ----
-- Anyone can read active items; owners and admins can read all statuses
CREATE POLICY "items_select_active"
  ON public.items FOR SELECT
  USING (
    status = 'active'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can create items
CREATE POLICY "items_insert_authenticated"
  ON public.items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only item owner or admin can update
CREATE POLICY "items_update_owner_or_admin"
  ON public.items FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only item owner or admin can delete
CREATE POLICY "items_delete_owner_or_admin"
  ON public.items FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- MESSAGES ----
-- Users can only see messages they sent or received
CREATE POLICY "messages_select_participants"
  ON public.messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() = receiver_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can send messages
CREATE POLICY "messages_insert_sender"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Only receiver can mark as read
CREATE POLICY "messages_update_read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- ---- CLAIMS ----
-- Claimants can see their own claims; item owners can see claims on their items; admins see all
CREATE POLICY "claims_select"
  ON public.claims FOR SELECT
  USING (
    auth.uid() = claimant_id
    OR EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.item_id AND items.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can submit claims
CREATE POLICY "claims_insert"
  ON public.claims FOR INSERT
  WITH CHECK (auth.uid() = claimant_id);

-- Item owners can approve/reject claims; admins can too
CREATE POLICY "claims_update_owner_or_admin"
  ON public.claims FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.items
      WHERE items.id = claims.item_id AND items.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

-- Create the item-images bucket (run after enabling Storage)
INSERT INTO storage.buckets (id, name, public)
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "storage_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'item-images'
    AND auth.role() = 'authenticated'
  );

-- Allow public read of item images
CREATE POLICY "storage_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'item-images');

-- Allow owners to delete their own images
CREATE POLICY "storage_delete_owner"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'item-images'
    AND auth.uid() = owner
  );
