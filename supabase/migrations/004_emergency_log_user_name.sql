alter table public.emergency_logs
  add column if not exists user_name text;
