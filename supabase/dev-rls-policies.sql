-- Development RLS policies for AdmitGrid auth without a service role key.
-- Run after user-auth-setup.sql, user-access-requests-setup.sql, and facilities-teams-setup.sql.

alter table user_profiles
  add column if not exists "isSystemOwner" boolean not null default false;

create or replace function public.is_executive_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select "isExecutive"
      from public.user_profiles
      where "authUserId" = auth.uid()
      limit 1
    ),
    false
  );
$$;

create or replace function public.is_system_owner_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select "isSystemOwner"
      from public.user_profiles
      where "authUserId" = auth.uid()
      limit 1
    ),
    false
  );
$$;

create or replace function public.user_profiles_is_empty()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (select 1 from public.user_profiles);
$$;

create or replace function public.user_profiles_is_sole()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select count(*) from public.user_profiles) = 1;
$$;

create or replace function public.profile_is_system_owner(profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select "isSystemOwner"
      from public.user_profiles
      where id = profile_id
      limit 1
    ),
    false
  );
$$;

drop policy if exists "Allow bootstrap own profile" on user_profiles;
create policy "Allow bootstrap own profile"
on user_profiles
for insert
to authenticated
with check (
  auth.uid() = "authUserId"
  and public.user_profiles_is_empty()
);

drop policy if exists "Allow executive insert profiles" on user_profiles;
drop policy if exists "Allow system owner insert profiles" on user_profiles;
create policy "Allow system owner insert profiles"
on user_profiles
for insert
to authenticated
with check (public.is_system_owner_user());

drop policy if exists "Allow executive update profiles" on user_profiles;
drop policy if exists "Allow system owner update profiles" on user_profiles;
drop policy if exists "Allow sole profile system owner promotion" on user_profiles;

create policy "Allow system owner update profiles"
on user_profiles
for update
to authenticated
using (public.is_system_owner_user() and not "isSystemOwner")
with check (public.is_system_owner_user() and not "isSystemOwner");

create policy "Allow sole profile system owner promotion"
on user_profiles
for update
to authenticated
using (
  auth.uid() = "authUserId"
  and public.user_profiles_is_sole()
)
with check (auth.uid() = "authUserId");

drop policy if exists "Allow bootstrap own roles" on user_roles;
create policy "Allow bootstrap own roles"
on user_roles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.user_profiles
    where user_profiles.id = "userProfileId"
      and user_profiles."authUserId" = auth.uid()
  )
);

drop policy if exists "Allow executive insert roles" on user_roles;
drop policy if exists "Allow system owner insert roles" on user_roles;
create policy "Allow system owner insert roles"
on user_roles
for insert
to authenticated
with check (
  public.is_system_owner_user()
  and not public.profile_is_system_owner("userProfileId")
);

drop policy if exists "Allow executive delete roles" on user_roles;
drop policy if exists "Allow system owner delete roles" on user_roles;
create policy "Allow system owner delete roles"
on user_roles
for delete
to authenticated
using (
  public.is_system_owner_user()
  and not public.profile_is_system_owner("userProfileId")
);

drop policy if exists "Allow public insert access requests" on user_access_requests;
create policy "Allow public insert access requests"
on user_access_requests
for insert
to anon, authenticated
with check (status = 'Pending');

drop policy if exists "Allow anon read user profiles" on user_profiles;
create policy "Allow anon read user profiles"
on user_profiles
for select
to anon
using (true);

drop policy if exists "Allow anon read access requests" on user_access_requests;
create policy "Allow anon read access requests"
on user_access_requests
for select
to anon
using (true);

drop policy if exists "Allow executive update access requests" on user_access_requests;
drop policy if exists "Allow system owner update access requests" on user_access_requests;
create policy "Allow system owner update access requests"
on user_access_requests
for update
to authenticated
using (public.is_system_owner_user())
with check (public.is_system_owner_user());

drop policy if exists "Allow system owner insert facilities" on facilities;
create policy "Allow system owner insert facilities"
on facilities
for insert
to authenticated
with check (public.is_system_owner_user());

drop policy if exists "Allow system owner update facilities" on facilities;
create policy "Allow system owner update facilities"
on facilities
for update
to authenticated
using (public.is_system_owner_user())
with check (public.is_system_owner_user());

drop policy if exists "Allow system owner insert teams" on teams;
create policy "Allow system owner insert teams"
on teams
for insert
to authenticated
with check (public.is_system_owner_user());

drop policy if exists "Allow system owner update teams" on teams;
create policy "Allow system owner update teams"
on teams
for update
to authenticated
using (public.is_system_owner_user())
with check (public.is_system_owner_user());

drop policy if exists "Allow system owner insert user team assignments" on user_team_assignments;
create policy "Allow system owner insert user team assignments"
on user_team_assignments
for insert
to authenticated
with check (
  public.is_system_owner_user()
  and not public.profile_is_system_owner("userProfileId")
);

drop policy if exists "Allow system owner delete user team assignments" on user_team_assignments;
create policy "Allow system owner delete user team assignments"
on user_team_assignments
for delete
to authenticated
using (
  public.is_system_owner_user()
  and not public.profile_is_system_owner("userProfileId")
);
