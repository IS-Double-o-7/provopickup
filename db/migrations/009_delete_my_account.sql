-- 009: Let a signed-in player permanently delete their own account.
--
-- The browser can't delete a Supabase Auth user, so this runs on the server
-- as a SECURITY DEFINER function that only ever touches the caller's own
-- rows (auth.uid()). Deleting the auth user removes everything attached:
--   auth.users -> profile (profile.auth_uid ... on delete cascade)
--   profile    -> profile_private, profile_interest, profile_availability,
--                 photo, choice (both directions), messages (both directions),
--                 reporting, events they host, their event_attendee rows
-- The app deletes the player's files in the profile-photos bucket first
-- (Storage policy "a user deletes only their own photo folder").
--
-- Safe to run more than once.

begin;

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Sign in to delete your account.' using errcode = '42501';
  end if;
  -- Explicit, so the profile goes even if the cascade is ever changed.
  delete from public.profile where auth_uid = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

commit;

-- Check (as a signed-in test user, from the app): calling
--   select public.delete_my_account();
-- removes that user from Authentication -> Users and their profile row.
