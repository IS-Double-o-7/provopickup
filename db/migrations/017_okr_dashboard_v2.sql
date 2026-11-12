-- 017: OKR dashboard, second version. Replaces okr_dashboard() from migration 012.
--
-- Why a new migration instead of editing 012: 012 is already applied to the live
-- project, so changing the file would leave the repo and the database disagreeing.
-- This is a plain `create or replace function`, so it is safe to re-run.
--
-- What changes (Product Owner decision on #7, 2026-11-12):
--   1. The games Key Result is "the percentage of players who played at least one
--      game in the last 7 days". It now counts DISTINCT players, not attendance
--      rows, and returns players_played_7d next to players_total. Before, one game
--      with two players reported 2.
--   2. A photo only counts if photo_file is not blank (an empty string used to pass).
--   3. The comment on the matches CTE is corrected: greatest() ignores NULLs, so a
--      pair with one NULL created_at and one recent one dates from the recent like.
--      That is the right answer, because every NULL row predates migration 012.
--
-- Everything else is unchanged: counts only, admin-only (is_admin()), Provo time,
-- rolling last 7 days, real accounts only (auth_uid is set).
begin;

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
      -- OKR 2: distinct players who played a game (date in the past) in the last
      -- 7 days. A game played today counts from tomorrow, so this trails by a day.
      select count(distinct ea.profile_id)::int as n
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
