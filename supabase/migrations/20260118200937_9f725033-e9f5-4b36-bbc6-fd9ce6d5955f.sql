-- Create pt_profiles table for AI PT personalization
CREATE TABLE public.pt_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Basic info (optional)
  age INT,
  gender TEXT, -- 'male', 'female', 'other', null
  weight_kg NUMERIC,
  height_cm NUMERIC,
  
  -- Training goals (multiple selection possible)
  goals TEXT[] DEFAULT '{}', -- ['muscle_gain', 'fat_loss', 'strength', 'health', 'endurance']
  
  -- Experience
  experience_level TEXT, -- 'beginner', 'intermediate', 'advanced'
  training_years INT,
  
  -- Limitations
  injuries TEXT, -- Free text for injuries/limitations
  health_conditions TEXT,
  
  -- Preferences
  available_equipment TEXT[] DEFAULT '{}', -- ['full_gym', 'home_gym', 'bodyweight', 'resistance_bands']
  preferred_workout_duration INT, -- Minutes
  training_days_per_week INT,
  
  -- Onboarding status
  onboarding_completed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pt_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own PT profile"
ON public.pt_profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own PT profile"
ON public.pt_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PT profile"
ON public.pt_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PT profile"
ON public.pt_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_pt_profiles_updated_at
BEFORE UPDATE ON public.pt_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();