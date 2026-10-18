-- Gallery and menu publishing. Original uploads remain private.
begin;
create table public.media_assets (
 id uuid primary key default gen_random_uuid(),
 title text not null check (char_length(title) between 1 and 160),
 category text not null check (category in ('photo','menu')),
 destination text not null check (destination in ('drawbridge','pulau-poh','kijal')),
 storage_path text not null unique,
 mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf')),
 published boolean not null default false,
 created_at timestamptz not null default now()
);
alter table public.media_assets enable row level security;
revoke all on public.media_assets from anon,authenticated;
grant select,insert on public.media_assets to authenticated;
grant update(title,category,destination,published) on public.media_assets to authenticated;
grant all on public.media_assets to service_role;
create policy media_admin_read on public.media_assets for select to authenticated
using (exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create policy media_admin_insert on public.media_assets for insert to authenticated
with check (exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create policy media_admin_update on public.media_assets for update to authenticated
using (exists(select 1 from public.admin_users where user_id=(select auth.uid())))
with check (exists(select 1 from public.admin_users where user_id=(select auth.uid())));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('portal-media','portal-media',false,8388608,array['image/jpeg','image/png','image/webp','application/pdf']);
create policy portal_media_admin_insert on storage.objects for insert to authenticated
with check(bucket_id='portal-media' and exists(select 1 from public.admin_users where user_id=(select auth.uid())));
create policy portal_media_admin_read on storage.objects for select to authenticated
using(bucket_id='portal-media' and exists(select 1 from public.admin_users where user_id=(select auth.uid())));
commit;
