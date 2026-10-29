-- Rally Provo — migration 001
-- Auth-backed profiles, availability, private contact fields, matching
-- semantics and profile photos.
--
-- Implements the contract agreed on GitHub Issues #3 and #4, with the Product
-- Owner decisions Brook recorded there on 2026-10-28:
--   * private contact fields move to an owner-only table
--   * age, distance and home court come off candidate cards
--   * a pending like is NOT visible before it is reciprocated
--   * a profile photo is required at sign-up and shown on candidate cards
--
-- Run once, in the Supabase SQL editor or via a migration tool. It is wrapped
-- in a transaction: if any statement fails nothing is applied.
--
-- NOTE: this migration MOVES data. profile.birthday and the three phone
-- columns are copied into profile_private and then dropped from profile.
-- Take a backup before running it against a database you care about.

begin;

-- ---------------------------------------------------------------------------
-- 1. Auth-to-profile mapping
-- ---------------------------------------------------------------------------
-- profile_id stays text so the eleven seed slugs, the six foreign keys that
-- reference them, and the existing event/event_attendee rows keep working.
-- Real accounts map through auth_uid instead.

alter table public.profile
  add column auth_uid uuid unique references auth.users(id) on delete cascade;

comment on column public.profile.auth_uid is
  'Supabase Auth user. Null for seed/demo profiles, which nobody can claim.';

-- Resolves the signed-in user to their profile_id. SECURITY DEFINER because a
-- policy on profile that queried profile would recurse; search_path is pinned
-- empty and every reference is schema-qualified.
create or replace function public.current_profile_id()
returns text
language sql
stable
security definer
set search_path = ''
as $$ select profile_id from public.profile where auth_uid = auth.uid() $$;

grant execute on function public.current_profile_id() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Availability
-- ---------------------------------------------------------------------------
-- The eight slot strings are exactly the keys of SLOTS in app.js. The check
-- constraint rejects a typo instead of silently storing it.

create table public.profile_availability (
  profile_availability_id bigint generated always as identity primary key,
  profile_id text not null references public.profile(profile_id) on delete cascade,
  slot       text not null check (slot in (
    'Mon eve','Tue eve','Wed eve','Thu eve','Fri eve','Sat am','Sat pm','Sun pm')),
  unique (profile_id, slot)
);

create index on public.profile_availability (profile_id);

-- Backfill the seed profiles from the avail arrays in app.js, so matching has
-- something to compute shared slots against.
insert into public.profile_availability (profile_id, slot) values
  ('me','Tue eve'),     ('me','Thu eve'),     ('me','Sat am'),
  ('jamie','Tue eve'),  ('jamie','Thu eve'),  ('jamie','Sat am'),
  ('marcus','Mon eve'), ('marcus','Wed eve'), ('marcus','Sat pm'),
  ('taylor','Thu eve'), ('taylor','Sat am'),  ('taylor','Sun pm'),
  ('sam','Tue eve'),    ('sam','Sat am'),
  ('noor','Tue eve'),   ('noor','Thu eve'),   ('noor','Sat am'),
  ('priya','Wed eve'),  ('priya','Sat am'),
  ('hannah','Mon eve'), ('hannah','Thu eve'),
  ('diego','Tue eve'),  ('diego','Thu eve'),  ('diego','Sun pm'),
  ('eli','Sat am'),     ('eli','Sat pm'),
  ('chris','Fri eve'),  ('chris','Sun pm');

-- ---------------------------------------------------------------------------
-- 3. Private contact fields
-- ---------------------------------------------------------------------------
-- Brook approved moving these out of the anonymously readable profile table.
-- reporting_counter moves too: it is moderation data and is not on the
-- approved candidate field list.

create table public.profile_private (
  profile_id        text primary key references public.profile(profile_id) on delete cascade,
  birthday          date,
  home_phone        text,
  cell_phone        text,
  work_phone        text,
  reporting_counter integer not null default 0
);

insert into public.profile_private
  (profile_id, birthday, home_phone, cell_phone, work_phone, reporting_counter)
select profile_id, birthday, home_phone, cell_phone, work_phone, reporting_counter
from public.profile;

alter table public.profile
  drop column birthday,
  drop column home_phone,
  drop column cell_phone,
  drop column work_phone,
  drop column reporting_counter;

-- public.profile now holds only the approved readable columns:
-- profile_id, name, bio, auth_uid.

-- ---------------------------------------------------------------------------
-- 4. Matching semantics
-- ---------------------------------------------------------------------------
-- yes/no were independent booleans, so both-true and both-false were storable.
-- All 7 existing rows already satisfy this, so it applies without a data fix.

alter table public.choice
  add constraint choice_exactly_one_decision check (yes <> no);

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

-- ---------------------------------------------------------------------------
-- 5. Profile photo storage
-- ---------------------------------------------------------------------------
-- Bucket 'profile-photos', one folder per auth user: <auth.uid()>/<filename>.
-- Public read per Brook's request on #3. See the PR for the signed-URL
-- alternative if the team would rather photos stay behind auth.

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

-- ---------------------------------------------------------------------------
-- 6. Row-level security
-- ---------------------------------------------------------------------------

alter table public.profile_availability enable row level security;
alter table public.profile_private      enable row level security;

create policy "read availability"
  on public.profile_availability for select to anon, authenticated
  using (true);

-- profile: anyone may read the safe columns; you may only create and edit
-- your own row, and only under your own auth id.
create policy "insert own profile"
  on public.profile for insert to authenticated
  with check (auth_uid = auth.uid() and profile_id = auth.uid()::text);

create policy "update own profile"
  on public.profile for update to authenticated
  using (auth_uid = auth.uid())
  with check (auth_uid = auth.uid());

create policy "write own interests"
  on public.profile_interest for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

create policy "write own availability"
  on public.profile_availability for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "own private fields"
  on public.profile_private for all to authenticated
  using (profile_id = public.current_profile_id())
  with check (profile_id = public.current_profile_id());

create policy "write own photo"
  on public.photo for all to authenticated
  using (user_id = public.current_profile_id())
  with check (user_id = public.current_profile_id());

-- choice: the old policy let anyone read every swipe in the table, which would
-- have exposed pending likes. Brook decided a pending like is NOT visible, so
-- a user may read only the rows where they are the swiper. Mutual matches come
-- back through my_matches() instead.
drop policy "read choice" on public.choice;

create policy "read own choices"
  on public.choice for select to authenticated
  using (swiper = public.current_profile_id());

create policy "write own choices"
  on public.choice for all to authenticated
  using (swiper = public.current_profile_id())
  with check (swiper = public.current_profile_id());

commit;
