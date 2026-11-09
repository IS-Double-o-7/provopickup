-- Rollback of migration 010, restoring the policy set issue #21 approved.
--
-- Why: 010 requires host_id = current_profile_id() for INSERT and DELETE on
-- event, but main's app.js still sends host_id = 'me' (app.js:534, 560) and
-- all 50 existing games are hosted by 'me'. Live consequence, proven against
-- the live project with the app's exact payload:
--   book  -> refused 42501 (the game never appears)
--   undo  -> refused 42501 (restoreGame uses the same insert)
--   cancel-> deletes 0 rows silently (the game returns on reload)
-- Issue #21 named this risk explicitly and placed ownership scoping out of
-- its scope for exactly this reason.
--
-- Re-apply 010 only together with the front-end fix in PR #42, which books
-- as the signed-in player.

begin;

drop policy if exists "book own event"   on public.event;
drop policy if exists "cancel own event" on public.event;

create policy "book event"
  on public.event for insert to authenticated
  with check (true);

create policy "cancel event"
  on public.event for delete to authenticated
  using (true);

drop policy if exists "add attendee to own game"      on public.event_attendee;
drop policy if exists "remove attendee from own game" on public.event_attendee;

create policy "add attendees"
  on public.event_attendee for insert to authenticated
  with check (true);

create policy "remove attendees"
  on public.event_attendee for delete to authenticated
  using (true);

commit;
