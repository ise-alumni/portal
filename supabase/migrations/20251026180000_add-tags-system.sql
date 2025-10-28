-- Add tags column to events table
alter table public.events add column tags text[] default '{}';

-- Create tags table
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#3b82f6', -- Default blue color
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Create index on tags name for better performance
create index tags_name_idx on public.tags(name);

-- Enable RLS
alter table public.tags enable row level security;

-- RLS policies for tags table
create policy "Anyone can read tags"
  on public.tags
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert tags"
  on public.tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and user_type in ('Admin', 'Staff')
    )
  );

create policy "Admins can update tags"
  on public.tags
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and user_type in ('Admin', 'Staff')
    )
  );

create policy "Admins can delete tags"
  on public.tags
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and user_type in ('Admin', 'Staff')
    )
  );


-- Create trigger to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_tags_updated_at
  before update on public.tags
  for each row
  execute function update_updated_at_column();

-- Insert some sample tags
insert into public.tags (name, color) values
  ('Networking', '#10b981'),
  ('Workshop', '#f59e0b'),
  ('Social', '#ef4444'),
  ('Career', '#8b5cf6'),
  ('Technical', '#06b6d4'),
  ('Alumni', '#84cc16'),
  ('Online', '#6366f1'),
  ('In-Person', '#f97316');
