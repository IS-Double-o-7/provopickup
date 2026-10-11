-- Rally Provo / Provo Pickup — schema
-- Run this first in the Supabase SQL Editor, then run seed.sql.
--
-- Entities follow the team ERD. Venue, Event and EventAttendee were added so the
-- calendar "book event" feature has somewhere to write.
-- Postgres lowercases unquoted names, so ProfileID in the diagram is profile_id here.

create table profile (
  profile_id        text primary key,
  name              text not null,
  bio               text,
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
  unique (swiper, swiped_on)
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

-- ---- Row-level security ----
-- Classroom prototype: there is no sign-in yet, so every visitor is the anonymous
-- role. RLS is ON for every table; reference data is read-only and only the calendar
-- slice may be written. When real auth lands, replace the "true" checks with
-- auth.uid() rules.

alter table profile          enable row level security;
alter table interests        enable row level security;
alter table profile_interest enable row level security;
alter table photo            enable row level security;
alter table choice           enable row level security;
alter table messages         enable row level security;
alter table reporting        enable row level security;
alter table venue            enable row level security;
alter table venue_interest   enable row level security;
alter table event            enable row level security;
alter table event_attendee   enable row level security;

create policy "read profile"          on profile          for select to anon, authenticated using (true);
create policy "read interests"        on interests        for select to anon, authenticated using (true);
create policy "read profile_interest" on profile_interest for select to anon, authenticated using (true);
create policy "read photo"            on photo            for select to anon, authenticated using (true);
create policy "read choice"           on choice           for select to anon, authenticated using (true);
create policy "read messages"         on messages         for select to anon, authenticated using (true);
create policy "read reporting"        on reporting        for select to anon, authenticated using (true);
create policy "read venue"            on venue            for select to anon, authenticated using (true);
create policy "read venue_interest"   on venue_interest   for select to anon, authenticated using (true);

create policy "read event"   on event for select to anon, authenticated using (true);
create policy "book event"   on event for insert to anon, authenticated with check (true);
create policy "cancel event" on event for delete to anon, authenticated using (true);

create policy "read attendees"   on event_attendee for select to anon, authenticated using (true);
create policy "add attendees"    on event_attendee for insert to anon, authenticated with check (true);
create policy "remove attendees" on event_attendee for delete to anon, authenticated using (true);
