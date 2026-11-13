-- Rally Provo / Provo Pickup — schema
-- Run this first in the Supabase SQL Editor, then run seed.sql.
--
-- Entities follow the team ERD. Venue, Event and EventAttendee were added so the
-- calendar "book event" feature has somewhere to write.
-- Postgres lowercases unquoted names, so ProfileID in the diagram is profile_id here.

create table profile (
  profile_id text primary key,
  name       text not null,
  bio        text,
  -- Supabase Auth user. Null for the seed/demo profiles, which nobody can claim.
  auth_uid   uuid unique references auth.users(id) on delete cascade
);

-- Contact details and moderation data. Split out of profile so the profile
-- table itself is safe for other players to read. Owner-only.
create table profile_private (
  profile_id        text primary key references profile(profile_id) on delete cascade,
  birthday          date,
  home_phone        text,
  cell_phone        text,
  work_phone        text,
  reporting_counter integer not null default 0
);

create table interests (
  interest_id   text primary key,
  interest_name text not null,
  icon          text,
  community     text
);

-- Many-to-many: a player plays many sports, a sport has many players.
create table profile_interest (
  pi_id       bigint generated always as identity primary key,
  user_id     text not null references profile(profile_id) on delete cascade,
  interest_id text not null references interests(interest_id) on delete cascade,
  skill_level text,
  start_date  date,
  end_date    date,
  unique (user_id, interest_id)
);

-- When a player is free: every day in three parts (am, pm, eve). The 21 slots
-- are the keys of SLOTS in app.js (see db/migrations/007).
create table profile_availability (
  profile_availability_id bigint generated always as identity primary key,
  profile_id text not null references profile(profile_id) on delete cascade,
  slot       text not null check (slot in (
    'Mon am', 'Mon pm', 'Mon eve',
    'Tue am', 'Tue pm', 'Tue eve',
    'Wed am', 'Wed pm', 'Wed eve',
    'Thu am', 'Thu pm', 'Thu eve',
    'Fri am', 'Fri pm', 'Fri eve',
    'Sat am', 'Sat pm', 'Sat eve',
    'Sun am', 'Sun pm', 'Sun eve')),
  unique (profile_id, slot)
);

create table photo (
  photo_id         bigint generated always as identity primary key,
  user_id          text not null references profile(profile_id) on delete cascade,
  display_order_id integer not null default 1,
  photo_file       text
);

-- One swipe decision. Two foreign keys back to profile.
create table choice (
  choice_id  bigint generated always as identity primary key,
  swiper     text not null references profile(profile_id) on delete cascade,
  swiped_on  text not null references profile(profile_id) on delete cascade,
  yes        boolean not null default false,
  no         boolean not null default false,
  unique (swiper, swiped_on),
  -- exactly one of yes/no is true: a like or a pass, never both and never neither
  constraint choice_exactly_one_decision check (yes <> no)
);

create table messages (
  message_id  bigint generated always as identity primary key,
  choice_id   bigint references choice(choice_id) on delete cascade,
  sender_id   text not null references profile(profile_id) on delete cascade,
  receiver_id text not null references profile(profile_id) on delete cascade,
  message     text not null,
  sent_at     timestamptz not null default now(),
  -- Null means unread. Only the receiver may set it (see the policy below).
  read_at     timestamptz
);

create index messages_unread_idx on messages (receiver_id) where read_at is null;

create table reporting (
  reporting_id bigint generated always as identity primary key,
  reporter     text not null references profile(profile_id) on delete cascade,
  reported_on  text not null references profile(profile_id) on delete cascade,
  reported_at  timestamptz not null default now(),
  why          text
);

-- ---- Added so the calendar slice has somewhere to write ----

create table venue (
  venue_id    text primary key,
  venue_name  text not null,
  setting     text,
  court_count integer,
  unit        text,
  -- Static distance from the original mock-up. It does not say distance from
  -- where, so it cannot be right for more than one player; with latitude and
  -- longitude below, distance should be computed from the player instead.
  miles_away  numeric(4,1),
  busy_note   text,
  -- Geocoded from OpenStreetMap. Every venue must be mappable (Issue #26).
  latitude    numeric(9,6) not null,
  longitude   numeric(9,6) not null,
  constraint venue_latitude_range  check (latitude  between -90  and 90),
  constraint venue_longitude_range check (longitude between -180 and 180)
);

-- Many-to-many: a court hosts several sports.
create table venue_interest (
  venue_interest_id bigint generated always as identity primary key,
  venue_id          text not null references venue(venue_id) on delete cascade,
  interest_id       text not null references interests(interest_id) on delete cascade,
  unique (venue_id, interest_id)
);

-- A scheduled or already-played game. This is what the vertical slice writes.
create table event (
  event_id        uuid primary key default gen_random_uuid(),
  host_id         text not null references profile(profile_id) on delete cascade,
  interest_id     text not null references interests(interest_id),
  venue_id        text not null references venue(venue_id),
  event_date      date not null,
  event_time      time not null,
  note            text,
  new_people_met  integer not null default 0,
  score           text constraint event_score_length check (score is null or char_length(score) <= 40),  -- added in 016
  created_at      timestamptz not null default now()
);

-- Many-to-many: a player joins many games, a game has many players.
create table event_attendee (
  event_attendee_id bigint generated always as identity primary key,
  event_id          uuid not null references event(event_id) on delete cascade,
  profile_id        text not null references profile(profile_id) on delete cascade,
  status            text not null default 'going',
  unique (event_id, profile_id)
);

create index on event (event_date);
create index on event_attendee (event_id);
create index on messages (choice_id, sent_at);
create index on profile_availability (profile_id);

-- ---- Helper functions ----
-- Resolve the signed-in Auth user to their profile_id. SECURITY DEFINER because
-- a policy on profile that queried profile would recurse; search_path is pinned
-- empty and every reference is schema-qualified.

create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select profile_id from public.profile where auth_uid = auth.uid() $$;

grant execute on function public.current_profile_id() to anon, authenticated;

-- A match requires a like in both directions. SECURITY DEFINER so it can see
-- the reciprocal row without a policy that would expose unreciprocated likes.

create or replace function public.my_matches()
returns table (profile_id text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.swiped_on
  from public.choice c
  join public.choice r
    on r.swiper = c.swiped_on
   and r.swiped_on = c.swiper
  where c.swiper = public.current_profile_id()
    and c.yes
    and r.yes
$$;

grant execute on function public.my_matches() to authenticated;

-- ---- Row-level security ----
-- RLS is ON for every table. Reference data and the safe profile columns are
-- readable by anyone; a signed-in user may write only their own rows.
--
-- Known gaps, deliberately left for a team decision (see GitHub #3/#4/#21):
--   * event and event_attendee require a signed-in player to write, but writes
--     are not yet scoped to the owner. app.js books every game as the seed
--     placeholder 'me', so a host_id = current_profile_id() check would break
--     booking. Ownership scoping follows the front-end change (Issue #21).

alter table profile              enable row level security;
alter table profile_private      enable row level security;
alter table interests            enable row level security;
alter table profile_interest     enable row level security;
alter table profile_availability enable row level security;
alter table photo                enable row level security;
alter table choice               enable row level security;
alter table messages             enable row level security;
alter table reporting            enable row level security;
alter table venue                enable row level security;
alter table venue_interest       enable row level security;
alter table event                enable row level security;
alter table event_attendee       enable row level security;

-- Reads. profile now holds only profile_id, name, bio and auth_uid, so it is
-- safe to expose; contact details live in profile_private.
create policy "read profile"              on profile              for select to anon, authenticated using (true);

-- RLS decides which ROWS are visible; GRANT decides which COLUMNS. auth_uid is
-- a player's Supabase Auth UUID and is not on the approved candidate field
-- list, so it is withheld at the column level. To find your own row, call
-- current_profile_id() rather than selecting auth_uid.
revoke select on profile from anon, authenticated;
grant select (profile_id, name, bio)           on profile to anon, authenticated;
grant insert (profile_id, name, bio, auth_uid) on profile to authenticated;
grant update (name, bio)                       on profile to authenticated;
create policy "read interests"            on interests            for select to anon, authenticated using (true);
create policy "read profile_interest"     on profile_interest     for select to anon, authenticated using (true);
create policy "read availability"         on profile_availability for select to anon, authenticated using (true);
create policy "read photo"                on photo                for select to anon, authenticated using (true);

create policy "read venue"                on venue                for select to anon, authenticated using (true);
create policy "read venue_interest"       on venue_interest       for select to anon, authenticated using (true);

-- A pending like is not visible: you may read only the rows where you are the
-- swiper. Mutual matches come back through my_matches().
create policy "read own choices" on choice for select to authenticated
  using (swiper = public.current_profile_id());

-- Writes. A signed-in user owns exactly one profile, keyed to their Auth id.
create policy "insert own profile" on profile for insert to authenticated
  with check (auth_uid = auth.uid() and profile_id = auth.uid()::text);

create policy "update own profile" on profile for update to authenticated
  using (auth_uid = auth.uid())
  with check (auth_uid = auth.uid());

create policy "own private fields" on profile_private for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "write own interests" on profile_interest for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

create policy "write own availability" on profile_availability for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "write own photo" on photo for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- Direct messages are visible to their two participants, and a report only to
-- the player who filed it.
create policy "read own messages" on messages for select to authenticated
  using (sender_id = public.current_profile_id()
      or receiver_id = public.current_profile_id());

-- You may send only as yourself, and only to a confirmed mutual match. DELETE
-- has no policy, so there is no unsend; UPDATE is narrowed to read_at just
-- below, so there is no edit either (Issues #23, #31).
create policy "send to a match" on messages for insert to authenticated
  with check (sender_id = public.current_profile_id()
          and receiver_id in (select profile_id from public.my_matches()));

revoke insert, update, delete on messages from anon;

-- Marking a message read is an UPDATE, but there must still be no edit or
-- unsend. `authenticated` keeps no table-wide update grant: UPDATE is granted
-- on read_at alone, so message, sender_id, receiver_id and sent_at are
-- unreachable at the privilege layer. The policy then limits it to your own
-- incoming messages (#31).
revoke update on messages from authenticated;
grant  update (read_at) on messages to authenticated;

create policy "mark own messages read" on messages for update to authenticated
  using      (receiver_id = public.current_profile_id())
  with check (receiver_id = public.current_profile_id());

create policy "read own reports" on reporting for select to authenticated
  using (reporter = public.current_profile_id());

create policy "write own choices" on choice for all to authenticated
  using (swiper = public.current_profile_id())
  with check (swiper = public.current_profile_id());

-- Calendar: anyone may read the schedule; any signed-in player may change it.
--
-- Migration 010 scoped these writes to the game's host, and migration 011 undid
-- that. The policy was correct but premature: app.js books every game as the
-- literal placeholder `ME = 'me'` (app.js:534, 560) and all 50 seeded games are
-- hosted by 'me', so requiring host_id = current_profile_id() refused every
-- booking and silently cancelled nothing. Issue #21 had placed ownership scoping
-- out of scope for exactly this reason.
--
-- Re-apply ownership scoping together with the front-end fix (PR #42), not before.
-- Until then a signed-in player can cancel any game, which is a known gap, and
-- reads are open on purpose pending the product decision in #21 and #41.
create policy "read event" on event for select to anon, authenticated using (true);

create policy "book event" on event for insert to authenticated
  with check (true);

create policy "cancel event" on event for delete to authenticated
  using (true);
-- 016: after a game is played, players can record its result (score, people met, note only).
create policy "report played event" on event for update to authenticated
  using (event_date <= current_date) with check (event_date <= current_date);
revoke update on event from authenticated;
grant update (score, new_people_met, note) on event to authenticated;

-- No UPDATE policy, so a booked game cannot be edited in place. Nothing in the app
-- updates one; reschedule would need its own card and its own policy.

create policy "read attendees" on event_attendee for select to anon, authenticated using (true);

create policy "add attendees" on event_attendee for insert to authenticated
  with check (true);

create policy "remove attendees" on event_attendee for delete to authenticated
  using (true);

-- Second layer, so the block does not rest on policy evaluation alone.
revoke insert, update, delete on event          from anon;
revoke insert, update, delete on event_attendee from anon;

-- ---- Anonymous privilege floor (migration 008) ----
-- RLS already denies anonymous writes everywhere: every table has row security
-- on and no policy grants anon an INSERT, UPDATE or DELETE. These revokes are
-- the second lock, so a missing or mistaken policy is not the only thing
-- standing between a visitor and the data.
--
-- TRUNCATE is the one that genuinely needs this. TRUNCATE is not subject to row
-- security at all, so none of the policies above constrain it. Emptying a table
-- is not a policy violation, it is a permitted operation for whoever holds the
-- privilege.
--
-- anon keeps every SELECT grant: public reads must keep working.
revoke truncate on all tables in schema public from anon;
revoke references, trigger on all tables in schema public from anon;
revoke insert, update, delete on
  choice, interests, photo, profile, profile_availability, profile_interest,
  profile_private, reporting, venue, venue_interest
from anon;

-- Supabase hands new tables the full grant set by default, which would quietly
-- reopen this the next time someone runs `create table`.
alter default privileges in schema public
  revoke truncate, references, trigger on tables from anon;

-- ---- Storage ----
-- Profile photos: bucket 'profile-photos', one folder per Auth user,
-- <auth.uid()>/<filename>. Public read; owner-only write.

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

create policy "profile photos are publicly readable"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'profile-photos');

create policy "a user writes only their own photo folder"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "a user updates only their own photo folder"
  on storage.objects for update to authenticated
  using (bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text);

create policy "a user deletes only their own photo folder"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text);

-- ---- 18+ rule and age bands (migration 016) ----
-- Rally Provo matches strangers for meetups, so players must be 18 or older
-- (Brook's decision as Product Owner, issue #7). The rule lives here as well as
-- in the profile form so it does not depend on the form.
--
-- This is a trigger, not a CHECK constraint, because "at least 18 years old" is
-- relative to today and a CHECK may only hold immutable expressions. Postgres
-- allows current_date in a CHECK without complaint, which is the trap: the
-- expression is baked into the dump, so a restore re-checks old rows against a
-- new date and rows that were legal when written start failing.

create or replace function public.profile_private_check_age()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birthday is null then
    return new;  -- no birthday yet is allowed; the profile just counts as incomplete
  end if;
  if new.birthday > current_date then
    raise exception 'That birthday is in the future.' using errcode = '23514';
  end if;
  if new.birthday < date '1900-01-01' then
    raise exception 'Check that birthday -- the year looks wrong.' using errcode = '23514';
  end if;
  if new.birthday > current_date - interval '18 years' then
    raise exception 'You must be 18 or older to use Rally Provo.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists profile_private_check_age on public.profile_private;
create trigger profile_private_check_age
  before insert or update of birthday on public.profile_private
  for each row execute function public.profile_private_check_age();

-- The band a birthday falls in. STABLE, not IMMUTABLE: the answer depends on
-- today, so this must never go in a CHECK constraint or a plain index.
create or replace function public.age_band(bd date)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when bd is null then null
    when extract(year from age(current_date, bd)) < 18 then '18-'  -- legacy rows only
    when extract(year from age(current_date, bd)) < 25 then '18-24'
    when extract(year from age(current_date, bd)) < 35 then '25-34'
    when extract(year from age(current_date, bd)) < 45 then '35-44'
    when extract(year from age(current_date, bd)) < 55 then '45-54'
    else '55+'
  end;
$$;

-- Counts per band for the Admin page. Admin-only and counts-only, like
-- okr_dashboard(): birthdays live in profile_private, which is owner-only.
create or replace function public.age_bands()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return (
    with bands(band, sort) as (
      values ('18-24', 1), ('25-34', 2), ('35-44', 3), ('45-54', 4), ('55+', 5)
    ),
    players as (
      select p.profile_id, pp.birthday
      from public.profile p
      left join public.profile_private pp on pp.profile_id = p.profile_id
      where p.auth_uid is not null
    ),
    counted as (
      select b.band, b.sort,
             count(pl.profile_id) filter (where public.age_band(pl.birthday) = b.band)::int as n
      from bands b left join players pl on true
      group by b.band, b.sort
    )
    select jsonb_build_object(
      'generated_at', now(),
      'players',      (select count(*)::int from players),
      'no_birthday',  (select count(*)::int from players where birthday is null),
      'bands',        (select jsonb_agg(jsonb_build_object('band', band, 'players', n) order by sort)
                       from counted)
    )
  );
end;
$$;

revoke all on function public.age_bands() from public, anon;
grant execute on function public.age_bands() to authenticated;
