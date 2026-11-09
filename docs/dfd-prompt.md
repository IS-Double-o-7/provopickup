# Lucidchart DFD prompts — Rally Provo

Use **two separate prompts**. Asking one AI generation for both levels at once
produces a crowded diagram with crossing lines. Generate Level 0, then start a
new diagram and generate Level 1.

In Lucidchart: **Lucid AI → Generate diagram → Diagram from text / prompt**,
then paste one block below.

---

## Prompt 1 — Level 0 (context diagram)

```text
Create a simple Level 0 data flow diagram (context diagram) for a web app called
Rally Provo, a pickup-sports matching app.

Use Yourdon/DeMarco DFD notation:
- External entities as rectangles
- The single system as one circle labeled "0  Rally Provo"
- Labeled arrows for every data flow
- No data stores at this level

Layout: put the "0  Rally Provo" circle in the center. Place Player on the far
left and Supabase Auth on the far right. Do not draw the database as an external
entity — it becomes data stores D1 through D5 in the Level 1 diagram. Use
only horizontal and vertical (orthogonal) connector lines, routed straight into
the sides of each shape. Keep at least 100 px of empty space between every
shape. Do not let any two lines cross or overlap, and do not let any label sit
on top of a line.

External entities and flows:

Player -> 0 Rally Provo: sign-in details, profile details, swipe choice, chat message, game booking
0 Rally Provo -> Player: match list, court list, chat thread, game schedule

0 Rally Provo -> Supabase Auth: sign-up / sign-in request
Supabase Auth -> 0 Rally Provo: session token

Formatting: one short label per arrow (4 words maximum), 12 pt text, no icons,
no colors other than a light fill, no decorative styling.
```

---

## Prompt 2 — Level 1 (decomposition)

```text
Create a Level 1 data flow diagram for Rally Provo, a pickup-sports matching
web app. Keep it simple and readable — exactly 5 processes and 5 data stores,
nothing more.

Use Yourdon/DeMarco DFD notation:
- External entities as rectangles
- Processes as numbered circles
- Data stores as open-ended rectangles labeled D1 through D5
- Labeled arrows for every data flow

Layout in three vertical columns with wide gaps:
- Left column: the external entities
- Center column: the 5 process circles, stacked top to bottom in number order
- Right column: the 5 data stores, each lined up horizontally with the process
  that uses it
Use only horizontal and vertical (orthogonal) connector lines. Leave at least
120 px of vertical space between stacked shapes and 200 px between columns. No
line may cross another line or pass through a shape. No label may overlap a
line or another label.

External entities:
- Player
- Supabase Auth

Processes:
1.0 Manage Profile
2.0 Match Players
3.0 Exchange Messages
4.0 Schedule Games
5.0 Browse Courts

Data stores:
D1 Profile
D2 Choice
D3 Messages
D4 Event
D5 Venue

Data flows:

Player -> 1.0 Manage Profile: sign-in details
1.0 Manage Profile -> Supabase Auth: sign-up / sign-in request
Supabase Auth -> 1.0 Manage Profile: session token
Player -> 1.0 Manage Profile: profile details
1.0 Manage Profile -> Player: saved profile
1.0 Manage Profile -> D1 Profile: profile record
D1 Profile -> 1.0 Manage Profile: profile record

Player -> 2.0 Match Players: swipe choice
2.0 Match Players -> Player: match list
2.0 Match Players -> D2 Choice: like or pass
D2 Choice -> 2.0 Match Players: mutual match
D1 Profile -> 2.0 Match Players: candidate profiles

Player -> 3.0 Exchange Messages: chat message
3.0 Exchange Messages -> Player: chat thread
3.0 Exchange Messages -> D3 Messages: sent message
D3 Messages -> 3.0 Exchange Messages: message history
D2 Choice -> 3.0 Exchange Messages: allowed match

Player -> 4.0 Schedule Games: game booking
4.0 Schedule Games -> Player: game schedule
4.0 Schedule Games -> D4 Event: event and attendees
D4 Event -> 4.0 Schedule Games: booked games

Player -> 5.0 Browse Courts: court search
5.0 Browse Courts -> Player: court list
D5 Venue -> 5.0 Browse Courts: court details
D5 Venue -> 4.0 Schedule Games: court location

Formatting: one short label per arrow (4 words maximum), 12 pt text, plain
black lines, single light fill color, no icons, no gradients, no shadows.
```

---

## Balancing rule — the easy place to lose points

Every external entity and every flow that appears at Level 1 must also appear at
Level 0. If you add an entity (for example an Admin) to the Level 1 diagram, it
has to exist in the Level 0 diagram too, or the two diagrams contradict each
other. Keep both sets to **Player** and **Supabase Auth**.

A process also cannot output data it never received ("black hole" / "miracle").
That is why the Player sends *sign-in details* into 1.0 before 1.0 can send a
sign-up request to Supabase Auth.

## Why this stays legible

- Five processes is the usual class cap; more and the arrows tangle.
- Each data store sits next to the one process that touches it, so almost every
  store line is a short horizontal hop.
- Only `D1 Profile` and `D2 Choice` are shared by two processes — those are the
  only two longer lines in the whole diagram.
- Numbering (1.0 … 5.0, D1 … D5) matches the standard rubric.

## What the diagram claims vs. what is built

Say this out loud in the review if you are asked:

- **4.0 Schedule Games** is the only process genuinely backed by the database
  end to end.
- **1.0, 2.0, 3.0, 5.0** currently run on browser state or sample data. The
  tables exist (`profile`, `choice`, `messages`, `venue`), and the messaging
  wiring is waiting in PR #39.
- A DFD shows the *designed* flow, so drawing them is correct — just do not
  claim they are all live.
