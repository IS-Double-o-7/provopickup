-- 010: Only the host may book or cancel a game, and only the host may change
-- who is playing in it.
--
-- Migration 003 required a signed-in player for every calendar write, which closed
-- the anonymous hole. It did not say *which* signed-in player, because at the time
-- every game was hosted by the seed placeholder 'me' and there was no real owner to
-- compare against. The policies were therefore:
--
--   book event      insert to authenticated  with check (true)
--   cancel event    delete to authenticated  using      (true)
--   add attendees   insert to authenticated  with check (true)
--   remove attendees delete to authenticated using      (true)
--
-- Any signed-in player could delete any other player's game, including one they
-- could not see on their own calendar. PR #42 gives events a real host_id, so the
-- owner now exists and the rule can finally be written.
--
-- Reads are deliberately NOT changed here. Whether the calendar is public is a
-- product decision that is still open (Issue #21, Issue #41), and the Product Owner
-- has not ruled on it. This migration is writes only.
--
-- Scope note: roster management is host-only, which is exactly what the app does
-- today (api.addGame inserts the host plus the invited players, always as the host).
-- Joining a game yourself, or leaving one you were invited to, are not features yet;
-- when they are, they need their own policy and a card of their own.
--
-- Safe to run more than once.

begin;

-- ---- event ----
drop policy if exists "book event"   on public.event;
drop policy if exists "cancel event" on public.event;

create policy "book own event" on public.event for insert to authenticated
  with check (host_id = public.current_profile_id());

create policy "cancel own event" on public.event for delete to authenticated
  using (host_id = public.current_profile_id());

-- No UPDATE policy, so a booked game still cannot be edited in place. Nothing in
-- the app updates one; reschedule would be a new card and a new policy.

-- ---- event_attendee ----
drop policy if exists "add attendees"    on public.event_attendee;
drop policy if exists "remove attendees" on public.event_attendee;

create policy "add attendee to own game" on public.event_attendee for insert to authenticated
  with check (exists (
    select 1 from public.event e
     where e.event_id = event_attendee.event_id
       and e.host_id  = public.current_profile_id()
  ));

create policy "remove attendee from own game" on public.event_attendee for delete to authenticated
  using (exists (
    select 1 from public.event e
     where e.event_id = event_attendee.event_id
       and e.host_id  = public.current_profile_id()
  ));

commit;

-- Consequence worth knowing: the 50 seed games hosted by the placeholder 'me' have
-- no auth user behind them, so no signed-in player can cancel them any more. They
-- are harmless (PR #42 stops showing them to real accounts) but they can now only
-- be removed with elevated access.
