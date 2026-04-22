-- =============================================================================
-- Astroid — Supabase schema
-- =============================================================================
--
-- Paste this whole file into Supabase Dashboard → SQL Editor → New query →
-- Run. The CREATE statements are idempotent (IF NOT EXISTS) so re-running is
-- safe. RLS policies are deny-by-default — only the service role bypasses
-- them, which is exactly what our server-side API uses.
--
-- After running this, also create a Storage bucket called `coloring`:
--   Storage → New bucket → name: coloring, public: ON, MIME whitelist:
--   image/png, image/jpeg, image/webp.

-- ---------------------------------------------------------------------------
-- Stars
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stars (
  designation       TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  dedication        TEXT,
  named_by          TEXT,
  named_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  claim_token       TEXT NOT NULL,
  status            TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  suspicious        BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX IF NOT EXISTS stars_status_idx ON public.stars (status);
CREATE INDEX IF NOT EXISTS stars_named_at_idx ON public.stars (named_at DESC);

-- ---------------------------------------------------------------------------
-- Wishes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishes (
  id          TEXT PRIMARY KEY,
  text        TEXT NOT NULL,
  from_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  status      TEXT NOT NULL CHECK (status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS wishes_status_idx ON public.wishes (status);
CREATE INDEX IF NOT EXISTS wishes_created_at_idx ON public.wishes (created_at DESC);

-- ---------------------------------------------------------------------------
-- Coloring submissions
-- imageUrl points at the public URL inside the `coloring` Storage bucket.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coloring_submissions (
  id             TEXT PRIMARY KEY,
  artist_name    TEXT NOT NULL,
  age            INTEGER,
  image_url      TEXT NOT NULL,
  width          INTEGER,
  height         INTEGER,
  storage_path   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL CHECK (status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS coloring_status_idx ON public.coloring_submissions (status);
CREATE INDEX IF NOT EXISTS coloring_created_at_idx ON public.coloring_submissions (created_at DESC);

-- ---------------------------------------------------------------------------
-- Charity nominations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.charity_nominations (
  id             TEXT PRIMARY KEY,
  charity_name   TEXT NOT NULL,
  country        TEXT,
  charity_url    TEXT,
  reason         TEXT,
  nominated_by   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL CHECK (status IN ('pending','approved','rejected'))
);
CREATE INDEX IF NOT EXISTS noms_status_idx ON public.charity_nominations (status);
CREATE INDEX IF NOT EXISTS noms_created_at_idx ON public.charity_nominations (created_at DESC);

-- ---------------------------------------------------------------------------
-- Audit log of moderator rejections
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rejection_log (
  id          BIGSERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('star','wish','coloring','nomination')),
  summary     TEXT NOT NULL,
  rejected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rejection_log_at_idx ON public.rejection_log (rejected_at DESC);

-- ---------------------------------------------------------------------------
-- Row-level security: deny everything to anon/authenticated.
-- The server uses the secret key (sb_secret_..., formerly service_role),
-- which bypasses RLS, so the API continues to work. Anyone hitting
-- Postgres directly with the publishable/anon key gets nothing back.
-- ---------------------------------------------------------------------------
ALTER TABLE public.stars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coloring_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rejection_log ENABLE ROW LEVEL SECURITY;

-- No CREATE POLICY statements: with RLS enabled and no policies present,
-- queries from anything other than the secret key return zero rows.
-- That's the intended posture.
