alter table public.emergency_logs
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision,
  add column if not exists accuracy_meters double precision;

alter type public.alert_status add value if not exists 'Logged';

drop policy if exists "family members can read emergency logs" on public.emergency_logs;
create policy "family members can read emergency logs" on public.emergency_logs
  for select using (family_id = public.current_family_id());
