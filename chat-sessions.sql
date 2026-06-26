-- ============================================================
-- Chat Sessions Table for Token Optimization
-- Run this in the Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           TEXT UNIQUE NOT NULL,
  state                JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_summary TEXT DEFAULT '',
  current_stage        TEXT DEFAULT 'general',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at           TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public (anon/authenticated) to select/insert/update/delete their own chat sessions
-- Since chat sessions are identified by a unique client-generated session_id,
-- we allow all operations for anon and authenticated users.
DROP POLICY IF EXISTS "Allow public all on chat_sessions" ON public.chat_sessions;
CREATE POLICY "Allow public all on chat_sessions" ON public.chat_sessions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id ON public.chat_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_expires_at ON public.chat_sessions(expires_at);
