-- Report-only historical rows. Customer import data must NEVER be committed here.
begin;
create table if not exists public.booking_report_archive (
 id uuid primary key,
 source_key text not null,
 source_sha256 text not null check(source_sha256 ~ '^[a-f0-9]{64}$'),
 source_sheet text not null,
 source_row integer not null check(source_row>=9),
 report_year integer not null check(report_year between 2020 and 2100),
 report_month integer not null check(report_month between 1 and 12),
 event_date date not null,
 cells jsonb not null check(jsonb_typeof(cells)='array' and jsonb_array_length(cells)=14),
 correction_note text,
 imported_at timestamptz not null default now(),
 unique(source_key,source_sheet,source_row),
 check(extract(year from event_date)=report_year and extract(month from event_date)=report_month)
);
alter table public.booking_report_archive enable row level security;
revoke all on public.booking_report_archive from anon,authenticated;
grant all on public.booking_report_archive to service_role;
create index if not exists booking_report_archive_period_idx on public.booking_report_archive(report_year,report_month,event_date);
comment on table public.booking_report_archive is 'Private historical report data; creates no booking, email, availability block, or quotation number.';
commit;
