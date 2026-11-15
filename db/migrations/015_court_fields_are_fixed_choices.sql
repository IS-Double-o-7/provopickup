-- 015: Lock the venue columns that the Courts page prints to fixed choices.
--
-- Why this exists. Migration 014 opened INSERT on public.venue to any signed-in
-- player. That policy only checks `added_by`; it says nothing about what goes in
-- the other columns. The Courts page prints setting, unit, court_count and
-- venue_id into the page, so a player calling the REST API directly with the
-- publishable key could store markup in one of those columns and have it run in
-- every other player's browser. kyle-claude caught this on PR #53.
--
-- The escaping fix in app.js (placeCard) is the real defence and ships with that
-- PR. This migration is the second layer: even if someone later writes a new
-- template that forgets esc(), these columns cannot hold anything but the
-- handful of words the form offers.
--
-- These constraints are created VALID, not NOT VALID: every row already in the
-- table passes. Checked against the live project before writing this file --
-- settings are Indoor/Outdoor, units are courts/fields, every venue_id already
-- matches the id pattern, and the only busy_note outside the app's four options
-- is the seeded 'Quiet weekdays', which is added to the allowed list below and
-- to COURT_BUSY in app.js so the form and the database agree.

begin;

-- Indoor or Outdoor. Nothing else is rendered sensibly by the Courts page.
alter table public.venue add constraint venue_setting_choice
  check (setting in ('Indoor', 'Outdoor'));

-- What the court_count counts.
alter table public.venue add constraint venue_unit_choice
  check (unit in ('courts', 'fields', 'nets', 'lanes'));

-- How busy it gets. Null is allowed; the page just omits the pill.
alter table public.venue add constraint venue_busy_note_choice
  check (busy_note is null or busy_note in
    ('Quiet', 'Quiet weekdays', 'Steady all day', 'Busy evenings', 'Busy weekends'));

-- venue_id is written into a data-id attribute and compared against game rows,
-- so keep it to the slug shape app.js generates: lowercase, digits, hyphens.
alter table public.venue add constraint venue_id_is_a_slug
  check (venue_id ~ '^[a-z0-9][a-z0-9-]*$' and length(venue_id) <= 40);

commit;
