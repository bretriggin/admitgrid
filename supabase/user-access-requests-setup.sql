-- Access request workflow and profile extensions for AdmitGrid user management.

alter table user_profiles
  add column if not exists facility text not null default '',
  add column if not exists "jobTitle" text not null default '',
  add column if not exists "approvalStatus" text not null default 'Approved';

create table if not exists user_access_requests (
  id uuid primary key default gen_random_uuid(),
  "firstName" text not null default '',
  "lastName" text not null default '',
  email text not null default '',
  facility text not null default '',
  "jobTitle" text not null default '',
  "requestedAt" timestamptz not null default now(),
  status text not null default 'Pending',
  "authUserId" uuid references auth.users(id) on delete set null,
  "reviewedAt" timestamptz,
  "reviewedByProfileId" uuid references user_profiles(id) on delete set null
);

create index if not exists user_access_requests_status_idx
  on user_access_requests (status);

create index if not exists user_access_requests_email_idx
  on user_access_requests (email);

create index if not exists user_access_requests_auth_user_id_idx
  on user_access_requests ("authUserId");

create index if not exists user_profiles_approval_status_idx
  on user_profiles ("approvalStatus");

alter table user_access_requests enable row level security;

drop policy if exists "Allow authenticated read access requests" on user_access_requests;
drop policy if exists "Allow authenticated insert own access request" on user_access_requests;

create policy "Allow authenticated read access requests"
on user_access_requests
for select
to authenticated
using (true);

-- Inserts are handled by the service role in server actions.
