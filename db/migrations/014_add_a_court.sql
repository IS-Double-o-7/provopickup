-- 014: Let a signed-in player add a court.
--
-- Before this, venue and venue_interest had SELECT policies and nothing else,
-- so the Courts page could only ever show the five seeded courts. This adds the
-- write side, scoped so a player can only add a court attributed to themselves
-- and can only remove one they added.
--
-- Depends on PR #39 (Issue #31): until Courts reads `venue`, a row inserted
-- here appears nowhere in the app.
--
-- Run against the live project before merging the Courts "add a court" PR.
begin;

-- Who added this court. Null means it came from the seed, which is why the
-- delete policy below can never touch a seeded court.
alter table public.venue
  add column if not exists added_by text
  references public.profile(profile_id) on delete set null;

-- Sanity bounds. All five existing rows already satisfy every one of these
-- (checked against the live table: names 13-19 chars, counts 2-8, all
-- coordinates inside Provo), so these are added validated, not NOT VALID.
alter table public.venue
  add constraint venue_name_not_blank
  check (btrim(venue_name) <> '' and length(venue_name) <= 80);

alter table public.venue
  add constraint venue_court_count_sane
  check (court_count is null or court_count between 1 and 99);

-- Rally Provo is a Provo app. A court outside Utah County is a typo or spam,
-- and the box below is generous: the seeded courts sit near 40.24, -111.65.
alter table public.venue
  add constraint venue_in_utah_county
  check (latitude between 39.9 and 40.6 and longitude between -112.3 and -111.0);

-- Writes.
--
-- Note what this deliberately does NOT do: there is no policy letting anyone
-- UPDATE a venue, and no policy letting anyone delete a seeded one. A player
-- can add a court and remove their own mistake, nothing else.
create policy "add venue" on public.venue
  for insert to authenticated
  with check (added_by = public.current_profile_id());

create policy "remove own venue" on public.venue
  for delete to authenticated
  using (added_by is not null and added_by = public.current_profile_id());

-- The sports a court is for. Same ownership rule: you may tag the courts you
-- added, and no others.
create policy "add venue_interest" on public.venue_interest
  for insert to authenticated
  with check (exists (
    select 1 from public.venue v
    where v.venue_id = venue_interest.venue_id
      and v.added_by = public.current_profile_id()));

create policy "remove own venue_interest" on public.venue_interest
  for delete to authenticated
  using (exists (
    select 1 from public.venue v
    where v.venue_id = venue_interest.venue_id
      and v.added_by = public.current_profile_id()));

commit;
