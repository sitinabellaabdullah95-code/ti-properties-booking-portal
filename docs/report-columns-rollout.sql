begin;
alter table public.booking_report_details add column if not exists cells_override jsonb check (cells_override is null or (jsonb_typeof(cells_override)='array' and jsonb_array_length(cells_override)=14));
alter table public.booking_report_archive add column if not exists cells_override jsonb check (cells_override is null or (jsonb_typeof(cells_override)='array' and jsonb_array_length(cells_override)=14));
alter table public.booking_report_details enable row level security;
alter table public.booking_report_archive enable row level security;
revoke all on public.booking_report_details,public.booking_report_archive from anon,authenticated;
grant all on public.booking_report_details,public.booking_report_archive to service_role;
alter table public.booking_quotes add column if not exists amount numeric(12,2) check(amount>=0 and amount<=100000000), add column if not exists sst_rate numeric(5,2) check(sst_rate>=0 and sst_rate<=100);
create or replace function public.publish_quote_with_amount(booking uuid,file_path text,customer_message text,quote_total numeric,quote_sst numeric) returns uuid language plpgsql security invoker set search_path='' as $$
declare q uuid;begin
 if quote_total is null or quote_total<0 or quote_total>100000000 or quote_total<>round(quote_total,2) or (quote_sst is not null and (quote_sst<0 or quote_sst>100)) then raise exception 'INVALID_AMOUNT';end if;
 q:=public.publish_booking_quote(booking,file_path,customer_message);
 update public.booking_quotes set amount=quote_total,sst_rate=quote_sst where id=q;
 return q;
end;$$;
revoke all on function public.publish_quote_with_amount(uuid,text,text,numeric,numeric) from public,anon,authenticated;
grant execute on function public.publish_quote_with_amount(uuid,text,text,numeric,numeric) to service_role;
commit;
select table_name,column_name from information_schema.columns where table_schema='public' and column_name='cells_override' and table_name in ('booking_report_details','booking_report_archive');
