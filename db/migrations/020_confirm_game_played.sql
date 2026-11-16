-- 020: A game counts as played only when the player says so.
--
-- Until now OKR 2 treated "booked on a game whose date has passed" as "played".
-- Nothing checked that anyone showed up. This adds a per-player confirmation:
-- after the game starts, each player taps "We played" on the game card or in the
-- chat, and only confirmed attendances count toward the Key Result.
--
-- 1. event_attendee.played_at: null means not confirmed.
-- 2. set_game_played(event, played): the only way to change it. A player can set or
--    clear ONLY their own row, ONLY for a game they are on, and ONLY once the game's
--    start time has passed (Provo time). event_attendee has no UPDATE policy, so
--    nobody can write played_at directly, including the host.
-- 3. okr_dashboard() now counts distinct players with a confirmed game in the last
--    7 days. A game played today counts today (the old "from tomorrow" lag is gone).
--
-- Existing rows stay null, so past games are not counted until players confirm them.
-- Safe to re-run.
begin;

alter table public.event_attendee add column if not exists played_at timestamptz;

create or replace function public.set_game_played(p_event uuid, p_played boolean)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  me text := public.current_profile_id();
  ts timestamptz;
begin
  if me is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.event e
     where e.event_id = p_event
       and (e.event_date + e.event_time) <= (now() at time zone 'America/Denver')
  ) then
    raise exception 'this game has not started yet' using errcode = '23514';
  end if;

  update public.event_attendee
     set played_at = case when p_played then now() else null end
   where event_id = p_event
     and profile_id = me
     -- 'played' too: the app books games dated before today as 'played', and
     -- restoring a removed past game does the same. Both mean "on this game".
     and status in ('going', 'played')
  returning played_at into ts;

  if not found then
    raise exception 'you are not on this game' using errcode = '42501';
  end if;
  return ts;
end;
$$;

revoke all on function public.set_game_played(uuid, boolean) from public, anon;
grant execute on function public.set_game_played(uuid, boolean) to authenticated;

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
                    where ph.user_id = p.profile_id
                      and btrim(coalesce(ph.photo_file, '')) <> '')
    ),
    played as (
      -- OKR 2: distinct players who CONFIRMED they played a game dated in the last
      -- 7 days (today included). Booking alone no longer counts.
      select count(distinct ea.profile_id)::int as n
      from public.event_attendee ea
      join public.event e on e.event_id = ea.event_id
      join players p on p.profile_id = ea.profile_id
      cross join today t
      where ea.status in ('going', 'played')
        and ea.played_at is not null
        and e.event_date <= t.d
        and e.event_date >  t.d - 7   -- today plus the 6 days before: 7 dates, not 8
    ),
    pairs as (
      -- One row per mutual match. It dates from the later of the two likes.
      -- greatest() ignores NULLs, so (NULL, recent) dates from the recent like.
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
      -- OKR 3: matches made in the last 7 days. A pair where BOTH likes predate
      -- migration 012 has a NULL date and never counts.
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
      'games',        jsonb_build_object('players_played_7d', (select n from played),
                                         'players_total',     (select count(*)::int from players)),
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
