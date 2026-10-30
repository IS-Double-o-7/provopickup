# Rally Provo

A sports-matching app for finding people to play with around Provo: swipe to match
players, chat, plan games, browse courts and reels, and track daily challenges and stats.

**Live site:** <https://is-double-o-7.github.io/provopickup/> (GitHub Pages, deployed from `main`)

---

## App Summary

Moving to a new city, starting grad school, or just aging out of an old friend group
leaves a lot of people in Provo with the same problem: they want to play a sport, and
they have nobody to play it with. Pickup games exist, but finding one means knowing
somebody who already knows about it. The people most affected are students and recent
transplants — they have the time and the interest, but not yet the network. Rally Provo
solves this by treating pickup sports the way a dating app treats dating. You build a
profile with the sports you play, your skill level in each, and when you are usually
free, then swipe through other players nearby and match with the ones who line up. Once
two people match they can message each other, and from that conversation they can put a
real game on a shared calendar — a sport, a court, a date and a time. The app also
tracks the courts and fields around Provo, daily challenges to keep people playing, and
stats so you can see your streak and how many new people you have met. The result is
that a stranger in Provo can go from "I want to play pickleball" to a scheduled game
with a real person in a few minutes.

---

## Behavioral Requirements

What a user can do, and whether it works today. **Complete** means it was exercised end
to end (user → frontend → Supabase → back) and the result was checked; the Evidence
column says how. Anything that has not been checked that way is **Not complete**, even if
the code exists. Last reviewed October 30, 2026 against `main` and the live site.

### Login and profile

| # | Requirement | Status | Evidence |
|---|---|---|---|
| L1 | A visitor sees the Log in / Sign up page before anything else, until they are signed in | Complete | Live site; responsive check at 8 screen sizes (#16) |
| L2 | A new user can create an account with an email and a password (6+ characters) | Complete | A real account was created on the live site; it exists in Supabase Auth |
| L3 | A new account must confirm its email before first log-in, and the link returns to the site | Not complete | Confirmation is on in Supabase; where the link lands from the live site has not been checked |
| L4 | A returning user can log in, and stays signed in after a reload | Complete | Live site, Brook's account (Oct 30) |
| L5 | A new user must create a profile before using the app: photo, first name, at least one sport with a skill level, at least one availability slot; bio optional | Complete | Live: the account's profile, sport, availability and photo rows exist in Supabase; photo loads from Storage (200, image/jpeg) |
| L6 | A user who already has a profile goes straight to the app on log-in | Complete | Live site, Brook's account; 4 login cases tested in #13 |
| L7 | A user can edit their photo, name, sports, bio and availability from **Your profile** | Not complete | Works against a stand-in database (#5, #9); not yet checked live |
| L8 | Log out always returns to the login page | Not complete | Tested against a stand-in, including a failed sign-out request (#15); not yet checked live |
| L9 | Phone numbers and birthdays are visible only to their owner | Complete | Live database: a signed-out client reads 0 rows from `profile_private` and cannot read `auth_uid` (#8, #11) |
| L10 | A user cannot create or change another user's profile | Complete | Live database: an update against another profile changes 0 rows; a second profile per account is rejected (#7) |

### Matching (Play page)

| # | Requirement | Status | Evidence |
|---|---|---|---|
| M1 | The deck shows other players with name, photo (or initials), bio, sports with levels, and availability; no age, distance or home court | Complete | Live site, Brook's account |
| M2 | A user never sees themselves or the demo "You" profile in the deck | Complete | Fixed in #17 and confirmed live |
| M3 | Like and pass are saved, and that player does not come back after a reload | Complete | Live: 10 likes and a pass saved as `choice` rows |
| M4 | **Undo** right after a pass brings that player back | Complete | Live: the pass row was deleted and the card returned |
| M5 | **Review passed players** brings back everyone passed, and keeps likes | Complete | Live: passes deleted, all 10 likes kept |
| M6 | A match appears only when both players like each other, and shows in **Your matches** | Not complete | Verified on the live database (#7) and against a stand-in with two accounts (#10); not yet seen in the live app, which needs a second real account |
| M7 | A player cannot see who has liked them until it is a match | Complete | Live database: another account reads 0 rows from `choice` (#7) |
| M8 | Filter the deck by sport | Not complete | In the UI; not yet checked against live data |

### Other pages and course requirements

| # | Requirement | Status | Evidence |
|---|---|---|---|
| C1 | Book, view and cancel a game on the Calendar, saved in Postgres | Complete | Calendar vertical slice (#1) |
| C2 | Games belong to the signed-in player (a new account starts with an empty calendar) | Not complete | Games are still hosted by the demo `me` profile and every account sees the same calendar |
| X1 | Message a match (chat saved in the database) | Not complete | Messages are sample data in the browser; moved to Sprint 2 |
| X2 | Courts and Maps pages read venues from the database | Not complete | Still the hardcoded `PLACES` list |
| X3 | Every page scores 90+ in Lighthouse Accessibility | Not complete | No official Lighthouse run yet. An automated check of the same rules found no issues on login, sign-up, profile setup, Your profile and Play after #16 |
| X4 | Every page is responsive on desktop and mobile | Not complete | Login, sign-up and profile setup checked at 8 sizes and Play at desktop and phone (#16); other pages not checked |
| X5 | An AI automation connected to an external service | Not complete | Not started; not yet chosen by the team |
| X6 | The four Key Results update automatically from user activity | Not complete | Not started |
| X7 | Admin portal | Not complete | Not started |
| X8 | The site is live at a real URL anyone can open | Complete | <https://is-double-o-7.github.io/provopickup/>; redeploys on every merge to `main` |

---

## ERD

![Rally Provo entity relationship diagram](docs/erd.png)

Thirteen entities. `Profile` is the hub — most other tables point back at it, several of
them twice (a report has both a reporter and a reported-on; a swipe has both a swiper
and a swiped-on). The three green entities were added so a booked game has somewhere to
live; everything else is the original dating-app model.

> **The diagram above is out of date.** It still shows the pre-authentication model.
> Migration `db/migrations/001_auth_profiles_photos_matching.sql` added
> `profile_private` and `profile_availability`, added `Profile.AuthUID`, and moved
> `Birthday`, `HomePhone`, `CellPhone`, `WorkPhone` and `ReportingCounter` out of
> `Profile` into `profile_private`. Regenerate with `python3 docs/make_erd.py`, which
> writes `docs/erd.svg`; `docs/erd.png` is exported from that SVG by hand.

### Profile, private fields and availability

A real account maps to its profile through `profile.auth_uid`, which references
`auth.users(id)`. The primary key stays the text `profile_id`, so the eleven seed
profiles, the six foreign keys pointing at them and the existing calendar rows all keep
working; seed profiles simply have a null `auth_uid` and nobody can claim them.

`profile` itself now holds only what another player is allowed to see — `profile_id`,
`name`, `bio` and `auth_uid`. Contact details and the moderation counter live in
`profile_private`, which only the owner can read. `profile_availability` stores one row
per free time slot, drawn from the same eight slots the UI offers.

Two helper functions back the policies: `current_profile_id()` resolves the signed-in
user to their `profile_id`, and `my_matches()` returns the profiles that have liked you
back. Both are `SECURITY DEFINER` — the first because a policy on `profile` that queried
`profile` would recurse, the second so a match can be confirmed without exposing a
like that has not been reciprocated.

The diagram is generated from the live schema, so it cannot drift away from the database.
The source is `docs/erd.svg`.

| Entity | Purpose | Key attributes |
|---|---|---|
| **Profile** | A player | ProfileID (PK), Name, Bio, Birthday, HomePhone, CellPhone, WorkPhone, ReportingCounter |
| **Photo** | Profile pictures | PhotoID (PK), UserID (FK), DisplayOrderID, PhotoFile |
| **Interests** | A sport | InterestID (PK), InterestName, Icon, Community |
| **Profile-Interest** | Which sports a player plays, and how well | PIID (PK), UserID (FK), InterestID (FK), SkillLevel, StartDate, EndDate |
| **Choice** | One swipe decision | ChoiceID (PK), Swiper (FK), SwipedOn (FK), Yes, No |
| **Messages** | Chat between matched players | MessageID (PK), ChoiceID (FK), SenderID (FK), ReceiverID (FK), Message, SentAt |
| **Reporting** | Safety reports | ReportingID (PK), Reporter (FK), ReportedOn (FK), ReportedAt, Why |
| **Venue** | A court, park or field | VenueID (PK), VenueName, Setting, CourtCount, Unit, MilesAway, BusyNote |
| **Venue-Interest** | Which sports a venue supports | VenueInterestID (PK), VenueID (FK), InterestID (FK) |
| **Event** | A scheduled or played game | EventID (PK), HostID (FK), InterestID (FK), VenueID (FK), EventDate, EventTime, Note, NewPeopleMet, CreatedAt |
| **EventAttendee** | Who is playing in a game | EventAttendeeID (PK), EventID (FK), ProfileID (FK), Status |

### Relationships and cardinality

| Relationship | Cardinality |
|---|---|
| Profile → Photo | one-to-many (a player has many photos) |
| Profile ↔ Interests, through **Profile-Interest** | many-to-many (a player plays many sports; a sport has many players) |
| Profile → Choice, as *Swiper* | one-to-many |
| Profile → Choice, as *SwipedOn* | one-to-many |
| Choice → Messages | one-to-many (a match's conversation has many messages) |
| Profile → Messages, as *Sender* / *Receiver* | one-to-many each |
| Profile → Reporting, as *Reporter* / *ReportedOn* | one-to-many each |
| Venue ↔ Interests, through **Venue-Interest** | many-to-many (a court hosts several sports) |
| Profile → Event, as *Host* | one-to-many (a player organizes many games) |
| Interests → Event | one-to-many (every game is one sport) |
| Venue → Event | one-to-many (a court hosts many games) |
| Profile ↔ Event, through **EventAttendee** | many-to-many (a player joins many games; a game has many players) |

> **Note on naming.** Postgres folds unquoted identifiers to lower case, so `ProfileID`
> in the diagram is `profile_id` in the actual tables, `Profile-Interest` is
> `profile_interest`, and so on. The diagram and the database describe the same model.

---

## Tech Stack

| Layer | What we used | Why |
|---|---|---|
| Frontend | Plain HTML, CSS and vanilla JavaScript — no framework, no build step | The screens were already built this way. Adding a framework would have meant rewriting working UI to prove a database connection, which is not what this milestone is about. |
| Data access | [`@supabase/supabase-js`](https://supabase.com/docs/reference/javascript) loaded from a CDN | One `<script>` tag. No npm, no bundler, no `node_modules` for teammates to get out of sync. |
| Backend / API | Supabase (backend as a service) | Supabase hands us a REST API over our tables automatically, so there is no server code to write or host. |
| Database | Postgres, hosted by Supabase (free tier) | Real SQL with real foreign keys, so the ERD maps to actual constraints instead of being decorative. The table editor also lets every teammate *see* the rows, which made debugging much easier. |
| Security | Postgres row-level security (RLS) | Controls exactly what the public key is allowed to read and write. |
| Hosting | GitHub Pages, deployed from `main` | The app is static files, so there is nothing to build; every merge to `main` is live at <https://is-double-o-7.github.io/provopickup/> within a minute or two. |

**Why this stack fits our team.** Nobody on the team is a full-time backend developer, and
the assignment is graded on one button working end to end, not on infrastructure. A
hand-built Express/Node stack would have meant everybody installing Node, matching
versions, and running a server before they could see anything. Supabase gave us a real
Postgres database with a browsable table editor in about five minutes, and the frontend
talks to it directly. We still write real SQL and real schema, so we learned the data
modelling part — we just skipped the part where we maintain a server.

### About the API key

`config.js` is committed to the repository and contains the Supabase **publishable
(anon) key**. That is intentional and is how Supabase is designed to work: the
publishable key is meant to ship in frontend code, and it can only do what our
row-level security policies allow. Anyone may read the public profile columns
(`profile_id`, `name`, `bio`), sports, availability, photos and reference data. A
signed-in player may write only their own profile, sports, availability, photo and
swipes. Private contact details, swipes, messages and reports are readable only by
their owner. The calendar's `event` and `event_attendee` still allow anonymous
insert and delete from the original vertical slice.

The **`service_role` key**, which bypasses all security, is never committed and is not
in this repository. `.env` is listed in `.gitignore`.

---

## How to Get It Running

You need: a web browser, and Python 3 **or** Node (only to serve the files — either is
fine, and you probably already have one).

1. **Get the code.**
   ```
   git clone https://github.com/IS-Double-o-7/provopickup.git
   cd provopickup
   ```

2. **Check the config.** `config.js` is already in the repo with our class project's
   Supabase URL and publishable key, so there is nothing to fill in. It should look like:
   ```js
   window.RALLY_CONFIG = {
     SUPABASE_URL: 'https://....supabase.co',
     SUPABASE_ANON_KEY: 'sb_publishable_...',
   };
   ```
   If you are pointing this at **your own** Supabase project instead, copy
   `config.example.js` to `config.js` and put your own values in.

3. **Serve the folder.** The app loads the Supabase library over the network, so serve
   it rather than double-clicking `index.html`:
   ```
   python3 -m http.server 8000
   ```
   or
   ```
   npx serve .
   ```

4. **Open it.** Go to <http://localhost:8000>. You land on the Log in / Sign up page;
   after signing in (and setting up your profile the first time) you reach the Home
   screen. You don't need to run it locally just to use or test the app: the live site
   is <https://is-double-o-7.github.io/provopickup/>.

**If the calendar is empty** and you see "Could not reach the database", the Supabase
project is paused (free-tier projects sleep after inactivity). Open the project in the
Supabase dashboard and resume it, then refresh.

### Rebuilding the database from scratch

The schema and sample rows live in `db/schema.sql` and `db/seed.sql`. In a new Supabase
project, open **SQL Editor**, run `schema.sql`, then run `seed.sql`, then put that
project's URL and publishable key in `config.js`.

`db/schema.sql` is always the current shape of the database, so a fresh project needs
only that file. `db/migrations/` holds the changes that brought an *existing* database up
to it — run a migration only against a project created before it. Migration 001 moves
data (contact columns out of `profile`), so take a backup before applying it to a
database with real rows in it.

Profile photos need a Storage bucket named `profile-photos`, which `schema.sql` and the
migration both create. Objects are stored at `<auth.uid()>/<filename>`: public to read,
writable only by the user who owns that folder.

---

## Signing in

Every visitor lands on a **Log in / Sign up** screen first. Sign up takes an email and a
password (at least 6 characters); after that, Supabase Auth keeps the session in the
browser, so a returning player goes straight into the app until they choose **Log out**
on their profile.

- If the Supabase project has **Confirm email** turned on (the default), sign-up shows a
  "check your inbox" message and the player logs in after clicking the link. The link
  returns to the page they signed up from, so that URL must be listed under
  **Authentication → URL Configuration** in the Supabase dashboard.
- **New players set up a profile before they see the app:** a photo (required), first
  name, at least one sport with a skill level, an optional bio (up to 300 characters),
  and at least one time they are usually free. Photos are cropped to a 320px square in
  the browser. Players can change all of this later from **Your profile**.
- **A player who already has a profile goes straight to the app** on log-in. A profile
  that was saved only in the browser (before profiles moved to Supabase) is copied to
  the database automatically, and a profile missing a field shows a **Finish profile**
  prompt instead of the setup page.
- **Log out** is in **Your profile** and always returns to the login page, even if the
  sign-out request to Supabase fails.
- `auth.js` owns Supabase sign-up, sign-in and sign-out. The profile adapter in `app.js`
  loads and saves the signed-in player's name, bio, sports and skill levels,
  availability and photo. Photos are uploaded to the public-read Storage bucket
  `profile-photos` at `<auth.uid()>/profile.jpg`, and the URL is stored in
  `photo.photo_file`.
- The adapter finds the signed-in player's row with `current_profile_id()`; it never
  selects `auth_uid`, which signed-out clients cannot read. Migrations 001 (#8) and the
  column-privacy fix (#11) are applied to the live Supabase project.
- The sample calendar data stays attached to the demo `me` profile.

---

## Verifying the Vertical Slice

**The slice is: booking an event on the Calendar.** The button writes a row to Postgres,
reads it back, and redraws the calendar from the database.

What happens when you click Save:

1. The browser sends an `INSERT` to Supabase for the `event` table, and a second
   `INSERT` into `event_attendee` for you and whoever you are playing with.
2. Postgres writes the rows and returns the new `event_id`.
3. The app re-reads the games and redraws the calendar.
4. On every page load the app reads the events table again — which is why a refresh
   does not lose anything.

### Steps to verify

1. Open the app, sign up or log in, and click **Calendar** in the navigation.
2. Click **Add a game**.
3. Fill the form in — pick a sport, a court, **a date you will recognize**, and a time.
   Put something memorable in the Note field, like `TEST — delete me`.
4. Click **Save game**.
5. The modal closes, a confirmation toast appears, and the game shows up on that date in
   the calendar grid and in the day's list on the right.
6. **Refresh the page** (Cmd-R / Ctrl-R). Navigate back to Calendar. **The game is still
   there.**

### Proving it is really in the database, not the browser

A page refresh alone does not rule out browser storage, so there are two stronger checks:

- **Clear local storage.** Open the browser console and run `localStorage.clear()`, then
  refresh. The game is still on the calendar, because it is being read from Postgres.
- **Look at the row.** In the Supabase dashboard, open **Table Editor → `event`** and
  sort by `created_at` descending. Your new row is at the top, with the note you typed.
- **Open it somewhere else.** Load the same URL in a private window or on another
  device. The game is there too — which localStorage could never do.

To clean up, click the **✕** on the game in the calendar. That deletes the row from
Postgres (and the toast's **Undo** puts it back).

---

## What is live and what is not

| Feature | Where its data lives |
|---|---|
| **Accounts, sign-in and sign-out** | **Supabase Auth** |
| **Profile: name, bio, sports and levels, availability, photo** | **Supabase Postgres and Storage**, one profile per account |
| **Play: deck, likes, passes, undo, matches** | **Supabase Postgres** (`choice`, `my_matches()`) |
| **Calendar: book, view and cancel a game** | **Supabase Postgres**, not yet tied to the signed-in account |
| Stats and streaks | Computed from the same calendar events |
| Messages, reels, challenges, courts and maps | Still browser `localStorage` or sample data |

See **Behavioral Requirements** above for what has been checked end to end.

---

## Project structure

- `index.html` – page structure, navigation, modal and toast containers
- `styles.css` – all styling, with light and dark themes driven by CSS variables at the top
- `config.js` – Supabase URL and publishable key
- `config.example.js` – template for pointing the app at your own Supabase project
- `auth.js` – the log in / sign up screen; owns the shared Supabase client and holds the app back until someone is signed in
- `app.js` – data, logic and every screen
- `db/schema.sql` – the tables from the ERD
- `db/seed.sql` – sample rows for every table
- `docs/erd.png` – the diagram above (`docs/erd.svg` is the source, `docs/make_erd.py` regenerates both)

### How `app.js` is organized

1. **Helpers** – date formatting, escaping, icons
2. **Reference data** – sports, courts, sample players, challenges, reels
3. **Store + API** – the only place data is read or saved
4. **Supabase** – the database client and row mapping
5. **Illustrations** – court drawings used for cards and covers
6. **Navigation** – routing between screens (`#home`, `#play`, `#messages`, …)
7. **Views** – one render function per screen
8. **Modals, sheet, toast**
9. **Events** – one shared click, submit and keyboard handler
10. **Boot**

## Notes

- Players, courts and community numbers are sample data.
- Players' profile photos are real uploads. Demo players without a photo show initials,
  and reel covers are still drawn court illustrations.
- Fonts load from Google Fonts and fall back to system fonts offline.
