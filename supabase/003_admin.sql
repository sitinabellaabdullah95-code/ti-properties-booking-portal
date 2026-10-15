-- Run after the intended owner has created and verified their Supabase Auth account.
-- No user can assign their own admin role.
insert into public.admin_users(user_id)
select id from auth.users where lower(email)='tipgroupmarketing@gmail.com' and email_confirmed_at is not null
on conflict do nothing;
