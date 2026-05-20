ALTER TABLE public.workout_exercises
  DROP CONSTRAINT IF EXISTS workout_exercises_workout_session_id_fkey,
  ADD CONSTRAINT workout_exercises_workout_session_id_fkey
    FOREIGN KEY (workout_session_id)
    REFERENCES public.workout_sessions(id)
    ON DELETE CASCADE;

ALTER TABLE public.exercise_sets
  DROP CONSTRAINT IF EXISTS exercise_sets_workout_exercise_id_fkey,
  ADD CONSTRAINT exercise_sets_workout_exercise_id_fkey
    FOREIGN KEY (workout_exercise_id)
    REFERENCES public.workout_exercises(id)
    ON DELETE CASCADE;

ALTER TABLE public.cardio_logs
  DROP CONSTRAINT IF EXISTS cardio_logs_workout_exercise_id_fkey,
  ADD CONSTRAINT cardio_logs_workout_exercise_id_fkey
    FOREIGN KEY (workout_exercise_id)
    REFERENCES public.workout_exercises(id)
    ON DELETE CASCADE;