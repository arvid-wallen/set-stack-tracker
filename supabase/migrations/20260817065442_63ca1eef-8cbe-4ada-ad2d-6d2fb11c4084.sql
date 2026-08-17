ALTER TABLE public.workout_exercises
  ADD COLUMN IF NOT EXISTS target_rpe numeric;

ALTER TABLE public.workout_exercises
  ADD CONSTRAINT workout_exercises_target_rpe_range
  CHECK (target_rpe IS NULL OR (target_rpe >= 6 AND target_rpe <= 10)) NOT VALID;