-- Create enum types
CREATE TYPE public.workout_type AS ENUM ('push', 'pull', 'legs', 'full_body', 'cardio', 'upper', 'lower', 'custom');
CREATE TYPE public.muscle_group AS ENUM ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quads', 'hamstrings', 'glutes', 'calves', 'core', 'full_body');
CREATE TYPE public.equipment_type AS ENUM ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'bands', 'cardio_machine', 'other');
CREATE TYPE public.cardio_type AS ENUM ('running', 'cycling', 'rowing', 'swimming', 'elliptical', 'walking', 'stair_climber', 'jump_rope', 'other');

-- Create exercises table (exercise library)
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups muscle_group[] NOT NULL DEFAULT '{}',
  equipment_type equipment_type NOT NULL DEFAULT 'bodyweight',
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_cardio BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_sessions table
CREATE TABLE public.workout_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_type workout_type NOT NULL DEFAULT 'custom',
  custom_type_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create workout_exercises table (exercises in a workout session)
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise_sets table
CREATE TABLE public.exercise_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight_kg DECIMAL(6,2),
  reps INTEGER,
  is_warmup BOOLEAN NOT NULL DEFAULT false,
  is_bodyweight BOOLEAN NOT NULL DEFAULT false,
  rpe DECIMAL(3,1) CHECK (rpe >= 1 AND rpe <= 10),
  rir INTEGER CHECK (rir >= 0 AND rir <= 10),
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cardio_logs table for cardio exercises
CREATE TABLE public.cardio_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
  cardio_type cardio_type NOT NULL DEFAULT 'running',
  duration_seconds INTEGER,
  distance_km DECIMAL(6,2),
  calories INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routines table (workout templates)
CREATE TABLE public.routines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workout_type workout_type NOT NULL DEFAULT 'custom',
  folder TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create routine_exercises table
CREATE TABLE public.routine_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL DEFAULT 0,
  superset_group INTEGER,
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_weight_kg DECIMAL(6,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercise_goals table
CREATE TABLE public.exercise_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  target_weight_kg DECIMAL(6,2),
  target_reps INTEGER,
  target_date DATE,
  achieved BOOLEAN NOT NULL DEFAULT false,
  achieved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, exercise_id)
);

-- Enable RLS on all tables
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cardio_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercises (public ones readable by all, custom only by owner)
CREATE POLICY "Public exercises are viewable by everyone" 
ON public.exercises FOR SELECT 
USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Users can create custom exercises" 
ON public.exercises FOR INSERT 
WITH CHECK (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can update their own custom exercises" 
ON public.exercises FOR UPDATE 
USING (auth.uid() = user_id AND is_custom = true);

CREATE POLICY "Users can delete their own custom exercises" 
ON public.exercises FOR DELETE 
USING (auth.uid() = user_id AND is_custom = true);

-- RLS Policies for workout_sessions
CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own workout sessions" 
ON public.workout_sessions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout sessions" 
ON public.workout_sessions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout sessions" 
ON public.workout_sessions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view their own workout exercises" 
ON public.workout_exercises FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create workout exercises in their sessions" 
ON public.workout_exercises FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update workout exercises in their sessions" 
ON public.workout_exercises FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete workout exercises from their sessions" 
ON public.workout_exercises FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_sessions ws 
  WHERE ws.id = workout_session_id AND ws.user_id = auth.uid()
));

-- RLS Policies for exercise_sets
CREATE POLICY "Users can view their own exercise sets" 
ON public.exercise_sets FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create exercise sets in their workouts" 
ON public.exercise_sets FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update their own exercise sets" 
ON public.exercise_sets FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own exercise sets" 
ON public.exercise_sets FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

-- RLS Policies for cardio_logs
CREATE POLICY "Users can view their own cardio logs" 
ON public.cardio_logs FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can create cardio logs in their workouts" 
ON public.cardio_logs FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can update their own cardio logs" 
ON public.cardio_logs FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own cardio logs" 
ON public.cardio_logs FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.workout_exercises we 
  JOIN public.workout_sessions ws ON ws.id = we.workout_session_id 
  WHERE we.id = workout_exercise_id AND ws.user_id = auth.uid()
));

-- RLS Policies for routines
CREATE POLICY "Users can view their own routines" 
ON public.routines FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own routines" 
ON public.routines FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own routines" 
ON public.routines FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own routines" 
ON public.routines FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for routine_exercises
CREATE POLICY "Users can view their own routine exercises" 
ON public.routine_exercises FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.routines r 
  WHERE r.id = routine_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can create routine exercises in their routines" 
ON public.routine_exercises FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.routines r 
  WHERE r.id = routine_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can update routine exercises in their routines" 
ON public.routine_exercises FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.routines r 
  WHERE r.id = routine_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can delete routine exercises from their routines" 
ON public.routine_exercises FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.routines r 
  WHERE r.id = routine_id AND r.user_id = auth.uid()
));

-- RLS Policies for exercise_goals
CREATE POLICY "Users can view their own exercise goals" 
ON public.exercise_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercise goals" 
ON public.exercise_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercise goals" 
ON public.exercise_goals FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise goals" 
ON public.exercise_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Insert default exercises
INSERT INTO public.exercises (name, description, muscle_groups, equipment_type, is_custom, is_cardio) VALUES
-- Chest
('Bench Press', 'Barbell bench press for chest development', ARRAY['chest']::muscle_group[], 'barbell', false, false),
('Incline Bench Press', 'Incline barbell press for upper chest', ARRAY['chest']::muscle_group[], 'barbell', false, false),
('Dumbbell Bench Press', 'Dumbbell bench press for chest', ARRAY['chest']::muscle_group[], 'dumbbell', false, false),
('Incline Dumbbell Press', 'Incline dumbbell press for upper chest', ARRAY['chest']::muscle_group[], 'dumbbell', false, false),
('Chest Fly', 'Cable or dumbbell fly for chest isolation', ARRAY['chest']::muscle_group[], 'cable', false, false),
('Push-ups', 'Bodyweight push-ups', ARRAY['chest', 'triceps']::muscle_group[], 'bodyweight', false, false),
('Dips', 'Parallel bar dips for chest and triceps', ARRAY['chest', 'triceps']::muscle_group[], 'bodyweight', false, false),
-- Back
('Deadlift', 'Conventional barbell deadlift', ARRAY['back', 'hamstrings', 'glutes']::muscle_group[], 'barbell', false, false),
('Barbell Row', 'Bent-over barbell row for back', ARRAY['back', 'biceps']::muscle_group[], 'barbell', false, false),
('Dumbbell Row', 'Single-arm dumbbell row', ARRAY['back', 'biceps']::muscle_group[], 'dumbbell', false, false),
('Pull-ups', 'Bodyweight pull-ups', ARRAY['back', 'biceps']::muscle_group[], 'bodyweight', false, false),
('Lat Pulldown', 'Cable lat pulldown', ARRAY['back', 'biceps']::muscle_group[], 'cable', false, false),
('Seated Cable Row', 'Seated cable row for mid-back', ARRAY['back']::muscle_group[], 'cable', false, false),
('T-Bar Row', 'T-bar row for back thickness', ARRAY['back']::muscle_group[], 'barbell', false, false),
-- Shoulders
('Overhead Press', 'Standing barbell overhead press', ARRAY['shoulders', 'triceps']::muscle_group[], 'barbell', false, false),
('Dumbbell Shoulder Press', 'Seated or standing dumbbell press', ARRAY['shoulders']::muscle_group[], 'dumbbell', false, false),
('Lateral Raise', 'Dumbbell lateral raise for side delts', ARRAY['shoulders']::muscle_group[], 'dumbbell', false, false),
('Front Raise', 'Dumbbell front raise for front delts', ARRAY['shoulders']::muscle_group[], 'dumbbell', false, false),
('Rear Delt Fly', 'Reverse fly for rear delts', ARRAY['shoulders']::muscle_group[], 'dumbbell', false, false),
('Face Pull', 'Cable face pull for rear delts and rotator cuff', ARRAY['shoulders', 'back']::muscle_group[], 'cable', false, false),
-- Arms
('Barbell Curl', 'Standing barbell curl', ARRAY['biceps']::muscle_group[], 'barbell', false, false),
('Dumbbell Curl', 'Dumbbell bicep curls', ARRAY['biceps']::muscle_group[], 'dumbbell', false, false),
('Hammer Curl', 'Neutral grip dumbbell curls', ARRAY['biceps', 'forearms']::muscle_group[], 'dumbbell', false, false),
('Tricep Pushdown', 'Cable tricep pushdown', ARRAY['triceps']::muscle_group[], 'cable', false, false),
('Skull Crushers', 'Lying tricep extension with barbell or EZ bar', ARRAY['triceps']::muscle_group[], 'barbell', false, false),
('Overhead Tricep Extension', 'Dumbbell or cable overhead extension', ARRAY['triceps']::muscle_group[], 'dumbbell', false, false),
-- Legs
('Squat', 'Barbell back squat', ARRAY['quads', 'glutes', 'hamstrings']::muscle_group[], 'barbell', false, false),
('Front Squat', 'Barbell front squat', ARRAY['quads', 'core']::muscle_group[], 'barbell', false, false),
('Leg Press', 'Machine leg press', ARRAY['quads', 'glutes']::muscle_group[], 'machine', false, false),
('Romanian Deadlift', 'RDL for hamstrings and glutes', ARRAY['hamstrings', 'glutes']::muscle_group[], 'barbell', false, false),
('Leg Curl', 'Machine leg curl for hamstrings', ARRAY['hamstrings']::muscle_group[], 'machine', false, false),
('Leg Extension', 'Machine leg extension for quads', ARRAY['quads']::muscle_group[], 'machine', false, false),
('Bulgarian Split Squat', 'Single-leg split squat', ARRAY['quads', 'glutes']::muscle_group[], 'dumbbell', false, false),
('Lunges', 'Walking or stationary lunges', ARRAY['quads', 'glutes']::muscle_group[], 'dumbbell', false, false),
('Calf Raise', 'Standing or seated calf raise', ARRAY['calves']::muscle_group[], 'machine', false, false),
('Hip Thrust', 'Barbell hip thrust for glutes', ARRAY['glutes', 'hamstrings']::muscle_group[], 'barbell', false, false),
-- Core
('Plank', 'Static plank hold', ARRAY['core']::muscle_group[], 'bodyweight', false, false),
('Hanging Leg Raise', 'Hanging leg raise for abs', ARRAY['core']::muscle_group[], 'bodyweight', false, false),
('Cable Crunch', 'Kneeling cable crunch', ARRAY['core']::muscle_group[], 'cable', false, false),
('Ab Wheel Rollout', 'Ab wheel for core stability', ARRAY['core']::muscle_group[], 'other', false, false),
-- Cardio
('Treadmill Running', 'Running on treadmill', ARRAY['full_body']::muscle_group[], 'cardio_machine', false, true),
('Cycling', 'Stationary bike or outdoor cycling', ARRAY['quads', 'hamstrings']::muscle_group[], 'cardio_machine', false, true),
('Rowing', 'Rowing machine', ARRAY['back', 'full_body']::muscle_group[], 'cardio_machine', false, true),
('Elliptical', 'Elliptical machine', ARRAY['full_body']::muscle_group[], 'cardio_machine', false, true),
('Stair Climber', 'Stair climber machine', ARRAY['quads', 'glutes', 'calves']::muscle_group[], 'cardio_machine', false, true),
('Jump Rope', 'Jump rope cardio', ARRAY['calves', 'full_body']::muscle_group[], 'other', false, true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_exercise_goals_updated_at BEFORE UPDATE ON public.exercise_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();