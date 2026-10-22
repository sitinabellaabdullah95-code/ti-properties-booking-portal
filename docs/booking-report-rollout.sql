-- Additive setup. Original customer workbook is not imported.
begin;
create table if not exists public.booking_report_details (
 booking_id uuid primary key references public.bookings(id) on delete cascade,
 amount numeric(12,2) check(amount>=0 and amount<=100000000),
 sst_rate numeric(5,2) check(sst_rate>=0 and sst_rate<=100),
 sector text not null default '' check(length(sector)<=80),
 payment_method text not null default '' check(length(payment_method)<=120),
 sales_person text not null default '' check(length(sales_person)<=160),
 ops_incharge text not null default '' check(length(ops_incharge)<=160),
 remarks text not null default '' check(length(remarks)<=2000),
 updated_at timestamptz not null default now()
);
alter table public.booking_report_details enable row level security;
revoke all on public.booking_report_details from anon, authenticated;
grant all on public.booking_report_details to service_role;
comment on column public.booking_report_details.amount is 'Admin-entered agreed quotation amount inclusive of applicable SST; null means not entered.';
commit;
