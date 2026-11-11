create table if not exists public.emergency_sessions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  initiated_by uuid not null references auth.users(id) on delete cascade,
  initiator_name text not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  last_location_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists emergency_sessions_one_active_per_user
  on public.emergency_sessions (initiated_by)
  where status = 'active';

create table if not exists public.emergency_notifications (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  session_id uuid not null references public.emergency_sessions(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  initiator_name text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  last_location_at timestamptz not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.emergency_sessions enable row level security;
alter table public.emergency_notifications enable row level security;

create policy "emergency sessions family read" on public.emergency_sessions
  for select using (family_id = public.current_family_id());
create policy "emergency sessions initiator write" on public.emergency_sessions
  for all using (family_id = public.current_family_id() and initiated_by = auth.uid())
  with check (family_id = public.current_family_id() and initiated_by = auth.uid());

create policy "emergency notifications recipient read" on public.emergency_notifications
  for select using (family_id = public.current_family_id() and recipient_user_id = auth.uid());
create policy "emergency notifications family insert" on public.emergency_notifications
  for insert with check (
    family_id = public.current_family_id()
    and exists (
      select 1 from public.profiles
      where profiles.id = recipient_user_id
        and profiles.family_id = public.current_family_id()
    )
  );
create policy "emergency notifications recipient update" on public.emergency_notifications
  for update using (family_id = public.current_family_id() and recipient_user_id = auth.uid())
  with check (family_id = public.current_family_id() and recipient_user_id = auth.uid());
create policy "emergency notifications initiator update" on public.emergency_notifications
  for update using (
    family_id = public.current_family_id()
    and exists (
      select 1 from public.emergency_sessions
      where emergency_sessions.id = emergency_notifications.session_id
        and emergency_sessions.initiated_by = auth.uid()
    )
  )
  with check (
    family_id = public.current_family_id()
    and exists (
      select 1 from public.profiles
      where profiles.id = recipient_user_id
        and profiles.family_id = public.current_family_id()
    )
  );

create index if not exists emergency_notifications_recipient_idx
  on public.emergency_notifications (recipient_user_id, status, created_at desc);
create index if not exists emergency_sessions_family_status_idx
  on public.emergency_sessions (family_id, status, last_location_at desc);
