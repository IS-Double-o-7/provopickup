-- 013: Stop games being booked centuries away.
--
-- The game form's date input had no bounds, so anything typed was accepted.
-- Live rows found before this migration:
--   1779-07-15 01:00  (demo host 'me', created 2026-10-16)
--   1779-07-15 18:00  (demo host 'me', created 2026-10-16)
--   1984-11-29 03:00  (demo host 'me', created 2026-11-09)
--
-- The constraint uses fixed dates rather than current_date on purpose: a CHECK
-- with a non-immutable expression makes existing rows silently invalid as time
-- passes and breaks dump/restore.
--
-- It is added NOT VALID so the three historical rows above are left alone.
-- Every INSERT and UPDATE from now on is checked. Clean up the old rows and
-- run `alter table public.event validate constraint event_date_in_range;`
-- separately, as a decision about deleting data.
--
-- Note: past dates stay legal by design. The Calendar page offers to "log ones
-- you already played so your stats stay honest", and 50 seeded games sit in the
-- past. The front end narrows this further to a 30-day look-back.

begin;

alter table public.event
  add constraint event_date_in_range
  check (event_date >= date '2026-01-01' and event_date <= date '2031-01-01')
  not valid;

commit;
