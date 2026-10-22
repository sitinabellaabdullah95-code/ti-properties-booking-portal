begin;
lock table public.bookings in share row exclusive mode;
alter table public.bookings add column public_reference text;
create table private.booking_reference_counter(id boolean primary key default true check(id),last_value bigint not null check(last_value>=179));
alter table private.booking_reference_counter enable row level security;
revoke all on private.booking_reference_counter from public,anon,authenticated,service_role;
insert into private.booking_reference_counter values(true,179);
do $$ declare b record; n bigint; begin
for b in select id,created_at from public.bookings order by created_at,id loop
 update private.booking_reference_counter set last_value=last_value+1 where id returning last_value into n;
 update public.bookings set public_reference='TIP/DB/QUO/'||to_char(b.created_at at time zone 'Asia/Kuala_Lumpur','YY')||'/'||n::text where id=b.id;
end loop;end $$;
alter table public.bookings alter column public_reference set not null;
alter table public.bookings add constraint bookings_reference_unique unique(public_reference),add constraint bookings_reference_format check(public_reference ~ '^TIP/DB/QUO/[0-9]{2}/[0-9]{3,}$');
create function private.assign_booking_reference() returns trigger language plpgsql security definer set search_path='' as $$ declare n bigint; begin
 if tg_op='UPDATE' then
  if new.public_reference is distinct from old.public_reference then raise exception 'REFERENCE_IMMUTABLE';end if;
  return new;
 end if;
 update private.booking_reference_counter set last_value=last_value+1 where id=true returning last_value into n;
 if n is null then raise exception 'REFERENCE_COUNTER_UNAVAILABLE';end if;
 new.public_reference='TIP/DB/QUO/'||to_char(now() at time zone 'Asia/Kuala_Lumpur','YY')||'/'||n::text;
 return new;
end $$;
revoke all on function private.assign_booking_reference() from public,anon,authenticated,service_role;
create trigger assign_booking_reference before insert or update of public_reference on public.bookings for each row execute function private.assign_booking_reference();
commit;
select count(*) as numbered_bookings,count(distinct public_reference) as unique_references,min(public_reference) as first_reference from public.bookings;
select 'TIP/DB/QUO/'||to_char(now() at time zone 'Asia/Kuala_Lumpur','YY')||'/'||(last_value+1)::text as next_reference from private.booking_reference_counter;