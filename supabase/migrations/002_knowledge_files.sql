create table public.knowledge_files (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  folder_path text not null default '',
  storage_path text not null default '',
  mime_type text not null default '',
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  is_folder boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.knowledge_files enable row level security;
create policy "knowledge files family access" on public.knowledge_files
  for all using (family_id = public.current_family_id())
  with check (family_id = public.current_family_id());
create index knowledge_files_family_folder_idx on public.knowledge_files (family_id, folder_path);

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
