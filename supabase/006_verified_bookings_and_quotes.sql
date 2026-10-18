begin;
alter table public.bookings add column email_verified_at timestamptz;
create table public.portal_rate_limits(key text primary key,window_start timestamptz not null default now(),hits integer not null default 1);
alter table public.portal_rate_limits enable row level security;
revoke all on public.portal_rate_limits from anon,authenticated; grant all on public.portal_rate_limits to service_role;
create function public.portal_rate_limit(bucket text,max_hits integer,window_seconds integer) returns boolean language sql security invoker set search_path='' as $$
 insert into public.portal_rate_limits(key) values(bucket) on conflict(key) do update set hits=case when portal_rate_limits.window_start<now()-make_interval(secs=>window_seconds) then 1 else portal_rate_limits.hits+1 end,window_start=case when portal_rate_limits.window_start<now()-make_interval(secs=>window_seconds) then now() else portal_rate_limits.window_start end returning hits<=max_hits;
$$;
revoke all on function public.portal_rate_limit(text,integer,integer) from public,anon,authenticated;grant execute on function public.portal_rate_limit(text,integer,integer) to service_role;
create table public.booking_quotes(id uuid primary key default gen_random_uuid(),booking_id uuid not null references public.bookings(id),storage_path text not null unique,message text not null default '' check(length(message)<=4000),created_at timestamptz not null default now(),opened_at timestamptz,archived boolean not null default false);
alter table public.booking_quotes enable row level security;
revoke all on public.booking_quotes from anon,authenticated;
grant select on public.booking_quotes to authenticated;
grant update(archived) on public.booking_quotes to authenticated;
grant all on public.booking_quotes to service_role;
create policy quotes_admin_read on public.booking_quotes for select to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create policy quotes_admin_archive on public.booking_quotes for update to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid()))) with check(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('portal-quotes','portal-quotes',false,8388608,array['application/pdf']);
create policy quote_admin_insert on storage.objects for insert to authenticated with check(bucket_id='portal-quotes' and exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create policy quote_admin_read on storage.objects for select to authenticated using(bucket_id='portal-quotes' and exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create table public.portal_verifications(id uuid primary key,token_digest text not null,code_digest text not null,email text not null,purpose text not null check(purpose in ('booking','quote')),payload jsonb,quote_id uuid references public.booking_quotes(id),attempts integer not null default 0,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '10 minutes',consumed boolean not null default false,booking_id uuid references public.bookings(id),access_digest text,access_expires_at timestamptz,check((purpose='booking' and payload is not null and quote_id is null) or (purpose='quote' and quote_id is not null and payload is null)));
alter table public.portal_verifications enable row level security;
revoke all on public.portal_verifications from anon,authenticated;grant all on public.portal_verifications to service_role;
alter table public.email_outbox drop constraint email_outbox_booking_id_key,drop constraint email_outbox_kind_check,drop constraint email_outbox_check;
alter table public.email_outbox add column verification_id uuid unique references public.portal_verifications(id),add column quote_id uuid unique references public.booking_quotes(id),add unique(booking_id,kind),add check(kind in ('test','confirmation','receipt','otp','quote')),add check((kind='test' and booking_id is null and verification_id is null and quote_id is null) or (kind in ('confirmation','receipt') and booking_id is not null and verification_id is null and quote_id is null) or (kind='otp' and verification_id is not null and booking_id is null and quote_id is null) or (kind='quote' and quote_id is not null and booking_id is null and verification_id is null));
create or replace function private.queue_confirmation_email() returns trigger language plpgsql security definer set search_path='' as $$ begin
 if new.status='confirmed' and old.status is distinct from 'confirmed' and exists(select 1 from public.notification_settings where id=true and email_enabled) and new.event_type not like 'Buffet Ramadan%' then insert into public.email_outbox(booking_id,kind) values(new.id,'confirmation') on conflict(booking_id,kind) do nothing;end if;return new;end;$$;
revoke all on function private.queue_confirmation_email() from public,anon,authenticated;
-- Old deployment workers only take message kinds they understand during the rollout.
create or replace function public.claim_confirmation_email() returns setof public.email_outbox language plpgsql security invoker set search_path='' as $$ begin
 return query with candidate as(select id from public.email_outbox where state='queued' and kind in ('confirmation','test') and (kind='test' or exists(select 1 from public.notification_settings where id=true and email_enabled)) order by created_at for update skip locked limit 1) update public.email_outbox e set state='processing',started_at=now() from candidate c where e.id=c.id returning e.*;end;$$;
revoke all on function public.claim_confirmation_email() from public,anon,authenticated;grant execute on function public.claim_confirmation_email() to service_role;
create function public.claim_portal_email(target_id uuid default null) returns setof public.email_outbox language plpgsql security invoker set search_path='' as $$ begin
 update public.email_outbox set state='review',error_code='INTERRUPTED_CHECK_BEFORE_RESEND' where state='processing' and started_at<now()-interval '5 minutes';
 return query with candidate as(select id from public.email_outbox where state='queued' and (target_id is null or id=target_id) and (kind in ('test','otp','quote','receipt') or exists(select 1 from public.notification_settings where id=true and email_enabled)) order by case when kind='otp' then 0 else 1 end,created_at for update skip locked limit 1) update public.email_outbox e set state='processing',started_at=now() from candidate c where e.id=c.id returning e.*;end;$$;
revoke all on function public.claim_portal_email(uuid) from public,anon,authenticated;grant execute on function public.claim_portal_email(uuid) to service_role;
create function public.verify_portal_code(challenge uuid,token_hash text,code_hash text,access_hash text default null) returns jsonb language plpgsql security invoker set search_path='' as $$
declare v public.portal_verifications; b uuid;
begin
 select * into v from public.portal_verifications where id=challenge and token_digest=token_hash for update;
 if not found then return jsonb_build_object('state','invalid');end if;
 if v.consumed then return jsonb_build_object('state','consumed','booking_id',v.booking_id);end if;
 if v.expires_at<=now() then return jsonb_build_object('state','expired');end if;
 if v.attempts>=5 then return jsonb_build_object('state','locked');end if;
 update public.portal_verifications set attempts=attempts+1 where id=v.id;
 if v.code_digest<>code_hash then return jsonb_build_object('state','invalid');end if;
 if v.purpose='booking' then
 if v.payload->>'event_date'<to_char(now() at time zone 'Asia/Kuala_Lumpur','YYYY-MM-DD') then return jsonb_build_object('state','expired');end if;
 b=public.submit_enquiry(v.payload);
 update public.bookings set email_verified_at=now() where id=b;
 update public.portal_verifications set consumed=true,booking_id=b,payload=null where id=v.id;
 -- Keep the original request private; payload is cleared after successful creation.
 insert into public.email_outbox(booking_id,kind) values(b,'receipt') on conflict(booking_id,kind) do nothing;
 return jsonb_build_object('state','verified','booking_id',b);
 end if;
 if not exists(select 1 from public.booking_quotes where id=v.quote_id and not archived) then return jsonb_build_object('state','expired');end if;
 update public.portal_verifications set consumed=true,access_digest=access_hash,access_expires_at=now()+interval '15 minutes' where id=v.id;
 return jsonb_build_object('state','verified','quote_id',v.quote_id);
end;$$;
revoke all on function public.verify_portal_code(uuid,text,text,text) from public,anon,authenticated;grant execute on function public.verify_portal_code(uuid,text,text,text) to service_role;
-- Consumed booking challenges clear the original form payload.
alter table public.portal_verifications drop constraint portal_verifications_check;
alter table public.portal_verifications add check((purpose='booking' and quote_id is null and (payload is not null or consumed)) or (purpose='quote' and quote_id is not null and payload is null));
create function public.publish_booking_quote(booking uuid,file_path text,customer_message text) returns uuid language plpgsql security invoker set search_path='' as $$
declare q uuid;begin
 if not exists(select 1 from public.bookings where id=booking and status not in ('cancelled','rejected')) then raise exception 'BOOKING_UNAVAILABLE';end if;
 insert into public.booking_quotes(booking_id,storage_path,message) values(booking,file_path,customer_message) returning id into q;
 insert into public.email_outbox(quote_id,kind) values(q,'quote');return q;end;$$;
revoke all on function public.publish_booking_quote(uuid,text,text) from public,anon,authenticated;grant execute on function public.publish_booking_quote(uuid,text,text) to service_role;
commit;
