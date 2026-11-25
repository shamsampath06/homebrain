-- =====================================================================
-- Migration 008: Multi-User Family Platform, Hub, Invites & Personal Spaces
--
-- Enables:
-- 1. Multiple individual accounts (Dad, Mom, Sister, Brother) under 1 family
-- 2. Household invitation codes (e.g. HB-849201) and deep link joining
-- 3. Dynamic relationship (Father, Mother, Sister, Brother, etc.)
-- 4. Role-based access (Admin, Co-Admin, Member)
-- 5. Personal private spaces vs. shared family spaces (Tasks, Expenses, Docs, Calendar)
-- 6. Household-level multi-tenant isolation via PostgreSQL Row Level Security
-- =====================================================================

-- 1. Extend families table with invite codes
alter table public.families add column if not exists invite_code text unique;
alter table public.families add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Helper to generate unique 6-character household invite code (e.g. HB-7A3F9B)
create or replace function public.generate_family_invite_code()
returns text
language plpgsql
as $$
declare
  candidate text;
  exists_flag boolean;
begin
  loop
    candidate := 'HB-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    select exists(select 1 from public.families where invite_code = candidate) into exists_flag;
    if not exists_flag then
      return candidate;
    end if;
  end loop;
end;
$$;

-- Backfill any existing families that don't have an invite code
update public.families
set invite_code = public.generate_family_invite_code()
where invite_code is null or invite_code = '';

-- Ensure invite_code has an index for fast lookups during registration & joining
create index if not exists idx_families_invite_code on public.families (upper(invite_code));

-- 2. Extend profiles table with relationship and ensure role includes Co-Admin
alter table public.profiles add column if not exists relation text default 'Member';
alter table public.profiles add column if not exists phone text default '';

-- Relax or ensure user_role includes Co-Admin if an enum is used
do $$
begin
  if exists (select 1 from pg_type where typname = 'user_role') then
    begin
      alter type public.user_role add value if not exists 'Co-Admin' after 'Admin';
    exception
      when others then null;
    end;
  end if;
end $$;

-- 3. Add personal vs shared space columns to Reminders, Expenses, Documents, Events
alter table public.reminders add column if not exists is_personal boolean not null default false;
alter table public.reminders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.reminders add column if not exists created_by_name text;

alter table public.expenses add column if not exists is_personal boolean not null default false;
alter table public.expenses add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.expenses add column if not exists created_by_name text;

alter table public.documents add column if not exists is_personal boolean not null default false;
alter table public.documents add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.documents add column if not exists created_by_name text;

alter table public.events add column if not exists is_personal boolean not null default false;
alter table public.events add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.events add column if not exists created_by_name text;

-- 4. Connect family_members table with individual user profile ID
alter table public.family_members add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.family_members add column if not exists is_registered boolean default false;
create index if not exists idx_family_members_user_id on public.family_members (user_id);

-- 5. Updated handle_new_user() trigger for multi-user family registration
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_family_id uuid;
  found_family_name text;
  user_invite_code text;
  user_name text;
  user_relation text;
  user_role text;
  new_code text;
begin
  user_invite_code := upper(trim(coalesce(new.raw_user_meta_data ->> 'invite_code', '')));
  user_name := coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1));
  user_relation := coalesce(new.raw_user_meta_data ->> 'relation', 'Member');
  user_role := coalesce(new.raw_user_meta_data ->> 'role', 'Member');

  -- Scenario A: Joining an existing family via invite code
  if user_invite_code <> '' then
    select id, name into target_family_id, found_family_name
    from public.families
    where upper(invite_code) = user_invite_code
    limit 1;
  end if;

  -- Scenario B: Creating a brand new family household
  if target_family_id is null then
    new_code := public.generate_family_invite_code();
    found_family_name := coalesce(new.raw_user_meta_data ->> 'family_name', 'Family Household');
    
    insert into public.families (name, invite_code, created_by)
    values (found_family_name, new_code, new.id)
    returning id into target_family_id;

    -- The creator is always the initial Admin
    user_role := 'Admin';
  end if;

  -- Create or update profile
  insert into public.profiles (id, family_id, name, email, avatar_url, role, relation, family_name)
  values (
    new.id,
    target_family_id,
    user_name,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    user_role::public.user_role,
    user_relation,
    found_family_name
  )
  on conflict (id) do update set
    family_id = excluded.family_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    relation = excluded.relation,
    family_name = excluded.family_name,
    updated_at = now();

  -- Sync to family_members table so roster shows this member
  insert into public.family_members (family_id, user_id, name, relation, role, email, is_registered)
  values (
    target_family_id,
    new.id,
    user_name,
    user_relation,
    user_role::public.user_role,
    coalesce(new.email, ''),
    true
  )
  on conflict do nothing;

  return new;
end;
$$;

-- Drop and recreate trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Helper RPC: Join existing family by invite code (can be called by logged-in users)
create or replace function public.join_family_by_code(
  p_invite_code text,
  p_relation text default 'Member',
  p_role text default 'Member'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  target_fam record;
  current_user_id uuid;
  u_email text;
  u_name text;
begin
  current_user_id := auth.uid();
  if current_user_id is null then
    raise exception 'Unauthorized: Must be logged in to join a family';
  end if;

  select id, name, invite_code into target_fam
  from public.families
  where upper(invite_code) = upper(trim(p_invite_code))
  limit 1;

  if target_fam.id is null then
    raise exception 'Invalid invitation code. Please verify the code from your family administrator.';
  end if;

  select email into u_email from auth.users where id = current_user_id;

  -- Update profile to point to new family
  update public.profiles
  set family_id = target_fam.id,
      family_name = target_fam.name,
      relation = coalesce(p_relation, relation, 'Member'),
      role = coalesce(p_role, 'Member')::public.user_role,
      updated_at = now()
  where id = current_user_id
  returning name into u_name;

  -- Sync to family_members table
  insert into public.family_members (family_id, user_id, name, relation, role, email, is_registered)
  values (
    target_fam.id,
    current_user_id,
    coalesce(u_name, split_part(u_email, '@', 1)),
    coalesce(p_relation, 'Member'),
    coalesce(p_role, 'Member')::public.user_role,
    coalesce(u_email, ''),
    true
  );

  return json_build_object(
    'success', true,
    'family_id', target_fam.id,
    'family_name', target_fam.name,
    'invite_code', target_fam.invite_code,
    'relation', p_relation,
    'role', p_role
  );
end;
$$;

-- 7. Personal vs Shared Row Level Security (RLS) Policies
-- Update RLS for personal data privacy:
-- Shared items (is_personal = false) are visible to all members of the household.
-- Personal items (is_personal = true) are ONLY visible to their creator (user_id = auth.uid()).

drop policy if exists "reminders family access" on public.reminders;
create policy "reminders personal and family access" on public.reminders
  for all using (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  )
  with check (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  );

drop policy if exists "expenses family access" on public.expenses;
create policy "expenses personal and family access" on public.expenses
  for all using (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  )
  with check (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  );

drop policy if exists "documents family access" on public.documents;
create policy "documents personal and family access" on public.documents
  for all using (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  )
  with check (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  );

drop policy if exists "events family access" on public.events;
create policy "events personal and family access" on public.events
  for all using (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  )
  with check (
    family_id = public.current_family_id()
    and (is_personal = false or user_id = auth.uid() or user_id is null)
  );

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
