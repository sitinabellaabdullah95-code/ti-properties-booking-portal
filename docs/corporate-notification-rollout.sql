-- Apply once after deploying the worker that understands corporate_booking.
begin;
alter table public.email_outbox drop constraint email_outbox_kind_check,drop constraint email_outbox_check;
alter table public.email_outbox add constraint email_outbox_kind_check check(kind in ('test','confirmation','receipt','otp','quote','corporate_booking'));
alter table public.email_outbox add constraint email_outbox_check check(
 (kind='test' and booking_id is null and verification_id is null and quote_id is null)
 or (kind in ('confirmation','receipt','corporate_booking') and booking_id is not null and verification_id is null and quote_id is null)
 or (kind='otp' and verification_id is not null and booking_id is null and quote_id is null)
 or (kind='quote' and quote_id is not null and booking_id is null and verification_id is null));
create function private.queue_corporate_booking_email() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.email_outbox(booking_id,kind) values(new.id,'corporate_booking') on conflict(booking_id,kind) do nothing;
 return new;
end;$$;
revoke all on function private.queue_corporate_booking_email() from public,anon,authenticated,service_role;
create trigger queue_corporate_booking_email after insert on public.bookings for each row execute function private.queue_corporate_booking_email();
create or replace function public.claim_portal_email(target_id uuid default null) returns setof public.email_outbox language plpgsql security invoker set search_path='' as $$ begin
 update public.email_outbox set state='review',error_code='INTERRUPTED_CHECK_BEFORE_RESEND' where state='processing' and started_at<now()-interval '5 minutes';
 return query with candidate as(select id from public.email_outbox where state='queued' and (target_id is null or id=target_id) and (kind in ('test','otp','quote','receipt','corporate_booking') or exists(select 1 from public.notification_settings where id=true and email_enabled)) order by case when kind='otp' then 0 else 1 end,created_at for update skip locked limit 1) update public.email_outbox e set state='processing',started_at=now() from candidate c where e.id=c.id returning e.*;
end;$$;
revoke all on function public.claim_portal_email(uuid) from public,anon,authenticated;
grant execute on function public.claim_portal_email(uuid) to service_role;
commit;
