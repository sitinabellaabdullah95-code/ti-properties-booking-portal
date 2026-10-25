begin;
create or replace function public.admin_record_booking(request_id uuid,payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;chosen uuid;v public.venues;begin
 if payload->>'status' not in ('pending','confirmed') then raise exception 'INVALID_STATUS';end if;
 select * into strict v from public.venues where id=(payload->>'venue_id')::uuid and active;
 select id into strict chosen from public.units where id=(payload->>'unit_id')::uuid and venue_id=v.id and active;
 insert into public.bookings(id,venue_id,unit_id,customer_name,organisation,email,phone,event_type,event_date,end_date,start_time,end_time,pax,notes,status)
 values(request_id,v.id,chosen,payload->>'customer_name',payload->>'organisation',lower(payload->>'email'),payload->>'phone',payload->>'event_type',(payload->>'event_date')::date,(payload->>'end_date')::date,(payload->>'start_time')::time,(payload->>'end_time')::time,(payload->>'pax')::integer,payload->>'notes','pending') on conflict(id) do nothing returning id into result;
 if result is null then return request_id;end if;
 if payload->>'status'='confirmed' then update public.bookings set status='confirmed' where id=result;end if;
 return result;
end;$$;
revoke all on function public.admin_record_booking(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.admin_record_booking(uuid,jsonb) to service_role;
commit;
