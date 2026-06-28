-- Facilities and teams foundation for AdmitGrid administration.
-- Run after user-auth-setup.sql.

create table if not exists facilities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now()
);

create unique index if not exists facilities_name_unique_idx
  on facilities (lower(trim(name)));

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  "facilityId" uuid not null references facilities(id) on delete restrict,
  "teamType" text not null,
  "createdAt" timestamptz not null default now()
);

create index if not exists teams_facility_id_idx
  on teams ("facilityId");

create unique index if not exists teams_facility_name_unique_idx
  on teams ("facilityId", lower(trim(name)));

create table if not exists user_team_assignments (
  id uuid primary key default gen_random_uuid(),
  "userProfileId" uuid not null references user_profiles(id) on delete cascade,
  "teamId" uuid not null references teams(id) on delete cascade,
  unique ("userProfileId", "teamId")
);

create index if not exists user_team_assignments_user_profile_id_idx
  on user_team_assignments ("userProfileId");

create index if not exists user_team_assignments_team_id_idx
  on user_team_assignments ("teamId");

alter table facilities enable row level security;
alter table teams enable row level security;
alter table user_team_assignments enable row level security;

drop policy if exists "Allow authenticated read facilities" on facilities;
create policy "Allow authenticated read facilities"
on facilities
for select
to authenticated
using (true);

drop policy if exists "Allow authenticated read teams" on teams;
create policy "Allow authenticated read teams"
on teams
for select
to authenticated
using (true);

drop policy if exists "Allow authenticated read user team assignments" on user_team_assignments;
create policy "Allow authenticated read user team assignments"
on user_team_assignments
for select
to authenticated
using (true);
