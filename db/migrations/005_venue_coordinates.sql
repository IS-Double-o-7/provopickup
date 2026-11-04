-- 005_venue_coordinates.sql
-- Maps Page Database (Sprint 2). Tracking: Issue #26.
--
-- venue had no coordinates, so nothing in the schema could place a pin. The
-- Courts page worked around it by linking to Google Maps with a name search
-- (app.js:962), which is unreliable for a venue like "North Park Fields" and
-- cannot drive an embedded map or a distance sort.
--
-- Coordinates are geocoded from OpenStreetMap (Nominatim), not estimated. Each
-- was checked to resolve to the venue itself: in particular the BYU row is the
-- outdoor tennis courts (OSM type 'pitch'), not the campus centroid, which sits
-- a few hundred metres away at 40.249807, -111.649946.
--
-- No policy change. venue stays read-only reference data for everyone.

begin;

alter table public.venue
  add column latitude  numeric(9,6),
  add column longitude numeric(9,6);

update public.venue set latitude = 40.246962, longitude = -111.639196 where venue_id = 'kiwanis';
update public.venue set latitude = 40.241679, longitude = -111.664230 where venue_id = 'rec';
update public.venue set latitude = 40.245514, longitude = -111.666089 where venue_id = 'northpark';
update public.venue set latitude = 40.245629, longitude = -111.655288 where venue_id = 'byu';
update public.venue set latitude = 40.234946, longitude = -111.644560 where venue_id = 'memorial';

-- Every venue must be mappable. There is no insert path for venue today, so
-- this cannot block anyone; it just stops a future venue arriving unplaceable.
alter table public.venue
  alter column latitude  set not null,
  alter column longitude set not null,
  add constraint venue_latitude_range  check (latitude  between -90  and 90),
  add constraint venue_longitude_range check (longitude between -180 and 180);

commit;
