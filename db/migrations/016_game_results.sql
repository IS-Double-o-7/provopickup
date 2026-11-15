-- 016: let players record a score and a short report on a game after it is played.
--
-- Product Owner decision (Brook, 2026-11-10): new games can only be scheduled for
-- the future (PR #55), but once a game has happened, players add its result.
--
-- What this changes on public.event:
--   1. new column `score` (free text such as "11-7, 9-11"; at most 40 characters)
--   2. an UPDATE policy: a signed-in player may update a game whose date is today
--      or earlier. Future games still cannot be edited.
--   3. column-level grants: an update may only touch score, new_people_met and note.
--      Sport, court, date, time and host stay as booked.
--
-- Ownership: like the "book event" / "cancel event" policies restored in 011, this
-- policy is shared (using true on ownership) because games are still hosted by the
-- placeholder 'me' until PR #42 lands. When 010's owner-only policies are re-applied
-- with #42, narrow this one the same way (host or attendee only).
--
-- `current_date` is the database's UTC date. Provo is behind UTC, so a game played
-- earlier today in Provo always passes. The app separately checks that the game's
-- start time has passed before it offers "Add result".
--
-- Safe to run twice. Adds nothing to existing rows (score starts null).

begin;

alter table public.event
  add column if not exists score text;

alter table public.event
  drop constraint if exists event_score_length;
alter table public.event
  add constraint event_score_length check (score is null or char_length(score) <= 40);

drop policy if exists "report played event" on public.event;
create policy "report played event"
  on public.event for update to authenticated
  using (event_date <= current_date)
  with check (event_date <= current_date);

revoke update on public.event from authenticated;
grant update (score, new_people_met, note) on public.event to authenticated;
revoke update on public.event from anon;

commit;

-- Check after applying (as a signed-in player in the app, or in SQL):
--   update event set score = '11-7' where event_date <  current_date ...  -> 1 row
--   update event set score = '11-7' where event_date >  current_date ...  -> 0 rows
--   update event set event_date = '2030-01-01' ...                        -> permission denied
