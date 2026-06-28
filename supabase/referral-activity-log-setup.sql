create table if not exists referral_activity_log (
  id uuid primary key default gen_random_uuid(),
  "referralId" uuid not null references referrals(id) on delete cascade,
  action text not null,
  details text not null default '',
  "createdAt" timestamptz not null default now()
);

create index if not exists referral_activity_log_referral_id_idx
  on referral_activity_log ("referralId");

create index if not exists referral_activity_log_created_at_idx
  on referral_activity_log ("createdAt" asc);

alter table referral_activity_log enable row level security;

drop policy if exists "Allow public read referral activity log" on referral_activity_log;
drop policy if exists "Allow public insert referral activity log" on referral_activity_log;

create policy "Allow public read referral activity log"
on referral_activity_log
for select
to public
using (true);

create policy "Allow public insert referral activity log"
on referral_activity_log
for insert
to public
with check (true);
