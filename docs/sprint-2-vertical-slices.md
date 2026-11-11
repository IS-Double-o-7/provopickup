# Sprint 2 vertical-slice checklist (draft)

**As of 2026-11-09. Draft prepared by `kyle-claude` for Kyle; not yet reviewed by the team.**
Built from the README requirements table, a screenshot of the deployed site, and the open pull requests.
Nobody re-ran the live site to write this. Evidence marked "README" is only as current as the README.

**Course target for Sprint 2:** 3 pages completely functional and 10 working vertical slices. A vertical slice is a
feature that works through every layer (screen, code, database), such as a button that saves a record.

## Live on `main`: 10 slices

| # | Slice | Database table | Evidence today | Gap |
|---|---|---|---|---|
| 1 | Sign up | Supabase Auth | README L2: a real account was created | None |
| 2 | Email confirmation | Supabase Auth | README L3: verified live | None |
| 3 | Log in and stay signed in | Supabase Auth | README L4 | None |
| 4 | Create a profile (photo, sport, level, availability) | `profile`, `profile_interest`, `profile_availability`, `photo` | README L5: rows exist | None |
| 5 | Like or pass a player | `choice` | README M3: 10 likes and a pass saved | None |
| 6 | Undo a pass | `choice` | README M4 | None |
| 7 | Review passed players | `choice` | README M5 | None |
| 8 | Mutual match shows in Your matches | `choice`, `my_matches()` | Screenshot of the deployed site showing two matches | README M6 still says "Not complete" |
| 9 | Book a game | `event`, `event_attendee` | README C1 | Every account shares one demo calendar until PR #42 merges |
| 10 | Cancel a game, with undo | `event` | README C1 | Same shared-calendar gap |

Like and pass are counted as one slice. A stricter count that also merges undo and review into it gives 8.

## In open pull requests, not live

| # | Slice | Pull request | Status |
|---|---|---|---|
| 11 | Send a message to a match | #39 | Database rules checked on the live database; needs a two-account browser test. Merging #44 first keeps a failed send from losing the draft. |
| 12 | Unread count and mark read | #39 | Same as above |
| 13 | Courts load from the database | #39 | Not yet checked in a browser |
| 14 | Delete a profile | #38 | Not reviewed here |

Calendar ownership: #42 books and shows games per player, but #46 reverted the host-only rule because it broke booking
on the live site. That rule should return together with #42 in a single change.

## Evidence still to collect

- Slice 8: record the match screenshot in the README and mark M6 Complete.
- Slices 9 and 10: re-check booking and cancelling on the live site after #46.
- Slices 11 to 13: run the two-account test, then merge.
- Every slice: a dated screenshot and a Supabase table row.

## Larger risk than the slice count

README X3 (Lighthouse Accessibility 90 or more) and X4 (responsive on desktop and mobile) are still "Not complete":
there is no official Lighthouse run and no full responsive evidence. The course Definition of Done needs both, so
"3 pages completely functional" is harder to prove than the 10 slices.
