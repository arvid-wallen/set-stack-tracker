-- 1. Planned workouts on workout_sessions
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS planned_date date,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'app';

UPDATE public.workout_sessions
SET status = CASE WHEN is_active THEN 'active' ELSE 'completed' END;

ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_status_check
  CHECK (status IN ('planned', 'active', 'completed'));

ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_source_check
  CHECK (source IN ('app', 'mcp'));

ALTER TABLE public.workout_sessions
  ADD CONSTRAINT workout_sessions_duration_sane
  CHECK (duration_seconds IS NULL OR (duration_seconds >= 0 AND duration_seconds <= 21600)) NOT VALID;

CREATE INDEX IF NOT EXISTS workout_sessions_user_status_idx
  ON public.workout_sessions (user_id, status, started_at DESC);

-- 2. Target values on workout_exercises
ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS target_sets integer,
  ADD COLUMN IF NOT EXISTS target_reps text,
  ADD COLUMN IF NOT EXISTS target_weight_kg numeric;

ALTER TABLE public.workout_exercises
  ADD CONSTRAINT workout_exercises_target_sane
  CHECK (
    (target_sets IS NULL OR (target_sets > 0 AND target_sets <= 50))
    AND (target_weight_kg IS NULL OR target_weight_kg >= 0)
  ) NOT VALID;

-- 3. Set validation
ALTER TABLE public.exercise_sets
  ADD CONSTRAINT exercise_sets_values_sane
  CHECK (
    (weight_kg IS NULL OR weight_kg >= 0)
    AND (reps IS NULL OR reps >= 0)
    AND (rpe IS NULL OR (rpe >= 6 AND rpe <= 10))
    AND (rir IS NULL OR (rir >= 0 AND rir <= 10))
  ) NOT VALID;

-- 4. Body weight logs
CREATE TABLE public.body_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight_kg numeric NOT NULL CHECK (weight_kg > 0 AND weight_kg < 500),
  logged_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, logged_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.body_weight_logs TO authenticated;
GRANT ALL ON public.body_weight_logs TO service_role;

ALTER TABLE public.body_weight_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own body weight" ON public.body_weight_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body weight" ON public.body_weight_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own body weight" ON public.body_weight_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own body weight" ON public.body_weight_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_body_weight_logs_updated_at
  BEFORE UPDATE ON public.body_weight_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Exercise aliases
CREATE TABLE public.exercise_aliases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id uuid NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  alias text NOT NULL,
  normalized_alias text GENERATED ALWAYS AS (lower(trim(alias))) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX exercise_aliases_unique_idx
  ON public.exercise_aliases (exercise_id, normalized_alias);
CREATE INDEX exercise_aliases_normalized_idx
  ON public.exercise_aliases (normalized_alias);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_aliases TO authenticated;
GRANT ALL ON public.exercise_aliases TO service_role;

ALTER TABLE public.exercise_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant aliases" ON public.exercise_aliases
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.exercises e
      WHERE e.id = exercise_id AND (e.user_id IS NULL OR e.user_id = auth.uid())
    )
  );
CREATE POLICY "Users can insert aliases for own exercises" ON public.exercise_aliases
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Users can update aliases for own exercises" ON public.exercise_aliases
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.user_id = auth.uid())
  );
CREATE POLICY "Users can delete aliases for own exercises" ON public.exercise_aliases
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.exercises e WHERE e.id = exercise_id AND e.user_id = auth.uid())
  );

-- 6. Cardio future fields
ALTER TABLE public.cardio_logs
  ADD COLUMN IF NOT EXISTS avg_heart_rate integer,
  ADD COLUMN IF NOT EXISTS max_heart_rate integer,
  ADD COLUMN IF NOT EXISTS pace_sec_per_km integer;

ALTER TABLE public.cardio_logs
  ADD CONSTRAINT cardio_logs_values_sane
  CHECK (
    (duration_seconds IS NULL OR duration_seconds >= 0)
    AND (distance_km IS NULL OR distance_km >= 0)
    AND (calories IS NULL OR calories >= 0)
    AND (avg_heart_rate IS NULL OR (avg_heart_rate > 0 AND avg_heart_rate < 260))
    AND (max_heart_rate IS NULL OR (max_heart_rate > 0 AND max_heart_rate < 260))
    AND (pace_sec_per_km IS NULL OR pace_sec_per_km > 0)
  ) NOT VALID;