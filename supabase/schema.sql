-- Schema for Placeboo / DocuMorph Document Converter
-- Jalankan skrip ini di SQL Editor Supabase Dashboard Anda (https://supabase.com/dashboard/project/hvyvumdfrnvkqmnimuot/sql)

create extension if not exists "pgcrypto";

-- 1. Tabel Riwayat & Antrean Konversi Dokumen
create table if not exists public.conversions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null default 'DM-DEFAULT',
  filename text not null,
  source_format text not null default 'PDF',
  target_format text not null default 'DOCX',
  file_size bigint not null default 0,
  result_size bigint not null default 0,
  status text not null default 'queued', -- 'queued', 'processing', 'completed', 'failed'
  progress integer not null default 0,
  download_url text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '2 hours') not null
);

-- Index untuk performa query sesi & status
create index if not exists idx_conversions_session_id on public.conversions (session_id);
create index if not exists idx_conversions_status on public.conversions (status);
create index if not exists idx_conversions_created_at on public.conversions (created_at desc);

-- 2. Keamanan Row Level Security (RLS)
alter table public.conversions enable row level security;

-- Drop policy lama jika ada untuk mencegah duplikasi
drop policy if exists "Allow all access to conversions for anon and authenticated" on public.conversions;
drop policy if exists "Public conversions select" on public.conversions;
drop policy if exists "Public conversions insert" on public.conversions;
drop policy if exists "Public conversions update" on public.conversions;
drop policy if exists "Public conversions delete" on public.conversions;

create policy "Allow all access to conversions for anon and authenticated"
  on public.conversions
  for all
  to anon, authenticated
  using (true)
  with check (true);

grant all on public.conversions to anon, authenticated, service_role;

-- 3. Storage Bucket Dokumen (Optional untuk menyimpan berkas fisik)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  true,
  52428800, -- 50 MB
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'text/plain', 'text/csv']
)
on conflict (id) do nothing;

-- Kebijakan Storage
drop policy if exists "Public Access to documents" on storage.objects;
drop policy if exists "Public Upload to documents" on storage.objects;
drop policy if exists "Public Delete on documents" on storage.objects;

create policy "Public Access to documents"
  on storage.objects for select
  to anon, authenticated
  using ( bucket_id = 'documents' );

create policy "Public Upload to documents"
  on storage.objects for insert
  to anon, authenticated
  with check ( bucket_id = 'documents' );

create policy "Public Delete on documents"
  on storage.objects for delete
  to anon, authenticated
  using ( bucket_id = 'documents' );

-- Notifikasi reload schema API
notify pgrst, 'reload schema';
