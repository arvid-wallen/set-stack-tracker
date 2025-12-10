-- Add last_used_at column to routines table
ALTER TABLE public.routines ADD COLUMN IF NOT EXISTS last_used_at timestamp with time zone;

-- Create index for better sorting performance
CREATE INDEX IF NOT EXISTS idx_routines_last_used_at ON public.routines(last_used_at DESC NULLS LAST);