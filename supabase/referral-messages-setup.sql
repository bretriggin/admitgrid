create table if not exists referral_messages (
  id uuid primary key default gen_random_uuid(),
  "referralId" uuid not null references referrals(id) on delete cascade,
  message text not null,
  "createdBy" text not null default 'Staff',
  "createdAt" timestamptz not null default now()
);

create index if not exists referral_messages_referral_id_idx
  on referral_messages ("referralId");

create index if not exists referral_messages_created_at_idx
  on referral_messages ("createdAt" asc);

alter table referral_messages enable row level security;

drop policy if exists "Allow public read referral messages" on referral_messages;
drop policy if exists "Allow public insert referral messages" on referral_messages;

create policy "Allow public read referral messages"
on referral_messages
for select
to public
using (true);

create policy "Allow public insert referral messages"
on referral_messages
for insert
to public
with check (true);
