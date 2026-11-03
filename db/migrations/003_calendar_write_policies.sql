-- 003_calendar_write_policies.sql
-- Calendar Page Database (Sprint 2). Tracking: Issue #21.
--
-- event and event_attendee still carry the prototype policies written before
-- the app had accounts: INSERT with check (true) and DELETE with using (true),
-- granted to anon as well as authenticated. The site is live and the
-- publishable key ships in config.js, so a signed-out visitor can create a
-- game in someone else's name or delete any game on the calendar. AGENTS.md
-- section 12 names this as a known prototype gap.
--
-- This migration requires a signed-in player for every write. It deliberately
-- does NOT scope writes to the owner: app.js still books every game as the
-- seed placeholder ME = 'me', so a host_id = current_profile_id() check would
-- break booking for every user on the live site. Ownership scoping follows the
-- front-end change, under the Backend / Calendar Page card.
--
-- Reads are unchanged. Whether the calendar should be public at all is a
-- Product Owner decision and is asked on Issue #21.

begin;

-- event ---------------------------------------------------------------------
drop policy if exists "book event"   on public.event;
drop policy if exists "cancel event" on public.event;

create policy "book event"
  on public.event for insert to authenticated
  with check (true);

create policy "cancel event"
  on public.event for delete to authenticated
  using (true);

-- event_attendee ------------------------------------------------------------
drop policy if exists "add attendees"    on public.event_attendee;
drop policy if exists "remove attendees" on public.event_attendee;

create policy "add attendees"
  on public.event_attendee for insert to authenticated
  with check (true);

create policy "remove attendees"
  on public.event_attendee for delete to authenticated
  using (true);

-- Second layer: take the write grants away from anon outright, so the block
-- does not depend on policy evaluation alone. Reads stay.
revoke insert, update, delete on public.event          from anon;
revoke insert, update, delete on public.event_attendee from anon;

commit;
