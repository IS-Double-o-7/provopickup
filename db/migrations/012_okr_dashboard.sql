-- 012: Admin page (OKR dashboard).
-- Adds choice.created_at (OKR 3 cannot be measured by week without it), an admin
-- allow-list, is_admin(), and okr_dashboard(), which returns the four Key Result
-- figures as counts only and refuses anyone who is not on the allow-list.
--
-- Run this against the live project BEFORE (or with) merging the Admin page.
-- Until it is applied nobody is an admin, so the Admin tab never appears.
--
-- AFTER running it, add the four admins by hand in the SQL editor. Do not commit
-- their emails (see the PR description for the snippet).
--
-- Existing choice rows keep created_at = NULL on purpose: their real time is
-- unknown, so they are left out of the "last 7 days" match count instead of
-- being counted as brand new.
begin;

alter table public.choice add column if not exists created_at timestamptz;
alter table public.choice alter column created_at set default now();

-- A pass that is later changed to a like is a new decision: restamp it.
create or replace function public.choice_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.yes is distinct from old.yes or new.no is distinct from old.no then
    new.created_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists choice_touch on public.choice;
create trigger choice_touch before update on public.choice
  for each row execute function public.choice_touch();

-- Who may open the Admin page. No policies on purpose: with RLS on and nothing
-- granted, the browser cannot read or change this table. Only the functions
-- below can.
create table if not exists public.admin_user (
  auth_uid uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_user enable row level security;
revoke all on public.admin_user from public, anon, authenticated;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_user where auth_uid = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Counts only. SECURITY DEFINER because birthday lives in profile_private
-- (owner-only) and messages/choice are visible to their participants only.
-- Refuses anyone who is not an admin.
-- "Player" = a real account (auth_uid is set); seed/demo profiles are excluded.
-- Weeks are the rolling last 7 days in Provo time.
create or replace function public.okr_dashboard()
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
    with today as (
      select (now() at time zone 'America/Denver')::date as d
    ),
    players as (
      select profile_id, name from public.profile where auth_uid is not null
    ),
    complete as (
      -- OKR 1: name, age (birthday) and at least one photo.
      select count(*)::int as n
      from players p
      join public.profile_private pp on pp.profile_id = p.profile_id
      where btrim(coalesce(p.name, '')) <> ''
        and pp.birthday is not null
        and exists (select 1 from public.photo ph
                    where ph.user_id = p.profile_id and ph.photo_file is not null)
    ),
    played as (
      -- OKR 2: games already played (date in the past) in the last 7 days.
      select count(*)::int as n
      from public.event_attendee ea
      join public.event e on e.event_id = ea.event_id
      join players p on p.profile_id = ea.profile_id
      cross join today t
      where ea.status = 'going'
        and e.event_date < t.d
        and e.event_date >= t.d - 7
    ),
    pairs as (
      -- One row per mutual match. It dates from the later of the two likes.
      select a.swiper as p1, a.swiped_on as p2,
             greatest(a.created_at, b.created_at) as matched_at
      from public.choice a
      join public.choice b on b.swiper = a.swiped_on and b.swiped_on = a.swiper
      where a.yes and b.yes
        and a.swiper < a.swiped_on
        and a.swiper    in (select profile_id from players)
        and a.swiped_on in (select profile_id from players)
    ),
    recent as (
      -- OKR 3: matches made in the last 7 days. NULL (old rows) never counts.
      select count(*)::int as n from pairs where matched_at >= now() - interval '7 days'
    ),
    talked as (
      -- OKR 4: matched pairs where either person has sent a message.
      select count(*)::int as n
      from pairs x
      where exists (
        select 1 from public.messages m
        where (m.sender_id = x.p1 and m.receiver_id = x.p2)
           or (m.sender_id = x.p2 and m.receiver_id = x.p1)
      )
    )
    select jsonb_build_object(
      'generated_at', now(),
      'players',      (select count(*)::int from players),
      'profiles',     jsonb_build_object('complete', (select n from complete)),
      'games',        jsonb_build_object('played_7d', (select n from played)),
      'matches',      jsonb_build_object('made_7d', (select n from recent),
                                         'pairs_total', (select count(*)::int from pairs)),
      'messaged',     jsonb_build_object('pairs_with_message', (select n from talked))
    )
  );
end;
$$;

revoke all on function public.okr_dashboard() from public, anon;
grant execute on function public.okr_dashboard() to authenticated;

commit;
