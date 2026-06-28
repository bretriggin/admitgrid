create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  "referralId" uuid references referrals(id) on delete set null,
  message text not null,
  "createdBy" text not null default '',
  "isRead" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

alter table notifications
  add column if not exists title text not null default '',
  add column if not exists "createdBy" text not null default '';

create index if not exists notifications_created_at_idx
  on notifications ("createdAt" desc);

create index if not exists notifications_is_read_idx
  on notifications ("isRead");

alter table notifications enable row level security;

drop policy if exists "Allow public read notifications" on notifications;
drop policy if exists "Allow public insert notifications" on notifications;
drop policy if exists "Allow public update notifications" on notifications;

create policy "Allow public read notifications"
on notifications
for select
to public
using (true);

create policy "Allow public insert notifications"
on notifications
for insert
to public
with check (true);

create policy "Allow public update notifications"
on notifications
for update
to public
using (true)
with check (true);
