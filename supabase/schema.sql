create extension if not exists pgcrypto;
create table if not exists venues (id uuid primary key default gen_random_uuid(), name text not null unique, location text not null, description text, active boolean not null default true);
create table if not exists bookings (id uuid primary key default gen_random_uuid(), venue_id uuid not null references venues(id), customer_name text not null, organisation text, email text not null, phone text not null, event_type text not null, event_date date not null, start_time time not null, end_time time not null, pax integer not null check (pax > 0 and pax <= 10000), notes text, status text not null default 'pending' check(status in ('pending','quoted','awaiting_payment','confirmed','completed','rejected','cancelled')), created_at timestamptz not null default now(), constraint valid_booking_time check(start_time < end_time));
create table if not exists admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
create index if not exists booking_date_idx on bookings(venue_id,event_date,status);
alter table venues enable row level security;
alter table bookings enable row level security;
alter table admin_users enable row level security;
create policy "public can see active venues" on venues for select to anon, authenticated using (active);
create policy "admins see all bookings" on bookings for select to authenticated using (exists(select 1 from admin_users where user_id=(select auth.uid())));
create policy "admins update bookings" on bookings for update to authenticated using (exists(select 1 from admin_users where user_id=(select auth.uid()))) with check (exists(select 1 from admin_users where user_id=(select auth.uid())));
create policy "admins can identify themselves" on admin_users for select to authenticated using(user_id=(select auth.uid()));
insert into venues(name,location,description) values ('Elysium Hall','KT Drawbridge','Corporate events and dining'),('Gallery','KT Drawbridge','Private dining and events'),('Hydraulic Room','KT Drawbridge','Exclusive venue'),('Marina Dome','Pulau Poh Tasik Kenyir','Group activities and events'),('Open Space','Pulau Poh Tasik Kenyir','Outdoor events'),('Kijal Permai Apartment','Kijal','Accommodation enquiries') on conflict(name) do nothing;
-- Prevent simultaneous confirmed bookings for overlapping time ranges, including concurrent updates.
create or replace function enforce_booking_conflict() returns trigger language plpgsql as $$
begin
 if new.status='confirmed' then
  perform pg_advisory_xact_lock(hashtext(new.venue_id::text || new.event_date::text));
  if exists(select 1 from bookings b where b.venue_id=new.venue_id and b.event_date=new.event_date and b.status='confirmed' and b.id<>new.id and b.start_time<new.end_time and b.end_time>new.start_time) then
   raise exception 'Venue already confirmed for overlapping time';
  end if;
 end if;
 return new;
end $$;
drop trigger if exists booking_conflict_guard on bookings;
create trigger booking_conflict_guard before insert or update on bookings for each row execute function enforce_booking_conflict();
