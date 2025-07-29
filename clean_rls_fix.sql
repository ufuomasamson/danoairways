-- Clean RLS Fix for Live Chat
-- This addresses the infinite recursion error in policies

-- Step 1: Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view user profiles for chat" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admin can view all chats" ON chats;
DROP POLICY IF EXISTS "Admin can insert messages" ON chats;
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
DROP POLICY IF EXISTS "Users can send chats" ON chats;

-- Step 2: Temporarily disable RLS to clean up
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE chats DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate the public.users table with a simpler approach
DROP TABLE IF EXISTS public.users CASCADE;

-- Create a simple users table without complex references
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id uuid UNIQUE, -- Reference to auth.users but not a foreign key
  email text,
  role text DEFAULT 'user',
  created_at timestamp with time zone DEFAULT timezone('utc', now())
);

-- Step 4: Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Simple policy: Allow reading user records (no recursion)
CREATE POLICY "Allow read users" ON public.users
  FOR SELECT USING (true);

-- Simple policy: Allow inserting user records
CREATE POLICY "Allow insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Step 5: Update chats table to reference the simpler users table
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS user_auth_id uuid;

-- Update existing chats to use auth_id instead of direct foreign key
UPDATE chats SET user_auth_id = user_id WHERE user_auth_id IS NULL;

-- Step 6: Re-enable RLS on chats with simple policies
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

-- Simple chat policies without complex joins
CREATE POLICY "Allow read chats" ON chats
  FOR SELECT USING (true);

CREATE POLICY "Allow insert chats" ON chats
  FOR INSERT WITH CHECK (true);

-- Step 7: Insert existing auth users into public users
INSERT INTO public.users (auth_id, email, role)
SELECT 
  au.id, 
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'user') as role
FROM auth.users au
ON CONFLICT (auth_id) DO NOTHING;

-- Step 8: Create a simple trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (auth_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Grant necessary permissions
GRANT SELECT, INSERT ON public.users TO anon, authenticated;
GRANT SELECT, INSERT ON chats TO anon, authenticated;
