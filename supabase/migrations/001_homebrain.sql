create extension if not exists pgcrypto;

create type public.user_role as enum ('Admin', 'Parent', 'Member', 'Senior', 'Child');
create type public.medicine_status as enum ('Taken', 'Missed');
create type public.alert_status as enum ('Sent', 'Delivered', 'Cancelled');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text not null default '',
  family_name text not null default 'My HomeBrain Family',
  role public.user_role not null default 'Member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  relation text not null,
  avatar text not null default '',
  role public.user_role not null default 'Member',
  phone text not null default '',
  email text not null default '',
  age integer,
  created_at timestamptz not null default now()
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  date date not null,
  time time not null,
  category text not null,
  description text,
  members_involved jsonb not null default '[]'::jsonb,
  reminder boolean not null default true,
  recurring text not null default 'None',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  date_time timestamptz not null,
  priority text not null,
  completed boolean not null default false,
  assigned_member_name text not null,
  created_at timestamptz not null default now()
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text not null,
  upload_date date not null default current_date,
  file_type text not null,
  file_size text not null default '',
  file_url text not null,
  storage_path text,
  description text not null default '',
  summary_content text,
  uploader_name text not null,
  created_at timestamptz not null default now()
);

create table public.groceries (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text not null,
  quantity text not null,
  notes text,
  is_purchased boolean not null default false,
  purchased_by text,
  purchased_at timestamptz,
  assigned_member_id uuid references public.family_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.grocery_history (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  grocery_id uuid references public.groceries(id) on delete set null,
  name text not null,
  category text not null,
  purchased_by text not null,
  purchased_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table public.medicines (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  dosage text not null,
  timing text not null,
  frequency text not null,
  person_name text not null,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.medicine_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  medicine_id uuid not null references public.medicines(id) on delete cascade,
  medicine_name text not null,
  person_name text not null,
  status public.medicine_status not null,
  timestamp timestamptz not null default now(),
  logged_by text not null
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null,
  date date not null,
  payer text not null,
  description text,
  receipt_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bills (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  category text not null,
  is_paid boolean not null default false,
  paid_date date,
  paid_by text,
  recurring text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.family_knowledge (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  content text not null,
  category text not null,
  related_member_name text not null,
  importance text not null,
  created_date date not null default current_date,
  updated_at timestamptz not null default now()
);

create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  relation text not null,
  phone text not null,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.emergency_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  timestamp timestamptz not null default now(),
  user_location text not null,
  status public.alert_status not null default 'Sent',
  recipients jsonb not null default '[]'::jsonb
);

create table public.family_memories (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  year integer not null,
  date date not null,
  description text not null,
  photo_url text not null default '',
  location text,
  added_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.families enable row level security;

create or replace function public.current_family_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select family_id from public.profiles where id = auth.uid() limit 1
$$;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles', 'family_members', 'events', 'reminders', 'documents',
    'groceries', 'grocery_history', 'medicines', 'medicine_logs',
    'expenses', 'bills', 'family_knowledge', 'emergency_contacts',
    'emergency_logs', 'family_memories'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format(
      'create policy "%I family access" on public.%I for all using (family_id = public.current_family_id()) with check (family_id = public.current_family_id())',
      table_name, table_name
    );
  end loop;
end $$;

create policy "families family access" on public.families
  for select using (id = public.current_family_id());

create index events_family_date_idx on public.events (family_id, date);
create index reminders_family_date_idx on public.reminders (family_id, date_time);
create index bills_family_due_idx on public.bills (family_id, due_date);
create index expenses_family_date_idx on public.expenses (family_id, date);
create index documents_family_category_idx on public.documents (family_id, category);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "family members can read documents" on storage.objects
  for select using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

create policy "family members can upload documents" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

create policy "family members can update documents" on storage.objects
  for update using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

create policy "family members can delete documents" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1] = public.current_family_id()::text
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare new_family_id uuid;
begin
  insert into public.families (name)
  values (coalesce(new.raw_user_meta_data ->> 'family_name', 'My HomeBrain Family'))
  returning id into new_family_id;

  insert into public.profiles (id, family_id, name, email, avatar_url, role, family_name)
  values (
    new.id,
    new_family_id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    'Admin',
    coalesce(new.raw_user_meta_data ->> 'family_name', 'My HomeBrain Family')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
