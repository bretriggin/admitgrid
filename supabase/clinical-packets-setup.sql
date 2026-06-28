-- Clinical packet storage bucket and referral metadata columns.
-- Run in the Supabase SQL editor or via the CLI.

insert into storage.buckets (id, name, public)
values ('clinical-packets', 'clinical-packets', false)
on conflict (id) do nothing;

alter table referrals
  add column if not exists "clinicalPacketPath" text,
  add column if not exists "clinicalPacketFilename" text,
  add column if not exists "clinicalPacketUploadedAt" timestamptz;

drop policy if exists "Allow public read clinical packets" on storage.objects;
drop policy if exists "Allow public upload clinical packets" on storage.objects;
drop policy if exists "Allow public update clinical packets" on storage.objects;
drop policy if exists "Allow public delete clinical packets" on storage.objects;

create policy "Allow public read clinical packets"
on storage.objects
for select
to public
using (bucket_id = 'clinical-packets');

create policy "Allow public upload clinical packets"
on storage.objects
for insert
to public
with check (bucket_id = 'clinical-packets');

create policy "Allow public update clinical packets"
on storage.objects
for update
to public
using (bucket_id = 'clinical-packets')
with check (bucket_id = 'clinical-packets');

create policy "Allow public delete clinical packets"
on storage.objects
for delete
to public
using (bucket_id = 'clinical-packets');
