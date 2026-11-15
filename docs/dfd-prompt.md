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


---

# Level 1 — AI match-personalization workflow

**This is what the submission card actually asks for at Level 1.** It is not a
decomposition of the whole system; it is one workflow, end to end.

**Before generating:** the team has to confirm which AI automation this is. The
architecture diagram currently shows a *game announcement* automation (new game
-> AI writes an invite -> Discord). The card describes a *match personalization*
automation (mutual match -> AI writes why you two match). Those are different
features. Confirm with the AI automation owner, then fix whichever diagram is
stale.

Replace `AI provider (TBD)` below once the team picks one. Never draw a key,
token, or webhook URL on the diagram — show them as "secret, server-side only".

```text
Create a Level 1 workflow diagram for one automated feature in Rally Provo, a
pickup-sports web app. Keep it simple and readable: a single left-to-right
pipeline, no branching except where stated.

Draw three labeled boundary containers as large dashed rectangles:
- "Browser (untrusted)" on the left
- "Supabase (trusted, server-side)" in the middle
- "External (third party)" on the right
Every shape must sit inside exactly one container. Label the middle container
"trust boundary: secrets live here, never in the browser".

Steps, left to right, as numbered rounded rectangles:
1.0 Mutual match detected  (inside Browser)
2.0 Edge Function triggered  (inside Supabase)
3.0 Retrieve approved profile fields  (inside Supabase)
4.0 Call AI provider (TBD)  (arrow crosses into External)
5.0 Validate AI response  (inside Supabase)
6.0 Save personalized explanation  (inside Supabase)
7.0 Display explanation to player  (inside Browser)

Data stores as open-ended rectangles below the Supabase container:
D1 profile
D2 choice
D3 automation_run

Flows, each with a short label:
1.0 -> 2.0: match event
D2 choice -> 3.0: confirmed mutual match
D1 profile -> 3.0: bio, sports, skill level, interests
3.0 -> 4.0: approved fields only
4.0 -> 5.0: generated explanation
5.0 -> 6.0: validated text
5.0 -> 6.0: safe fallback text   (draw as a second, dashed arrow labeled "if invalid")
6.0 -> D3 automation_run: request, output, status, timestamp
6.0 -> 7.0: saved explanation
7.0 -> 1.0 is not needed; 7.0 is the end of the pipeline

Also draw one note box attached to 4.0: "API key stored in Edge Function
secrets. Never sent to the browser."

Layout: one horizontal row for 1.0 through 7.0, evenly spaced, at least 120 px
between shapes. Data stores in a row underneath, connected with short vertical
lines. Orthogonal connectors only. No crossing lines, no label on top of a line.
12 pt text, plain black lines, one light fill per container, no icons or
shadows.
```

## Level 0 for this card

Do **not** use the context-diagram prompt above for the submission. The card's
Level 0 is the system architecture picture — `docs/architecture.png` already
covers almost all of it. Two gaps to close first:

1. **Map provider is missing.** Add a Google Maps box under External services,
   with a labeled arrow (for example "court coordinates -> map tiles").
2. **Trust boundaries are not marked.** System boundaries and hosting are there,
   but add explicit labels: the browser holds only the publishable key and is
   guarded by RLS; Edge Function secrets and any service-role key are
   server-side only and never reach the browser.
