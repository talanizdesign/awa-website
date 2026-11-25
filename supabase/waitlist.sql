-- getawa.app waiting list. Run once in Supabase → SQL Editor (project in Frankfurt).
--
-- The list lives in its own schema, "waitlist". Supabase's public API only serves the "public"
-- schema, so nobody can read or change this table from the outside, not even with the app's
-- publishable key. Only the "waitlist" Edge Function touches it, through a direct database connection.

create schema if not exists waitlist;
revoke all on schema waitlist from public, anon, authenticated;

create table if not exists waitlist.people (
  email        text primary key check (email = lower(email) and length(email) <= 254),
  token_hash   text not null unique,              -- sha-256 of the link in the email, never the link itself
  created_at   timestamptz not null default now(),
  confirmed_at timestamptz,                       -- empty until the person clicks "Confirm my email"
  last_sent_at timestamptz not null default now(),
  sends        smallint not null default 1        -- confirmation emails sent; capped at 3 per address
);

revoke all on all tables in schema waitlist from public, anon, authenticated;
alter table waitlist.people enable row level security;  -- a second lock, with no policies: nobody gets in through the API

-- Unconfirmed addresses are deleted after 7 days (privacy-policy-points.md, "Website waiting list").
create extension if not exists pg_cron;

select cron.unschedule('waitlist-forget-unconfirmed')
where exists (select 1 from cron.job where jobname = 'waitlist-forget-unconfirmed');

select cron.schedule(
  'waitlist-forget-unconfirmed',
  '17 3 * * *',  -- every night at 03:17 UTC
  $$delete from waitlist.people where confirmed_at is null and created_at < now() - interval '7 days'$$
);

-- To see the list later:  select email, created_at, confirmed_at from waitlist.people order by created_at;
