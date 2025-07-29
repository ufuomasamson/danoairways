-- Supabase SQL migration for live chat (one-on-one user-to-admin)
create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('user', 'admin')),
  message text not null,
  created_at timestamp with time zone default timezone('utc', now())
);

-- Index for faster queries by user
create index if not exists idx_chats_user_id on chats(user_id);

-- Enable RLS (Row Level Security)
alter table chats enable row level security;

-- Policy: Users can insert/select their own messages
create policy "Users can view their chats" on chats
  for select using (auth.uid() = user_id);

create policy "Users can insert their own messages" on chats
  for insert with check (auth.uid() = user_id);

-- Policy: Admin can view all chats (adjust admin role as needed)
create policy "Admin can view all chats" on chats
  for select using (exists (select 1 from auth.users where id = auth.uid() and raw_user_meta_data->>'role' = 'admin'));
