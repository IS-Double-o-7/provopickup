-- Rally Provo — migration 002
-- Column-level privacy for profile.auth_uid, and owner-scoped reads for
-- messages and reporting.
--
-- Raised by megan-codeex on PR #8 and Issue #4, and she is right: row-level
-- security does not restrict columns, so the "read profile" policy
-- (using (true) for anon) exposed every column of profile — including
-- auth_uid, each player's Supabase Auth UUID. auth_uid is not on the candidate
-- field list Brook approved on 2026-10-28.
--
-- Verified before writing this: as the anon role, `select auth_uid from
-- profile` succeeded. The values are null today only because no real account
-- has a profile row yet, so the exposure was latent rather than live — the
-- first real sign-up would have published that user's Auth UUID.
--
-- messages and reporting are included because AGENTS.md section 12 already
-- forbids exposing reports and personal information to anonymous users, so
-- these are the approved rules being applied rather than a new team decision.
-- Neither table is wired to the app yet, so nothing breaks.

begin;

-- ---------------------------------------------------------------------------
-- 1. profile: hide auth_uid behind column privileges
-- ---------------------------------------------------------------------------
-- RLS decides which ROWS a client may see; GRANT decides which COLUMNS. Both
-- are needed. The "read profile" policy stays as it is — every player is still
-- a visible candidate — but the readable columns are now named explicitly.

revoke select on public.profile from anon, authenticated;

grant select (profile_id, name, bio) on public.profile to anon, authenticated;

-- A signed-in user still has to write their own auth_uid when creating their
-- profile row, so INSERT keeps that column. UPDATE deliberately does not:
-- once set, the mapping is immutable from the client.
grant insert (profile_id, name, bio, auth_uid) on public.profile to authenticated;
grant update (name, bio)                       on public.profile to authenticated;

-- Note for the client: do NOT select auth_uid to find your own row. Call
-- public.current_profile_id() instead. It is SECURITY DEFINER, so it reads
-- auth_uid as the function owner and returns only your own profile_id.
-- Policy expressions such as "auth_uid = auth.uid()" are evaluated as part of
-- the table's security definition and are not subject to column privileges,
-- so the insert and update policies keep working.

-- ---------------------------------------------------------------------------
-- 2. messages: participants only
-- ---------------------------------------------------------------------------

drop policy "read messages" on public.messages;

create policy "read own messages"
  on public.messages for select to authenticated
  using (sender_id = public.current_profile_id()
      or receiver_id = public.current_profile_id());

-- ---------------------------------------------------------------------------
-- 3. reporting: the reporter only
-- ---------------------------------------------------------------------------

drop policy "read reporting" on public.reporting;

create policy "read own reports"
  on public.reporting for select to authenticated
  using (reporter = public.current_profile_id());

commit;
