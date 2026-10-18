begin;
create table public.notification_settings(id boolean primary key default true check(id),email_enabled boolean not null default false);
insert into public.notification_settings(id) values(true);
alter table public.notification_settings enable row level security;
revoke all on public.notification_settings from anon,authenticated;
grant select on public.notification_settings to authenticated;
grant all on public.notification_settings to service_role;
create policy notification_settings_admin on public.notification_settings for select to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create table public.email_outbox(id uuid primary key default gen_random_uuid(),booking_id uuid unique references public.bookings(id),kind text not null default 'confirmation' check(kind in ('confirmation','test')),state text not null default 'queued' check(state in ('queued','processing','accepted','failed','review','skipped')),created_at timestamptz not null default now(),started_at timestamptz,finished_at timestamptz,error_code text,message_id text,check((kind='test' and booking_id is null) or (kind='confirmation' and booking_id is not null)));
alter table public.email_outbox enable row level security;
revoke all on public.email_outbox from anon,authenticated;
grant select on public.email_outbox to authenticated;
grant all on public.email_outbox to service_role;
create policy email_outbox_admin_read on public.email_outbox for select to authenticated using(exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create function private.queue_confirmation_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='confirmed' and old.status is distinct from 'confirmed' and exists(select 1 from public.notification_settings where id=true and email_enabled) and new.event_type not like 'Buffet Ramadan%' then
 insert into public.email_outbox(booking_id) values(new.id) on conflict(booking_id) do nothing;
 end if;return new;
end;$$;
revoke all on function private.queue_confirmation_email() from public,anon,authenticated;
create trigger queue_confirmation_email after update of status on public.bookings for each row execute function private.queue_confirmation_email();
create function public.claim_confirmation_email() returns setof public.email_outbox language plpgsql security invoker set search_path='' as $$
begin
 -- An interrupted SMTP transaction has an uncertain outcome. Never resend it automatically.
 update public.email_outbox set state='review',error_code='INTERRUPTED_CHECK_BEFORE_RESEND' where state='processing' and started_at<now()-interval '5 minutes';
 return query with candidate as (select id from public.email_outbox where state='queued' and (kind='test' or exists(select 1 from public.notification_settings where id=true and email_enabled)) order by created_at for update skip locked limit 1) update public.email_outbox e set state='processing',started_at=now() from candidate c where e.id=c.id returning e.*;
end;$$;
revoke all on function public.claim_confirmation_email() from public,anon,authenticated;
grant execute on function public.claim_confirmation_email() to service_role;
-- A single harmless connectivity test, addressed only to the company sender by server code.
insert into public.email_outbox(kind) values('test');
commit;
