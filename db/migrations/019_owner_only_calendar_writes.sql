-- 019: Only the host may cancel a game or change who is playing, and only the
-- people in a game may record its result.
--
-- This re-applies migration 010, which was rolled back by 011. 010 was correct;
-- it was simply too early. It required host_id = current_profile_id(), but at the
-- time app.js still booked every game as the seed placeholder 'me', so booking and
-- undo were refused outright. PR #66 (Kyle's #42, brought up to date by Brook)
-- fixed that: a game is now hosted by the signed-in player. Brook's README entry
-- for C2 asks for this migration by name as the remaining half of that card.
--
-- Why it matters. Every calendar policy today is `true`:
--
--   book event        insert to authenticated  with check (true)
--   cancel event      delete to authenticated  using      (true)
--   add attendees     insert to authenticated  with check (true)
--   remove attendees  delete to authenticated  using      (true)
--   report played     update to authenticated  using      (event_date <= current_date)
--
-- #66 hides other players' games in the browser, but hiding is not refusing. Any
-- signed-in player can still delete any other player's game straight through the
-- REST API with the publishable key, including games they cannot see.
--
-- SCOPE: writes only, exactly like 010. Reads stay as they are. Whether one player
-- may read another's calendar is a product question the Product Owner has not ruled
-- on (issues #21 and #41), and AGENTS.md section 11 puts public data-access rules
-- with the team, not with an agent. The read policies are listed at the bottom of
-- this file so whoever makes that call can see exactly what is still open.
--
-- What changes since 010 was written: `report played event` did not exist then
-- (it arrived with game results in 016). It currently lets ANY signed-in player
-- write a score onto ANY past game. Narrowed here to the people in that game.
--
-- Safe to run more than once.

begin;

-- ---- event ----
drop policy if exists "book event"          on public.event;
drop policy if exists "cancel event"        on public.event;
drop policy if exists "book own event"      on public.event;
drop policy if exists "cancel own event"    on public.event;

create policy "book own event" on public.event for insert to authenticated
  with check (host_id = public.current_profile_id());

create policy "cancel own event" on public.event for delete to authenticated
  using (host_id = public.current_profile_id());

-- Recording a result is for the people who played. SECURITY DEFINER helper so the
-- policy can look at event_attendee without that table's own policy being consulted
-- again from inside this one.
create or replace function public.plays_in_event(e uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.event_attendee a
     where a.event_id = e
       and a.profile_id = public.current_profile_id()
  );
$$;

revoke all on function public.plays_in_event(uuid) from public, anon;
grant execute on function public.plays_in_event(uuid) to authenticated;

drop policy if exists "report played event" on public.event;
create policy "report played event" on public.event for update to authenticated
  using (event_date <= current_date
         and (host_id = public.current_profile_id() or public.plays_in_event(event_id)))
  with check (event_date <= current_date
         and (host_id = public.current_profile_id() or public.plays_in_event(event_id)));

-- The column grants from 016 still stand: an update may only touch score,
-- new_people_met and note. Date, host, court and sport remain unwritable.

-- ---- event_attendee ----
drop policy if exists "add attendees"                 on public.event_attendee;
drop policy if exists "remove attendees"              on public.event_attendee;
drop policy if exists "add attendee to own game"      on public.event_attendee;
drop policy if exists "remove attendee from own game" on public.event_attendee;

create policy "add attendee to own game" on public.event_attendee for insert to authenticated
  with check (exists (
    select 1 from public.event e
     where e.event_id = event_attendee.event_id
       and e.host_id  = public.current_profile_id()
  ));

create policy "remove attendee from own game" on public.event_attendee for delete to authenticated
  using (exists (
    select 1 from public.event e
     where e.event_id = event_attendee.event_id
       and e.host_id  = public.current_profile_id()
  ));

commit;

-- STILL OPEN after this migration, for the Product Owner, not for an agent:
--
--   read event      select to anon, authenticated  using (true)
--   read attendees  select to anon, authenticated  using (true)
--
-- So anyone, signed in or not, can still READ every game and every attendee list
-- through the API. #66 stops the app from showing them, which is the whole of the
-- C2 card as written, but it is not a database rule. Narrowing reads to "games I
-- am in" is a one-policy change on top of this migration and I will write it the
-- day the team decides.
--
-- Also unchanged: the 49 seed games are hosted by the placeholder 'me', which has
-- no auth user, so after this migration no signed-in player can cancel them. They
-- are already invisible to real accounts since #66. Removing them needs elevated
-- access and is a separate decision about deleting data.
