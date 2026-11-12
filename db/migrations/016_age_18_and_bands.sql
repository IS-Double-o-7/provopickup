-- 016: Rally Provo is 18+, and age bands for the Admin page.
--
-- Brook's decision as Product Owner (issue #7, 2026-11-12): the app matches
-- strangers for meetups, so players must be 18 or older. Bands are 18-24,
-- 25-34, 35-44, 45-54, 55+. No under-18 band and no overlapping edges.
--
-- Brook is adding the birthday input to the profile form on #3 and asked for
-- the rule to live in the database too, so it does not depend on the form.
--
-- WHY A TRIGGER AND NOT A CHECK CONSTRAINT. "At least 18 years old" is relative
-- to today, and a CHECK may only contain immutable expressions -- current_date
-- is not one. Postgres does not stop you writing it, which is the trap: the
-- constraint is evaluated once per write and then baked into the dump, so a
-- restore re-checks old rows against a new date, and rows that were legal when
-- written start failing. A fixed cutoff date has the opposite problem: it gets
-- stricter every day, and would start refusing people the moment they turn 18.
-- A trigger is evaluated at write time against the real current date and has
-- neither problem. (Same reasoning as migration 013, which used a fixed range
-- precisely because it did not need "today".)
--
-- Existing rows are not touched. All 11 rows in profile_private already carry a
-- birthday, all are 18+, and none are in the future, so nothing here is
-- retroactive -- but a trigger only fires on write in any case.

begin;

-- ---- The 18+ rule ----

create or replace function public.profile_private_check_age()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.birthday is null then
    return new;  -- a profile with no birthday yet is allowed; the KR counts it as incomplete
  end if;

  if new.birthday > current_date then
    raise exception 'That birthday is in the future.'
      using errcode = '23514';
  end if;

  if new.birthday < date '1900-01-01' then
    raise exception 'Check that birthday -- the year looks wrong.'
      using errcode = '23514';
  end if;

  if new.birthday > current_date - interval '18 years' then
    raise exception 'You must be 18 or older to use Rally Provo.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists profile_private_check_age on public.profile_private;
create trigger profile_private_check_age
  before insert or update of birthday on public.profile_private
  for each row execute function public.profile_private_check_age();

-- ---- Age bands ----

-- Returns the band a birthday falls in, or null when there is no birthday.
-- STABLE, not IMMUTABLE: the answer depends on today's date. That is also why
-- this must never be used in a CHECK constraint or a plain index.
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

-- Counts per band for the Admin page. Admin-only and counts-only, matching
-- okr_dashboard() from migration 012: birthdays live in profile_private, which
-- is owner-only, so this must not leak anything finer than a count.
-- Every band is present in the result even when its count is 0, so the page
-- does not have to guess which bands exist.
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

commit;
