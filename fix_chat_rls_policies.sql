-- Fix for live chat RLS issues
-- This SQL addresses the "permission denied for table users" error

-- First, let's ensure RLS is properly configured for the users table
-- The error occurs because the chats table has a foreign key to auth.users
-- but the anon key can't read auth.users to validate the constraint

-- Method 1: Create a custom users table and update foreign key
-- This is the recommended approach for better control

-- 1. Create a public users table (if not exists)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text default 'user',
  created_at timestamp with time zone default timezone('utc', now())
);

-- Enable RLS on public users table
alter table public.users enable row level security;

-- Policy: Allow users to read their own record and any user record for chat lookups
create policy "Users can view user profiles for chat" on public.users
  for select using (true); -- Allow all authenticated users to read user profiles

-- Policy: Users can insert their own record
create policy "Users can insert their own profile" on public.users
  for insert with check (auth.uid() = id);

-- Policy: Users can update their own record
create policy "Users can update their own profile" on public.users
  for update using (auth.uid() = id);

-- 2. Update the chats table to reference public.users instead of auth.users
-- First drop the existing foreign key constraint
alter table chats drop constraint if exists chats_user_id_fkey;

-- Add new foreign key constraint to public.users
alter table chats add constraint chats_user_id_fkey 
  foreign key (user_id) references public.users(id) on delete cascade;

-- 3. Ensure existing users are in the public.users table
-- Insert auth users into public users if they don't exist
insert into public.users (id, email, role)
select 
  au.id, 
  au.email,
  coalesce(au.raw_user_meta_data->>'role', 'user') as role
from auth.users au
left join public.users pu on au.id = pu.id
where pu.id is null;

-- 4. Update the admin policy for chats to use public.users
drop policy if exists "Admin can view all chats" on chats;
create policy "Admin can view all chats" on chats
  for select using (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Add admin insert policy for chats
create policy "Admin can insert messages" on chats
  for insert with check (
    exists (
      select 1 from public.users 
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6. Create a function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'role', 'user'));
  return new;
end;
$$ language plpgsql security definer;

-- 7. Create trigger to auto-create user profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Alternative Method 2: If you prefer to keep using auth.users
-- Uncomment the following if you want to stick with auth.users reference

-- Grant anon role permission to read auth.users for foreign key validation
-- grant select on auth.users to anon;

-- But this is less secure, so Method 1 is recommended
