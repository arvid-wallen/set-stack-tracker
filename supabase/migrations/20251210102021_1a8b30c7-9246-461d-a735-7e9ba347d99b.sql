-- Add is_completed column to workout_exercises table
ALTER TABLE public.workout_exercises 
ADD COLUMN is_completed boolean NOT NULL DEFAULT false;