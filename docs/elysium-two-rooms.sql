begin;
insert into public.venues(name,location,description,kind,active)
select 'VVIP Meeting Room Level 2',location,'VVIP meeting room, Level 2. 8–10 guests only.','event',true from public.venues where name='Elysium Hall'
on conflict(name) do update set description=excluded.description,active=true;
update public.units set name='Hall Utama Level 3 (Elysium Hall)' where venue_id=(select id from public.venues where name='Elysium Hall') and name='Ruang utama';
insert into public.units(venue_id,name,active) select id,'VVIP Meeting Room Level 2',true from public.venues where name='VVIP Meeting Room Level 2' on conflict(venue_id,name) do nothing;
create or replace function private.check_vvip_pax() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if exists(select 1 from public.venues where id=new.venue_id and name='VVIP Meeting Room Level 2') and new.pax not between 8 and 10 then
 raise exception 'VVIP Meeting Room Level 2: 8-10 pax only' using errcode='23514';
 end if;return new;
end;$$;
revoke all on function private.check_vvip_pax() from public,anon,authenticated;
create trigger vvip_pax_guard before insert or update of venue_id,pax on public.bookings for each row execute function private.check_vvip_pax();
commit;
select v.name,u.name as unit_name,v.kind from public.venues v join public.units u on u.venue_id=v.id where v.name in ('Elysium Hall','VVIP Meeting Room Level 2') and u.active;
