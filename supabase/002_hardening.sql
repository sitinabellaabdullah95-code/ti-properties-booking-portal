-- Apply after schema.sql. Do not run against an unrelated production database.
create extension if not exists btree_gist;
alter table public.venues add column kind text not null default 'event' check(kind in ('event','stay'));
update public.venues set kind='stay' where name='Kijal Permai Apartment';
alter table public.bookings add column end_date date;
update public.bookings set end_date=event_date;
alter table public.bookings alter column end_date set not null;
alter table public.bookings add constraint valid_booking_span check(end_date>=event_date and end_date<=event_date+366 and (end_date>event_date or start_time<end_time));
alter table public.bookings drop constraint valid_booking_time;
create table public.units(id uuid primary key default gen_random_uuid(),venue_id uuid not null references public.venues(id),name text not null,active boolean not null default true,unique(venue_id,name),unique(id,venue_id));
insert into public.units(venue_id,name) select id,'Ruang utama' from public.venues where kind='event';
insert into public.units(venue_id,name) select v.id,'Unit '||lpad(n::text,2,'0') from public.venues v cross join generate_series(1,12) n where v.kind='stay';
alter table public.units enable row level security;
create policy "admins read units" on public.units for select to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
alter table public.bookings add column unit_id uuid;
alter table public.bookings add foreign key(unit_id,venue_id) references public.units(id,venue_id);
update public.bookings b set unit_id=u.id from public.units u where b.venue_id=u.venue_id and u.name='Ruang utama';
alter table public.bookings add constraint confirmed_requires_unit check(status not in ('confirmed','completed') or unit_id is not null);
drop trigger if exists booking_conflict_guard on public.bookings;
-- Database enforces overlap safety even for concurrent confirmations.
alter table public.bookings add constraint no_double_booking exclude using gist (unit_id with =,tsrange(event_date+start_time,end_date+end_time,'[)') with &&) where(status in ('confirmed','completed'));
create table public.booking_audit(id bigint generated always as identity primary key,booking_id uuid not null references public.bookings(id),actor uuid,old_status text,new_status text,old_unit uuid,new_unit uuid,changed_at timestamptz not null default now());
alter table public.booking_audit enable row level security;
create policy "admins read audit" on public.booking_audit for select to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create function public.audit_booking_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status is distinct from old.status or new.unit_id is distinct from old.unit_id then
 insert into public.booking_audit(booking_id,actor,old_status,new_status,old_unit,new_unit) values(new.id,auth.uid(),old.status,new.status,old.unit_id,new.unit_id);
 end if;return new;end $$;
create trigger audit_booking after update on public.bookings for each row execute function public.audit_booking_change();
revoke update on public.bookings from authenticated;
grant update(status,unit_id) on public.bookings to authenticated;
-- Serialize submissions per email to prevent races in the durable rate limit.
create table public.enquiry_limits(key text primary key,window_start timestamptz not null,hits integer not null);
alter table public.enquiry_limits enable row level security;
revoke all on public.enquiry_limits from anon,authenticated;
create function public.submit_enquiry(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid; v public.venues; chosen_unit uuid; hit_count integer;
begin
 if length(payload->>'rate_key')<>64 then raise exception 'INVALID_RATE_KEY';end if;
 insert into public.enquiry_limits(key,window_start,hits) values(payload->>'rate_key',now(),1)
 on conflict(key) do update set hits=case when public.enquiry_limits.window_start<now()-interval '1 hour' then 1 else public.enquiry_limits.hits+1 end,window_start=case when public.enquiry_limits.window_start<now()-interval '1 hour' then now() else public.enquiry_limits.window_start end returning hits into hit_count;
 if hit_count>10 then raise exception 'RATE_LIMIT';end if;
 delete from public.enquiry_limits where window_start<now()-interval '2 days';
 perform pg_advisory_xact_lock(hashtextextended(lower(payload->>'email'),0));
 if (select count(*) from public.bookings where email=lower(payload->>'email') and created_at>now()-interval '1 hour')>=5 then raise exception 'RATE_LIMIT';end if;
 select * into strict v from public.venues where id=(payload->>'venue_id')::uuid and active;
 if v.kind='event' then select id into chosen_unit from public.units where venue_id=v.id and active limit 1;end if;
 insert into public.bookings(venue_id,unit_id,customer_name,organisation,email,phone,event_type,event_date,end_date,start_time,end_time,pax,notes)
 values(v.id,chosen_unit,payload->>'customer_name',payload->>'organisation',lower(payload->>'email'),payload->>'phone',payload->>'event_type',(payload->>'event_date')::date,(payload->>'end_date')::date,(payload->>'start_time')::time,(payload->>'end_time')::time,(payload->>'pax')::integer,payload->>'notes') returning id into result;
 return result;end $$;
revoke all on function public.submit_enquiry(jsonb) from public,anon,authenticated;
grant execute on function public.submit_enquiry(jsonb) to service_role;
revoke all on function public.audit_booking_change() from public,anon,authenticated;
-- No anonymous SELECT/INSERT/UPDATE grants on customer records.
revoke all on public.bookings,public.admin_users,public.booking_audit,public.units from anon;
