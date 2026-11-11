-- =====================================================================
-- Migration 007: Consolidated, idempotent upgrade (safe to run repeatedly)
--
-- The live database is missing migrations 005 and 006. This file re-applies
-- them safely and adds the optional columns used by the demo family,
-- grocery pricing and SOS email delivery tracking.
--
-- HOW TO APPLY: Supabase Dashboard -> SQL Editor -> paste this file -> Run.
-- The app keeps working without it (missing columns are skipped), but
-- multi-photo memories, live SOS sessions, birthdays and prices need it.
-- =====================================================================

-- ---------- 005: live emergency sessions ----------
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists emergency_sessions_one_active_per_user
  on public.emergency_sessions (initiated_by) where status = 'active';

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

drop policy if exists "emergency sessions family read" on public.emergency_sessions;
create policy "emergency sessions family read" on public.emergency_sessions
  for select using (family_id = public.current_family_id());
drop policy if exists "emergency sessions initiator write" on public.emergency_sessions;
create policy "emergency sessions initiator write" on public.emergency_sessions
  for all using (family_id = public.current_family_id() and initiated_by = auth.uid())
  with check (family_id = public.current_family_id() and initiated_by = auth.uid());

drop policy if exists "emergency notifications recipient read" on public.emergency_notifications;
create policy "emergency notifications recipient read" on public.emergency_notifications
  for select using (family_id = public.current_family_id() and recipient_user_id = auth.uid());
drop policy if exists "emergency notifications family insert" on public.emergency_notifications;
create policy "emergency notifications family insert" on public.emergency_notifications
  for insert with check (
    family_id = public.current_family_id()
    and exists (select 1 from public.profiles where profiles.id = recipient_user_id and profiles.family_id = public.current_family_id())
  );
drop policy if exists "emergency notifications recipient update" on public.emergency_notifications;
create policy "emergency notifications recipient update" on public.emergency_notifications
  for update using (family_id = public.current_family_id() and recipient_user_id = auth.uid())
  with check (family_id = public.current_family_id() and recipient_user_id = auth.uid());
drop policy if exists "emergency notifications initiator update" on public.emergency_notifications;
create policy "emergency notifications initiator update" on public.emergency_notifications
  for update using (
    family_id = public.current_family_id()
    and exists (select 1 from public.emergency_sessions s where s.id = emergency_notifications.session_id and s.initiated_by = auth.uid())
  )
  with check (family_id = public.current_family_id());

create index if not exists emergency_notifications_recipient_idx
  on public.emergency_notifications (recipient_user_id, status, created_at desc);
create index if not exists emergency_sessions_family_status_idx
  on public.emergency_sessions (family_id, status, last_location_at desc);

-- ---------- 006: updated_at triggers, indexes, chat history, memory columns ----------
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare tbl text;
begin
  foreach tbl in array array['profiles','events','groceries','medicines','expenses','bills',
                             'family_knowledge','knowledge_files','family_memories','emergency_sessions'] loop
    if exists (select 1 from information_schema.columns
               where table_schema = 'public' and table_name = tbl and column_name = 'updated_at') then
      execute format('drop trigger if exists trg_update_%I_updated_at on public.%I;', tbl, tbl);
      execute format('create trigger trg_update_%I_updated_at before update on public.%I for each row execute function public.update_updated_at_column();', tbl, tbl);
    end if;
  end loop;
end $$;

create index if not exists family_memories_family_date_idx on public.family_memories (family_id, year desc, date desc);
create index if not exists medicines_family_person_idx on public.medicines (family_id, person_name);
create index if not exists family_members_family_idx on public.family_members (family_id);
create index if not exists family_knowledge_family_cat_idx on public.family_knowledge (family_id, category);
create index if not exists medicine_logs_family_time_idx on public.medicine_logs (family_id, timestamp desc);
create index if not exists grocery_history_family_time_idx on public.grocery_history (family_id, purchased_at desc);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  sender text not null check (sender in ('user', 'assistant')),
  text text not null,
  attachments jsonb default '[]'::jsonb,
  grounding_sources jsonb default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
drop policy if exists chat_messages_family_isolation on public.chat_messages;
create policy chat_messages_family_isolation on public.chat_messages
  for all using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());

alter table public.family_memories add column if not exists photo_urls jsonb default '[]'::jsonb;
alter table public.family_memories add column if not exists document_urls jsonb default '[]'::jsonb;
alter table public.family_memories add column if not exists tagged_members jsonb default '[]'::jsonb;
alter table public.family_memories add column if not exists tags jsonb default '[]'::jsonb;

-- ---------- 007: new optional columns ----------
alter table public.family_members add column if not exists birthday date;
alter table public.family_members add column if not exists preferences text;
alter table public.emergency_contacts add column if not exists email text;
alter table public.groceries add column if not exists estimated_price numeric(12,2);
alter table public.emergency_logs add column if not exists email_results jsonb default '[]'::jsonb;

-- Tell PostgREST to reload its schema cache so new columns are visible immediately.
notify pgrst, 'reload schema';

