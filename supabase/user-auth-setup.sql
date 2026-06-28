create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  "authUserId" uuid not null unique references auth.users(id) on delete cascade,
  "firstName" text not null default '',
  "lastName" text not null default '',
  email text not null default '',
  "isActive" boolean not null default true,
  "isExecutive" boolean not null default false,
  "isSystemOwner" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

alter table user_profiles
  add column if not exists "isSystemOwner" boolean not null default false;

create index if not exists user_profiles_auth_user_id_idx
  on user_profiles ("authUserId");

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  "userProfileId" uuid not null references user_profiles(id) on delete cascade,
  role text not null,
  unique ("userProfileId", role)
);

create index if not exists user_roles_user_profile_id_idx
  on user_roles ("userProfileId");

alter table user_profiles enable row level security;
alter table user_roles enable row level security;

drop policy if exists "Allow authenticated read user profiles" on user_profiles;
drop policy if exists "Allow authenticated read user roles" on user_roles;

create policy "Allow authenticated read user profiles"
on user_profiles
for select
to authenticated
using (true);

create policy "Allow authenticated read user roles"
on user_roles
for select
to authenticated
using (true);

alter table referral_activity_log
  add column if not exists "createdBy" text not null default '';

alter table notifications
  add column if not exists "createdBy" text not null default '',
  add column if not exists title text not null default '';

drop policy if exists "Allow public read notifications" on notifications;
drop policy if exists "Allow public insert notifications" on notifications;
drop policy if exists "Allow public update notifications" on notifications;

create policy "Allow authenticated read notifications"
on notifications
for select
to authenticated
using (true);

create policy "Allow authenticated insert notifications"
on notifications
for insert
to authenticated
with check (true);

create policy "Allow authenticated update notifications"
on notifications
for update
to authenticated
using (true)
with check (true);
