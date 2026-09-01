-- =========================================================
-- Dummy auth.users rows for MVP SQL demos
-- =========================================================
-- WARNING:
-- This is ONLY for local/MVP demos if your Neon DB does NOT already
-- have Supabase-style `auth.users`.
--
-- In Supabase, `auth.users` is managed by Supabase auth system and has
-- many required columns/triggers. On Neon, you typically WON'T have that
-- schema unless you've created it.
--
-- Use this script only if your Neon DB already contains `auth.users`
-- table with columns compatible with the inserts below.
--
-- If you do NOT have `auth.users`, the correct approach is:
--   - create your own custom auth tables for Path B, OR
--   - migrate Supabase auth schema into Neon (non-trivial).
-- =========================================================

BEGIN;

-- Replace with real user IDs you want to use for reading inserts.
-- This must match the entered_by values used in your readings seed.

-- Create minimal dummy rows (adjust columns if your auth.users schema differs).
-- Common Supabase auth.users columns include: id, email, encrypted_password,
-- email_confirmed_at, created_at, raw_user_meta_data, app_metadata, role.

-- If auth.users doesn't exist, this will error; stop there.

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  raw_user_meta_data,
  app_metadata
)
VALUES
  (
    '00000000-0000-0000-0000-00000000aaaa',
    'mvp-admin@example.com',
    'dummy_hash',
    now(),
    now(),
    '{"full_name":"Admin MVP","role":"admin"}'::jsonb,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-00000000bbbb',
    'mvp-miner@example.com',
    'dummy_hash',
    now(),
    now(),
    '{"full_name":"Miner MVP","role":"miner"}'::jsonb,
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

COMMIT;

