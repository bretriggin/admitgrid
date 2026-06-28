-- Enable Supabase Realtime for AdmitGrid board tables.
-- Run in the Supabase SQL editor after creating the tables.

do $$
begin
  alter publication supabase_realtime add table public.referrals;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.referral_documents;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.referral_messages;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.referral_activity_log;
exception
  when duplicate_object then null;
end $$;
