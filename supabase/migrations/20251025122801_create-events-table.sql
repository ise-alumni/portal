-- Create events table to track alumni events- can be both organised by alumni or releated to aumni
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique,
  description text,
  location text,
  location_url text,
  registration_url text,
  start_at timestamp with time zone not null,
  end_at timestamp with time zone,
  organiser_profile_id uuid references public.profiles(id) on delete set null, -- the profile of the organiser
  created_by uuid not null references auth.users(id) on delete cascade, -- the user who created the event, might not be the organiser
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index events_start_at_idx on public.events (start_at);

-- Keep updated_at fresh using the shared trigger helper
create trigger update_events_updated_at
  before update on public.events
  for each row
  execute function public.update_updated_at_column();

alter table public.events enable row level security;

create policy "Anyone can read events"
  on public.events
  for select
  to anon, authenticated
  using (true);

create policy "Admins can insert events"
  on public.events
  for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.user_type = 'Admin'
    )
  );

create policy "Admins can update events"
  on public.events
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.user_type = 'Admin'
    )
    and created_by = auth.uid()
  )
  with check (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.user_type = 'Admin'
    )
  );

create policy "Admins can delete events"
  on public.events
  for delete
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.user_type = 'Admin'
    )
  );
