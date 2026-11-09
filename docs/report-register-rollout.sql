-- Register additions remain private and separate from bookings and calendar availability.
begin;
alter table public.booking_report_details
  add column if not exists report_hidden boolean not null default false,
  add column if not exists extra_values jsonb not null default '{}' check (jsonb_typeof(extra_values) = 'object');
alter table public.booking_report_archive
  add column if not exists report_hidden boolean not null default false,
  add column if not exists extra_values jsonb not null default '{}' check (jsonb_typeof(extra_values) = 'object');

create table if not exists public.booking_report_manual (
  id uuid primary key,
  cells jsonb not null check (jsonb_typeof(cells) = 'array' and jsonb_array_length(cells) = 14),
  extra_values jsonb not null default '{}' check (jsonb_typeof(extra_values) = 'object'),
  report_hidden boolean not null default false
);

create table if not exists public.booking_report_extra_columns (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(btrim(label)) between 1 and 60),
  report_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index if not exists booking_report_extra_column_label
  on public.booking_report_extra_columns (lower(btrim(label)));

alter table public.booking_report_manual enable row level security;
alter table public.booking_report_extra_columns enable row level security;
revoke all on public.booking_report_manual, public.booking_report_extra_columns from public, anon, authenticated;
grant select, insert, update on public.booking_report_manual, public.booking_report_extra_columns to service_role;
commit;
