create table if not exists referral_documents (
  id uuid primary key default gen_random_uuid(),
  "referralId" uuid not null references referrals(id) on delete cascade,
  "fileName" text not null,
  "filePath" text not null,
  "documentType" text not null default 'Clinical Packet',
  "uploadedAt" timestamptz not null default now(),
  "uploadedBy" text not null default 'Marketer'
);

create index if not exists referral_documents_referral_id_idx
  on referral_documents ("referralId");

create index if not exists referral_documents_uploaded_at_idx
  on referral_documents ("uploadedAt" desc);

alter table referral_documents enable row level security;

drop policy if exists "Allow public read referral documents" on referral_documents;
drop policy if exists "Allow public insert referral documents" on referral_documents;
drop policy if exists "Allow public update referral documents" on referral_documents;
drop policy if exists "Allow public delete referral documents" on referral_documents;

create policy "Allow public read referral documents"
on referral_documents
for select
to public
using (true);

create policy "Allow public insert referral documents"
on referral_documents
for insert
to public
with check (true);

create policy "Allow public update referral documents"
on referral_documents
for update
to public
using (true)
with check (true);

create policy "Allow public delete referral documents"
on referral_documents
for delete
to public
using (true);
