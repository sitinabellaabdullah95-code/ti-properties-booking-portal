begin;
alter table public.booking_report_archive
 add column if not exists amounts_overridden boolean not null default false,
 add column if not exists confirm_amount numeric(12,2) check(confirm_amount>=0 and confirm_amount<=100000000),
 add column if not exists tentative_amount numeric(12,2) check(tentative_amount>=0 and tentative_amount<=100000000),
 add column if not exists cancel_amount numeric(12,2) check(cancel_amount>=0 and cancel_amount<=100000000),
 add column if not exists amount_updated_at timestamptz;
-- Original imported cells remain unchanged. Existing server-only grants/RLS remain in effect.
commit;
