-- Add input validation to handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name)
  VALUES (
    new.id, 
    COALESCE(
      NULLIF(TRIM(SUBSTRING(new.raw_user_meta_data ->> 'first_name', 1, 100)), ''),
      'Användare'
    )
  );
  RETURN new;
END;
$$;

-- Add length constraints to profiles table
ALTER TABLE public.profiles
ADD CONSTRAINT first_name_length CHECK (length(first_name) BETWEEN 1 AND 100);

ALTER TABLE public.profiles
ADD CONSTRAINT last_name_length CHECK (last_name IS NULL OR length(last_name) <= 100);