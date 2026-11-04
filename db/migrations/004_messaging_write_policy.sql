-- 004_messaging_write_policy.sql
-- Messaging Page Database (Sprint 2). Tracking: Issue #23.
--
-- messages had exactly one policy, "read own messages" (SELECT). With RLS on
-- and no INSERT policy, nobody could send a message at all -- a signed-in
-- player with a real mutual match got:
--   new row violates row-level security policy for table "messages"
--
-- This blocked the Messaging page and OKR 4 ("100% of users message the people
-- they match with").
--
-- Two rules, both of which the product already states:
--   1. You may only send as yourself.
--   2. You may only message a confirmed mutual match. The Play view already
--      promises "when it's mutual, the chat shows up here"; without this a
--      signed-in player could message anyone whose profile_id they can read,
--      including someone who passed on them.
--
-- UPDATE and DELETE are deliberately left with no policy, so they stay denied.
-- There is no unsend or edit in the UI; adding one should be a separate,
-- deliberate change.

begin;

create policy "send to a match"
  on public.messages for insert to authenticated
  with check (
    sender_id = public.current_profile_id()
    and receiver_id in (select profile_id from public.my_matches())
  );

-- Second layer, matching migration 003: anon keeps no write privileges here.
-- Reads were already closed -- "read own messages" is granted to authenticated
-- only, so anon matches no policy and sees nothing.
revoke insert, update, delete on public.messages from anon;

commit;
