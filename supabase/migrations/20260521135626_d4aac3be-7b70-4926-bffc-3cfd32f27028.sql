ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS monthly_goal integer NOT NULL DEFAULT 12,
ADD COLUMN IF NOT EXISTS goal_composition jsonb NOT NULL DEFAULT '{}'::jsonb;