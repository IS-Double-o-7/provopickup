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

-- When a player is free. The eight slots are the keys of SLOTS in app.js.
create table profile_availability (
  profile_availability_id bigint generated always as identity primary key,
  profile_id text not null references profile(profile_id) on delete cascade,
  slot       text not null check (slot in (
    'Mon eve','Tue eve','Wed eve','Thu eve','Fri eve','Sat am','Sat pm','Sun pm')),
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
  sent_at     timestamptz not null default now()
);

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
  miles_away  numeric(4,1),
  busy_note   text
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
-- Known gaps, deliberately left for a team decision (see GitHub #3/#4):
--   * event and event_attendee still allow anonymous insert and delete, from
--     the pre-auth calendar slice. Tightening them would break the working
--     calendar for a signed-out visitor, so it is left for a team decision.

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

create policy "read own reports" on reporting for select to authenticated
  using (reporter = public.current_profile_id());

create policy "write own choices" on choice for all to authenticated
  using (swiper = public.current_profile_id())
  with check (swiper = public.current_profile_id());

-- The calendar slice predates sign-in and still writes as the anonymous role.
create policy "read event"   on event for select to anon, authenticated using (true);
create policy "book event"   on event for insert to anon, authenticated with check (true);
create policy "cancel event" on event for delete to anon, authenticated using (true);

create policy "read attendees"   on event_attendee for select to anon, authenticated using (true);
create policy "add attendees"    on event_attendee for insert to anon, authenticated with check (true);
create policy "remove attendees" on event_attendee for delete to anon, authenticated using (true);

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
