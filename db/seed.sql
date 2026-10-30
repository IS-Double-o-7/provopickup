-- Rally Provo / Provo Pickup — sample data
-- Run after schema.sql. Safe to re-run only on an empty database.
-- Dates for events are relative to the day you run this, so the calendar always
-- has upcoming games and a history behind it.

insert into interests (interest_id, interest_name, icon, community) values
  ('pickleball','Pickleball','🏓','8.2k'), ('basketball','Basketball','🏀','5.6k'),
  ('volleyball','Volleyball','🏐','4.1k'), ('soccer','Soccer','⚽','3.2k'),
  ('tennis','Tennis','🎾','2.8k'), ('spikeball','Spikeball','🟡','1.4k'),
  ('badminton','Badminton','🏸','1.1k'), ('kickball','Kickball','🔴','620');

insert into venue (venue_id, venue_name, setting, court_count, unit, miles_away, busy_note) values
  ('kiwanis','Kiwanis Park Courts','Outdoor',6,'courts',2.1,'Busy evenings'),
  ('rec','Provo Rec Center','Indoor',4,'courts',3.4,'Steady all day'),
  ('northpark','North Park Fields','Outdoor',3,'fields',3.8,'Quiet weekdays'),
  ('byu','BYU Outdoor Courts','Outdoor',8,'courts',4.0,'Busy weekends'),
  ('memorial','Memorial Park','Outdoor',2,'courts',4.7,'Quiet');

insert into venue_interest (venue_id, interest_id) values
  ('kiwanis','pickleball'),
  ('rec','basketball'), ('rec','volleyball'), ('rec','badminton'), ('rec','pickleball'),
  ('northpark','soccer'), ('northpark','kickball'), ('northpark','spikeball'),
  ('byu','tennis'), ('byu','pickleball'),
  ('memorial','volleyball'), ('memorial','spikeball');

insert into profile (profile_id, name, bio) values
  ('me','You','This is the signed-in demo player.'),
  ('jamie','Jamie Lee','Competitive enough to keep score, social enough to grab tacos after.'),
  ('marcus','Marcus Chen','Weeknight runs, weekend pickup, and learning to love a close game.'),
  ('taylor','Taylor Brooks','Looking for consistent games and good energy. Let''s make it a habit.'),
  ('sam','Sam Rivera','Just moved to Provo and looking for a regular crew. Always down for one more game.'),
  ('noor','Noor Haddad','3.5 DUPR and happy to drill dinks with anyone who wants to get better.'),
  ('priya','Priya Nair','Former high school tennis player easing back in. Patient with beginners, happy to rally.'),
  ('hannah','Hannah Kim','Grad student. Badminton is my stress relief and volleyball is my social life.'),
  ('diego','Diego Alvarez','I organize a Sunday pickup game at North Park. We always need a few more.'),
  ('eli','Eli Watson','Saturday morning runs at the Rec. Trying pickleball because my knees asked nicely.'),
  ('chris','Chris Okafor','Captain of a very average rec kickball team. We bring snacks and good attitudes.');

insert into profile_private (profile_id, birthday, cell_phone) values
  ('me','2001-04-12','801-555-0100'),
  ('jamie','2000-03-04','801-555-0101'),
  ('marcus','2003-07-19','801-555-0102'),
  ('taylor','1998-11-02','801-555-0103'),
  ('sam','2002-01-27','801-555-0104'),
  ('noor','1997-05-15','801-555-0105'),
  ('priya','1999-09-08','801-555-0106'),
  ('hannah','2004-02-21','801-555-0107'),
  ('diego','2001-06-30','801-555-0108'),
  ('eli','1995-12-11','801-555-0109'),
  ('chris','2000-08-17','801-555-0110');

-- When each player is free. Mirrors the avail arrays in app.js.
insert into profile_availability (profile_id, slot) values
  ('me','Tue eve'), ('me','Thu eve'), ('me','Sat am'),
  ('jamie','Tue eve'), ('jamie','Thu eve'), ('jamie','Sat am'),
  ('marcus','Mon eve'), ('marcus','Wed eve'), ('marcus','Sat pm'),
  ('taylor','Thu eve'), ('taylor','Sat am'), ('taylor','Sun pm'),
  ('sam','Tue eve'), ('sam','Sat am'),
  ('noor','Tue eve'), ('noor','Thu eve'), ('noor','Sat am'),
  ('priya','Wed eve'), ('priya','Sat am'),
  ('hannah','Mon eve'), ('hannah','Thu eve'),
  ('diego','Tue eve'), ('diego','Thu eve'), ('diego','Sun pm'),
  ('eli','Sat am'), ('eli','Sat pm'),
  ('chris','Fri eve'), ('chris','Sun pm');

insert into profile_interest (user_id, interest_id, skill_level, start_date) values
  ('me','pickleball','Intermediate','2025-01-15'), ('me','volleyball','Casual','2025-03-01'), ('me','basketball','Casual','2025-03-01'),
  ('jamie','pickleball','Intermediate','2024-06-01'), ('jamie','tennis','Beginner','2025-05-20'),
  ('marcus','basketball','Intermediate','2023-09-10'), ('marcus','soccer','Casual','2024-02-14'),
  ('taylor','volleyball','Intermediate','2022-08-05'), ('taylor','spikeball','Casual','2025-06-11'),
  ('sam','pickleball','Intermediate','2026-01-09'), ('sam','volleyball','Casual','2026-02-02'),
  ('noor','pickleball','Advanced','2021-04-18'), ('noor','spikeball','Intermediate','2024-07-07'),
  ('priya','tennis','Intermediate','2019-03-22'), ('priya','pickleball','Casual','2025-10-01'),
  ('hannah','volleyball','Casual','2024-09-01'), ('hannah','badminton','Intermediate','2023-01-30'),
  ('diego','soccer','Advanced','2018-05-12'), ('diego','basketball','Casual','2024-11-03'),
  ('eli','basketball','Advanced','2015-10-25'), ('eli','pickleball','Beginner','2026-03-14'),
  ('chris','kickball','Casual','2024-04-04'), ('chris','soccer','Casual','2023-06-19');

insert into photo (user_id, display_order_id, photo_file) values
  ('jamie',1,'jamie-court.jpg'), ('jamie',2,'jamie-tacos.jpg'),
  ('marcus',1,'marcus-rec.jpg'), ('taylor',1,'taylor-memorial.jpg'), ('me',1,'me-avatar.jpg');

insert into choice (swiper, swiped_on, yes, no) values
  ('me','jamie',true,false), ('me','marcus',true,false), ('me','taylor',true,false),
  ('me','hannah',false,true),
  ('jamie','me',true,false), ('marcus','me',true,false), ('taylor','me',true,false);

insert into messages (choice_id, sender_id, receiver_id, message, sent_at)
select c.choice_id, m.sender, m.receiver, m.body, now() - m.ago
from (values
  ('jamie','me','Good games last week! Your third shot drop is getting dangerous.', interval '50 hours'),
  ('me','jamie','Ha, thanks. Your serve is the real problem.',                      interval '49 hours'),
  ('jamie','me','Still good for Monday at 6? I can grab court 3.',                  interval '9 minutes'),
  ('me','marcus','Rec center next week? They open the full court at 7.',            interval '5 hours'),
  ('marcus','me','That court works for me!',                                        interval '2 hours'),
  ('taylor','me','Fun game last night. Same time next week?',                       interval '20 hours'),
  ('me','taylor','Count me in.',                                                    interval '19 hours')
) as m(sender, receiver, body, ago)
join choice c on c.swiper = m.sender and c.swiped_on = m.receiver;

insert into reporting (reporter, reported_on, why) values
  ('hannah','chris','No-showed a scheduled game twice without messaging.');
update profile set reporting_counter = 1 where profile_id = 'chris';

-- Two upcoming games and two just played.
with new_events as (
  insert into event (host_id, interest_id, venue_id, event_date, event_time, note, new_people_met) values
    ('me','pickleball','kiwanis', current_date + 2, '18:00', 'Court 3', 0),
    ('me','basketball','rec',     current_date + 5, '19:00', NULL,      0),
    ('me','volleyball','memorial',current_date - 1, '18:00', NULL,      2),
    ('me','pickleball','kiwanis', current_date - 3, '18:30', 'Doubles, won 2 of 3', 1)
  returning event_id, interest_id
)
insert into event_attendee (event_id, profile_id, status)
select event_id, 'me', 'going' from new_events
union all
select event_id,
       case interest_id when 'pickleball' then 'jamie' when 'basketball' then 'marcus' else 'taylor' end,
       'going'
from new_events;

-- About seven months of played games, so the Stats screen has real history.
with days as (
  select current_date - n as d, n,
         (hashtext('rally' || n::text) & 2147483647)::numeric / 2147483647 as r1,
         (hashtext('sport' || n::text) & 2147483647)::numeric / 2147483647 as r2,
         (hashtext('met'   || n::text) & 2147483647)::numeric / 2147483647 as r3
  from generate_series(6, 210) as n
),
picked as (
  select d, n, r2, r3,
         case when r2 < 0.44 then 'pickleball'
              when r2 < 0.70 then 'volleyball'
              when r2 < 0.88 then 'basketball'
              else 'soccer' end as interest_id
  from days
  where r1 < case extract(dow from d) when 6 then 0.50 when 0 then 0.18 else 0.24 end
),
rows as (
  select p.d, p.n, p.r3, p.interest_id,
         (select v.venue_id from venue_interest v
           where v.interest_id = p.interest_id
           order by md5(v.venue_id || p.n::text) limit 1) as venue_id,
         case when extract(dow from p.d) in (0,6) then time '10:00' else time '18:30' end as t
  from picked p
),
ins as (
  insert into event (host_id, interest_id, venue_id, event_date, event_time, new_people_met)
  select 'me', interest_id, venue_id, d, t,
         case when r3 < 0.4 then 1 + floor(r3 * 5)::int else 0 end
  from rows
  returning event_id, event_date, interest_id
)
insert into event_attendee (event_id, profile_id, status)
select event_id, 'me', 'played' from ins
union all
select i.event_id,
       case i.interest_id when 'pickleball' then 'jamie' when 'basketball' then 'marcus'
                          when 'volleyball' then 'taylor' end,
       'played'
from ins i
where i.interest_id in ('pickleball','basketball','volleyball')
  and i.event_date > current_date - 120;
