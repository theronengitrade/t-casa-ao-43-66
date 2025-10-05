-- Add avatar_url column to profiles for persistent profile pictures
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url text;

-- No RLS changes needed; existing UPDATE policy (user_id = auth.uid()) already controls updates.
