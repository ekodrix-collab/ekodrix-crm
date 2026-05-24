-- ==============================================================
-- Migration: Enable Global Assignment and Employee SELECT Policy
-- Description: Drops existing restrictive select policies on the 'users' table 
--              and creates an open SELECT policy so any authenticated team 
--              member (such as standard 'member' users like Rashid) 
--              can retrieve all employee profiles for seamless lead/task assignments.
-- ==============================================================

-- 1. Drop existing select policies on public.users table if they exist
DROP POLICY IF EXISTS "Users can view all team members" ON public.users;
DROP POLICY IF EXISTS "Users can view team members" ON public.users;
DROP POLICY IF EXISTS "Everyone can view users" ON public.users;
DROP POLICY IF EXISTS "Allow select for all authenticated users" ON public.users;

-- 2. Create an open SELECT policy on the public.users table
-- This allows any authenticated user to view the full employee/profile list
CREATE POLICY "Users can view all team members" 
ON public.users 
FOR SELECT 
USING (true);

-- 3. Just to be absolutely safe, let's verify Row Level Security (RLS) is still active on users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
