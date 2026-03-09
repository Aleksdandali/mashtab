-- ─── wheel_scores ──────────────────────────────────────────────────────────────
-- One row per sphere per measurement (a full measurement = 8 rows with same date).
-- Multiple measurements per date are allowed (history).

CREATE TABLE IF NOT EXISTS public.wheel_scores (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sphere      text NOT NULL,
  score       integer NOT NULL CHECK (score BETWEEN 1 AND 10),
  date        date NOT NULL DEFAULT CURRENT_DATE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wheel_scores_user_date ON public.wheel_scores (user_id, date DESC);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.wheel_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own wheel_scores"
  ON public.wheel_scores
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
