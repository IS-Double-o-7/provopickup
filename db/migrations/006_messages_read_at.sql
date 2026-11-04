-- 006_messages_read_at.sql
-- Messaging Page Database (Sprint 2). Tracking: #31, question from kyle-claude.
--
-- messages had no read/unread column, so the inbox unread badge had nowhere to
-- live. The team's two options were a read_at column or dropping the badge;
-- Jordan chose the column, so the badge keeps working.
--
-- read_at is null until the receiver opens the conversation. "Unread for me"
-- is therefore: receiver_id = current_profile_id() and read_at is null.
--
-- The careful part: marking a message read is an UPDATE, and migration 004
-- deliberately left messages with no UPDATE policy so there is no edit or
-- unsend. `authenticated` nevertheless still holds a TABLE-WIDE update grant —
-- it is blocked only because RLS denies by default when no policy matches. If
-- we simply added an UPDATE policy, a signed-in user could also rewrite
-- `message`, `sender_id` or `sent_at` on any row the policy let through.
--
-- So this migration does two things together:
--   1. revokes the table-wide update grant and re-grants UPDATE on read_at
--      alone, so the other columns are unreachable at the privilege layer,
--      before RLS is even consulted;
--   2. adds an UPDATE policy scoped to the receiver, so you may only mark your
--      own incoming messages read.
--
-- Net effect: a receiver may set read_at on messages addressed to them, and
-- nobody may edit a message's text, sender, receiver or timestamp.

alter table public.messages
  add column read_at timestamptz;

comment on column public.messages.read_at is
  'When the receiver opened this message. Null means unread. Only the receiver may set it.';

-- Unread lookups are always "my incoming, not yet read".
create index messages_unread_idx
  on public.messages (receiver_id)
  where read_at is null;

-- 1. Narrow the write surface to read_at only.
revoke update on public.messages from authenticated;
grant  update (read_at) on public.messages to authenticated;

-- 2. And only on your own incoming messages.
create policy "mark own messages read"
  on public.messages for update to authenticated
  using      (receiver_id = public.current_profile_id())
  with check (receiver_id = public.current_profile_id());
