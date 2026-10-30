-- Private document workflow; no browser role receives direct table or storage access.
create table if not exists public.digital_quotations (
 id uuid primary key,ref text not null,title text not null,customer text not null,event_date date not null,event_type text not null,month text not null,payload jsonb not null,status text not null default 'draft' check(status in ('draft','pending','returned','approved')),revision integer not null default 1 check(revision>0),manager_comment text not null default '',submitted_at text,approved_at text,approved_by text,approved_revision integer,pdf_key text,pdf_hash text,created_at text not null,updated_at text not null,updated_by text not null
);
create table if not exists public.digital_quotation_history (id uuid primary key,quote_id uuid not null references public.digital_quotations(id),revision integer not null,action text not null,actor_email text not null,comment text not null default '',at text not null);
create index if not exists digital_quotes_date_idx on public.digital_quotations(event_date,updated_at);
create index if not exists digital_history_quote_idx on public.digital_quotation_history(quote_id,at);
alter table public.digital_quotations enable row level security;
alter table public.digital_quotation_history enable row level security;
revoke all on public.digital_quotations,public.digital_quotation_history from anon,authenticated;
grant all on public.digital_quotations,public.digital_quotation_history to service_role;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('digital-documents','digital-documents',false,15000000,array['application/zip','application/pdf']) on conflict(id) do nothing;
select tablename,rowsecurity from pg_tables where schemaname='public' and tablename in ('digital_quotations','digital_quotation_history');
