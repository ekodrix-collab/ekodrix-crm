-- Migration: Implementation of Approval-based Signup Flow (FIXED)
-- This migration ensures new users are inactive by default and must be approved by an admin.

-- 1. Update the default status for new users in the public.users table
ALTER TABLE public.users ALTER COLUMN is_active SET DEFAULT false;

-- 2. Ensure the handle_new_user function is correctly syncing metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    false -- Explicitly set to false for approval flow
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 3. ENABLE THE TRIGGER (CRITICAL: Make sure these are not commented)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. REPAIR SCRIPT: Sync existing users from auth.users that are missing in public.users
-- This will fix the user who already signed up (mhdrashid142@gmail.com)
INSERT INTO public.users (id, email, name, role, is_active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'name', email), 
    COALESCE(raw_user_meta_data->>'role', 'member'),
    false
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
