-- 008: Take away privileges the anonymous role has never used.
--
-- Why this exists
-- ---------------
-- `anon` currently holds TRUNCATE on all 13 public tables, and
-- INSERT/UPDATE/DELETE on 10 of them. Nothing in the app uses any of it.
--
-- Row-level security already blocks the INSERT/UPDATE/DELETE: RLS is enabled on
-- every table and no policy grants `anon` a write, and "no permissive policy"
-- means deny. So those grants are a missing second lock rather than an open door.
--
-- TRUNCATE is the one that matters. TRUNCATE is NOT subject to row-level
-- security -- it is a table-level operation, so every row policy we have written
-- is silent on it. Emptying a table is not a policy violation; it is a permitted
-- operation for anyone holding the privilege. It is not reachable through
-- PostgREST today, which is why this is hardening and not an incident.
--
-- What is deliberately NOT changed
-- --------------------------------
-- * `anon`'s SELECT grants. Public reads -- the courts list, venue coordinates,
--   the public event feed -- must keep working. Nothing here touches them.
-- * The `authenticated` role. Its privileges are unchanged.
-- * Any policy. This migration only removes grants.
--
-- Safe to run more than once: REVOKE on a privilege that is already absent is a
-- no-op, not an error.

begin;

-- 1. TRUNCATE on everything. This is the one RLS does not cover.
revoke truncate on all tables in schema public from anon;

-- 2. Writes on the ten tables that still carry them. (event, event_attendee and
--    messages were already revoked by migrations 003 and 004.)
revoke insert, update, delete on
  public.choice,
  public.interests,
  public.photo,
  public.profile,
  public.profile_availability,
  public.profile_interest,
  public.profile_private,
  public.reporting,
  public.venue,
  public.venue_interest
from anon;

-- 3. REFERENCES and TRIGGER. An anonymous visitor has no business adding a
--    foreign key or a trigger to our tables.
revoke references, trigger on all tables in schema public from anon;

-- 4. Make sure future tables do not hand these back out again. Without this,
--    the next `create table` re-grants the full set to anon by Supabase default
--    and we quietly reopen what we just closed.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon;

commit;

-- Check: should return zero rows.
--
-- select grantee, privilege_type, table_name
-- from information_schema.role_table_grants
-- where table_schema = 'public'
--   and grantee = 'anon'
--   and privilege_type in ('TRUNCATE','INSERT','UPDATE','DELETE','REFERENCES','TRIGGER');
--
-- Check: public reads must still work. Should return 5 rows.
--
-- set local role anon;
-- select venue_id, latitude, longitude from public.venue;
