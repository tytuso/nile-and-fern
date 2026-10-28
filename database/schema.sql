-- New app-specific tables. No existing Nile Core application data is modified.
create table public.nft_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'operator' check(role in ('owner','operator')),
  created_at timestamptz not null default now()
);
alter table public.nft_staff enable row level security;
revoke all on public.nft_staff from anon,authenticated;
grant select on public.nft_staff to authenticated;
grant all on public.nft_staff to service_role;
create policy "Identify own Nile Fern staff membership" on public.nft_staff for select to authenticated using(user_id=(select auth.uid()));

create table public.nft_enquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique check(reference ~ '^NF-[0-9]{4}-[A-F0-9]{10}$'),
  receipt_token_hash text not null check(receipt_token_hash ~ '^[a-f0-9]{64}$'),
  kind text not null check(kind in ('trip','question')),
  journey text not null default 'custom' check(char_length(journey)<=80),
  destinations text[] not null default '{}' check(cardinality(destinations)<=6 and destinations <@ array['bwindi','murchison','queen-elizabeth','kibale','jinja','bunyonyi']::text[]),
  month text not null default '' check(month='' or month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
  flexible boolean not null default true,
  days integer not null check(days between 2 and 21),
  adults integer not null check(adults between 1 and 16),
  children integer not null default 0 check(children between 0 and 8),
  budget text not null check(char_length(budget)<=100),
  comfort text not null check(char_length(comfort)<=100),
  name text not null check(char_length(name) between 2 and 100),
  email text not null check(char_length(email) between 3 and 254),
  phone text not null default '' check(char_length(phone)<=30),
  country text not null default '' check(char_length(country)<=80),
  message text not null default '' check(char_length(message)<=2000),
  status text not null default 'New' check(status in ('New','In planning','Proposal ready','Closed')),
  public_summary text not null default 'Your sample enquiry has been received.' check(char_length(public_summary)<=600),
  staff_notes text not null default '' check(char_length(staff_notes)<=3000),
  is_demo boolean not null default true check(is_demo=true),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(kind='question' or cardinality(destinations)>0)
);
create index nft_enquiries_created_idx on public.nft_enquiries(created_at desc);
create index nft_enquiries_status_idx on public.nft_enquiries(status,created_at desc);
alter table public.nft_enquiries enable row level security;
revoke all on public.nft_enquiries from anon,authenticated;
grant select on public.nft_enquiries to authenticated;
grant update(status,public_summary,staff_notes,updated_at) on public.nft_enquiries to authenticated;
grant all on public.nft_enquiries to service_role;
create policy "Assigned operators can read Nile Fern enquiries" on public.nft_enquiries for select to authenticated using(exists(select 1 from public.nft_staff where user_id=(select auth.uid())));
create policy "Assigned operators can update Nile Fern enquiries" on public.nft_enquiries for update to authenticated using(exists(select 1 from public.nft_staff where user_id=(select auth.uid()))) with check(exists(select 1 from public.nft_staff where user_id=(select auth.uid())) and is_demo=true);

create table public.nft_intake_limits (
  bucket text primary key,
  attempts integer not null default 1,
  expires_at timestamptz not null
);
alter table public.nft_intake_limits enable row level security;
revoke all on public.nft_intake_limits from anon,authenticated;
grant all on public.nft_intake_limits to service_role;
create policy "No browser access to Nile Fern intake limits" on public.nft_intake_limits for all to anon,authenticated using(false) with check(false);
create function public.nft_consume_intake_limit(p_bucket text,p_limit integer,p_seconds integer)
returns boolean language plpgsql security invoker set search_path='' as $$
declare current_attempts integer;
begin
  if char_length(p_bucket)>255 or p_limit<1 or p_limit>100 or p_seconds<10 or p_seconds>3600 then return false; end if;
  insert into public.nft_intake_limits(bucket,attempts,expires_at)
  values(p_bucket,1,now()+make_interval(secs=>p_seconds))
  on conflict(bucket) do update set
    attempts=case when public.nft_intake_limits.expires_at<now() then 1 else public.nft_intake_limits.attempts+1 end,
    expires_at=case when public.nft_intake_limits.expires_at<now() then now()+make_interval(secs=>p_seconds) else public.nft_intake_limits.expires_at end
  returning attempts into current_attempts;
  delete from public.nft_intake_limits where expires_at<now()-interval '1 day';
  return current_attempts<=p_limit;
end $$;
revoke all on function public.nft_consume_intake_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.nft_consume_intake_limit(text,integer,integer) to service_role;

-- Assign a confirmed owner separately after applying the schema.
-- Workspace membership is managed privately and is not seeded from public source.