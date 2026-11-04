-- 003: Let players pick mornings, afternoons and evenings on every day.
--
-- profile_availability.slot used to accept only eight values
-- ('Mon eve' ... 'Sun pm'). The profile page now offers every day in three
-- parts, so the check constraint is widened to 21 values. It is a superset:
-- the eight original values are still allowed, so no existing row changes.
-- The list must match SLOTS in app.js.
--
-- Safe to run more than once.

begin;

do $$
declare c text;
begin
  for c in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace ns on ns.oid = rel.relnamespace
    where ns.nspname = 'public'
      and rel.relname = 'profile_availability'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%slot%'
  loop
    execute format('alter table public.profile_availability drop constraint %I', c);
  end loop;
end $$;

alter table public.profile_availability
  add constraint profile_availability_slot_check check (slot in (
    'Mon am', 'Mon pm', 'Mon eve',
    'Tue am', 'Tue pm', 'Tue eve',
    'Wed am', 'Wed pm', 'Wed eve',
    'Thu am', 'Thu pm', 'Thu eve',
    'Fri am', 'Fri pm', 'Fri eve',
    'Sat am', 'Sat pm', 'Sat eve',
    'Sun am', 'Sun pm', 'Sun eve'));

commit;

-- Check: should list 21 values.
-- select pg_get_constraintdef(oid) from pg_constraint
--   where conname = 'profile_availability_slot_check';
