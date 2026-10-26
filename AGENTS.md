# Rally Provo — Agent Instructions (Team 007)

**Status: DRAFT, pending team approval.** Once the team approves this file it
replaces the external collaboration guide and becomes the single durable copy of
these rules. Do not maintain a second independent copy; it will drift.

These instructions apply to every coding agent working in this repository, on any
teammate's computer.

- Repository: <https://github.com/byeomans3/provo-pickup>
- Trello board: <https://trello.com/b/F59injc7/sprint-1-section-1-team-7>
- Product: a sports-focused friend and pickup-game matching application for Provo
- Team: Jordan, Kyle, Brook, Megan — all four are developers
- Sprint 1 Product Owner: Brook
- Sprint 1 Scrum Master: Kyle

Codex reads this file automatically. Claude Code sessions that do not load
`AGENTS.md` should read it via the root `CLAUDE.md` pointer.

This file shapes agent behavior but **is not a security boundary.** Enforcement
comes from GitHub permissions, branch protection, Supabase RLS, and protected
secret storage.

---

## 1. Agent identities

Use these stable identities in branch names, Issue comments, and handoffs.

| Human owner | Agent identity | Tool | Default responsibility |
|---|---|---|---|
| Jordan | `jordan-claude` | Claude Code | Implementation assigned to Jordan |
| Jordan | `jordan-codex` | Codex | Coordination and integration review; implementation only when separately assigned |
| Kyle | `kyle-claude` | Claude Code | Implementation assigned to Kyle |
| Brook | `brook-codex` | Codex | Implementation assigned to Brook; Product Owner support |
| Megan | `megan-codex` | Codex | Implementation assigned to Megan |

Jordan's two agents must never edit the same task, branch, worktree, or files at
the same time. Unless Jordan explicitly assigns implementation to `jordan-codex`,
it acts as the coordination and review agent only.

The human named on a Trello card stays accountable for the work even when an agent
assists. Agents do not receive Scrum credit, own cards, accept work on the Product
Owner's behalf, report attendance, or invent hours.

---

## 2. Sources of truth

| Information | Authoritative source |
|---|---|
| Product goal, sprint goal, backlog order, card owner, estimate, timer, status, PO acceptance | Trello |
| Code, schema, branches, commits, pull requests, reviews, releases | GitHub |
| Agent questions, blockers, recommendations, file claims, handoffs | GitHub Issue or PR comments |
| Durable architecture and development rules | `AGENTS.md`, `README.md`, approved diagrams |
| Sprint review evidence, retrospective, attendance, screenshots, hours | FigJam |
| Credentials and tokens | Local credential stores or service secret managers — never GitHub, Trello, FigJam, chat, or repository files |

Do not silently copy status between systems. Link the Trello card from its GitHub
Issue, and link the Issue or PR from the Trello card.

---

## 3. Repository baseline

Read the live repository before changing anything. If the repository contradicts
this summary, **the repository and the latest approved team decision win** — report
the contradiction before acting.

- Plain HTML, CSS, and JavaScript. No build framework, no package manager, no test runner.
- `index.html` — page shell.
- `styles.css` — responsive visual system, light and dark themes.
- `app.js` — reference data, state, data-access methods, navigation, views, modals, event handlers.
- `config.js` — Supabase URL and publishable key. Created by copying `config.example.js`. Never put a service-role key here.
- `db/schema.sql`, `db/seed.sql` — rebuild the database and sample data.
- `docs/erd.png`, `docs/erd.svg`, `docs/make_erd.py` — entity relationship diagram and its generator.
- Supabase/Postgres is the database. Calendar create / read / cancel / restore is the one database-backed vertical slice.
- Profile, matching, messages, reels, and challenges still run on local browser state or sample data.
- Default branch is `main`.

Not yet decided — **do not choose unilaterally:**

- The final five functional pages.
- The AI automation and external service. Discord is only a candidate.
- Hosting and the final public URL.
- The admin portal. It does not exist; show it as *planned* in the architecture diagram until the team approves implementation scope.

---

## 4. First run

On its first run in a session, an agent asks its human owner only for answers it
does not already have:

1. Which human do I represent?
2. Which agent identity should I use?
3. What is the local path to my clone or worktree?
4. What Trello card am I assigned? Provide the URL.
5. What GitHub Issue tracks that card? Provide the number, or authorize creating one.
6. Does the human have write access to the repository?
7. May I create a task branch, commit, push it, open a PR, and post task-scoped GitHub comments? **Record the exact permissions granted.**
8. Is this planning, implementation, review, or verification work?
9. Which files or subsystem does this task own?
10. Are Trello, FigJam, Supabase, hosting, or Discord connected? If not, draft updates for the human instead of claiming they were made.

**Never ask a human to paste a GitHub token, Supabase secret key, AI key, Discord
webhook URL, password, or one-time code into chat.** Direct them to authenticate
locally or enter the secret in the service's own protected interface.

Verification commands:

```bash
gh auth status
gh repo view byeomans3/provo-pickup --json viewerPermission -q .viewerPermission
git remote -v
git status --short --branch
```

If the permission does not allow pushing a task branch, stop and ask the
repository owner for collaborator access. Never share another person's credentials.

---

## 5. Branches and workspaces

Every implementation task gets its own branch:

```text
agent/<agent-id>/<issue-number>-<short-task-name>
```

Examples:

```text
agent/kyle-claude/12-profile-api
agent/brook-codex/15-login-ui
agent/jordan-codex/18-calendar-review
```

Each teammate works in their own clone. Two agents on the same computer use
separate Git worktrees. **Never run two writing agents in the same working
directory.**

Before editing:

1. Read this file, `README.md`, the Trello card, the linked Issue, and the relevant code.
2. Run `git status --short --branch` and preserve any unfamiliar changes.
3. Fetch the latest remote state.
4. Confirm the task has one human owner and one active implementation agent.
5. Comment on the Issue with the intended branch and file ownership.
6. Confirm no other open task claims the same files.

Never push directly to `main`, force-push a shared branch, rewrite another
teammate's history, discard unfamiliar changes, or merge your own work without the
required review.

---

## 6. Communication

GitHub Issues and PR comments are the cross-computer mailbox. This is
**asynchronous** — GitHub does not wake a closed or idle agent. A posted message is
only *available* for another agent's next sync. Never claim another agent received
it.

### Where messages belong

| Topic | Destination |
|---|---|
| Task scope, dependencies, blockers, handoffs | Task Issue |
| Questions about exact changed code | Pull request |
| Decisions affecting multiple tasks | Coordination Issue, then a durable `README.md` or architecture update once approved |
| Scrum estimates, timers, status, acceptance | Trello |
| Urgent human attention | Team Discord or another human channel, with the final technical decision copied to GitHub |

One coordination Issue titled `Agent coordination — Sprint 1` holds the roster and
GitHub usernames, the agent identity directory, current PO and Scrum Master, Trello
and FigJam URLs, the sprint goal, links to every task Issue, and unresolved
cross-task decisions. Each Trello implementation card gets its **own** task Issue —
never one giant Issue for all code work.

### Agent message format

```text
[AGENT MESSAGE]
From: <agent-id>
To: <agent-id, human, or all>
Type: question | recommendation | blocker | decision-needed | handoff
Trello: <card URL>
Issue/PR: <number or URL>
Files/area: <paths or subsystem>
Summary: <one concise paragraph>
Evidence: <code references, commit, test result, or reproduction>
Requested response: <specific answer or action>
Blocking: yes | no
```

Keep messages concise and evidence-based. Do not paste credentials, personal data,
full logs, or long transcripts.

### Task claim format

Post this before implementing:

```text
[TASK CLAIM]
Agent: <agent-id>
Human owner: <name>
Branch: <branch>
Files claimed: <paths>
Planned result: <observable result>
Expected verification: <checks>
Dependencies: <issues/PRs or none>
```

If two tasks need the same file, the agents agree on one option **before** editing:
sequence the tasks, split ownership along a stable interface, or let one agent change
the shared file while the other consumes it. Do not rely on Git to resolve
overlapping agent edits.

### Handoff format

```text
[HANDOFF]
Agent: <agent-id>
Human owner: <name>
Trello: <card URL>
Issue: <issue URL>
Branch: <branch>
PR: <PR URL>
Result: <what now works>
Files changed: <paths>
Database/API changes: <summary or none>
Verification performed: <commands and observed results>
Desktop/mobile evidence: <links or not applicable>
Accessibility evidence: <score/link or not yet run>
Risks and limitations: <items or none>
Unresolved questions: <items or none>
Reviewer requested: <agent/human>
```

State what was actually tested and what remains unverified. A PR is not accepted
merely because code exists or one focused check passes.

### Disagreement

Agents may challenge recommendations respectfully. The human task owner decides
task-local tradeoffs. The Product Owner decides product acceptance and priority.
The team decides architecture or scope changes that affect multiple cards.

---

## 7. Sync procedure

Run this when a session starts, before editing files, after pulling or rebasing,
before changing a shared interface or schema, when blocked, before opening a PR,
and before ending the session.

When a human says `sync the team`:

1. Fetch the latest remote branches without changing local work.
2. Read the coordination Issue.
3. Read the assigned task Issue and linked PR.
4. Check new comments, direct mentions, review requests, dependencies, and file claims.
5. Compare GitHub state against the Trello card.
6. Summarize new information for the human.
7. Answer messages that can be resolved with evidence.
8. Ask before any external post or state change not already authorized.
9. Record material decisions in the correct GitHub thread.

Answer direct questions before starting unrelated work. A blocker must name the
exact missing decision, permission, file, dependency, or failing check.

---

## 8. Implementation workflow

1. **Orient** — read the relevant sources and reproduce current behavior.
2. **Clarify** — convert the card into observable acceptance criteria. Ask the human when a missing requirement would materially change the result.
3. **Claim** — post the task claim, create the task branch.
4. **Plan** — identify affected files, interfaces, migrations, security implications, and verification.
5. **Implement** — make the smallest coherent change within the card's scope.
6. **Verify** — run focused checks, regression checks, desktop and mobile checks, and accessibility checks where applicable.
7. **Review** — inspect the diff for unrelated edits, secrets, debug output, and file conflicts.
8. **Handoff** — push only when authorized, open a PR, post the handoff.
9. **Accept** — only the Product Owner moves a card to Accepted, after every Definition of Done item has evidence.

Do not expand a card because a related improvement is convenient. Post a
recommendation for the Product Owner instead.

---

## 9. Review rules

- A different human or agent reviews each PR.
- Review the approved Trello acceptance criteria first.
- Check behavior, data correctness, security, accessibility, responsive layout, and regression risk.
- Treat generated code like human-written code. Verify it rather than trusting the author agent's summary.
- Comment on specific lines for actionable defects; put broader product or scope questions on the linked Issue.
- Do not mark a Trello card accepted. The Product Owner owns acceptance.

---

## 10. Scrum rules agents must preserve

### Sprint planning

- The Product Goal is the first Product Backlog card.
- One consolidated OKR card immediately follows it, containing two Objectives with two measurable Key Results each.
- Every Key Result names the exact table or event that updates it.
- The Sprint Goal is the first Sprint Backlog card.
- Every Sprint Backlog card has exactly one human owner.
- Estimates use Fibonacci values 1 through 8.
- Each person's cards total roughly 16–20 points and 4–5 hours of genuine human work.
- AI assistance does not fabricate or replace human hours.

### Role rotation

No one serves as Scrum Master in consecutive sprints, and no one serves as Product
Owner in consecutive sprints. Everyone remains a developer every sprint.

### Required progression

| Milestone | Minimum result |
|---|---|
| Sprint 1 Review | At least one page satisfies the complete Definition of Done |
| Sprint 2 Review | Three functional pages and ten end-to-end vertical slices satisfy the Definition of Done |
| Final presentation | Five functional pages, four automatically updating Key Results, one working AI/external-service automation, responsive behavior, accessibility evidence, cloud deployment, updated documentation |

### Definition of Done

A card counts only when every applicable item has evidence:

- Responsive on desktop and mobile
- Fully functional end to end
- Lighthouse Accessibility score of at least 90%
- `README.md` updated
- Code merged to `main`
- Site live on the cloud
- Required tests and checks pass
- Product Owner reviews the evidence and moves the card to the correct Accepted column

---

## 11. Decisions agents must not make alone

Stop and ask for a human or team decision before:

- selecting the final five pages;
- changing the sports-focused scope;
- defining or changing Objectives or Key Results;
- choosing the final AI automation or external service;
- adding the admin portal to implementation scope;
- selecting hosting;
- changing a database interface used by another card;
- changing authentication or public data-access rules;
- creating paid resources;
- changing Trello estimates, ownership, sprint scope, or acceptance;
- pushing, deploying, merging, or posting externally without authorization.

---

## 12. Security and privacy

- Never commit service-role keys, AI keys, Discord webhook URLs, passwords, or tokens.
- The Supabase publishable key may live in frontend code **only** while RLS is correctly configured.
- Do not claim prototype RLS policies are production-ready. The current policies grant broad anonymous read across most tables and open insert/delete on `event` and `event_attendee`.
- Do not expose phone numbers, reports, birthdays, or other personal information to anonymous users.
- Keep secrets out of GitHub comments, Trello, FigJam, screenshots, logs, prompts, and PR descriptions.
- Use least-privilege access for GitHub, Supabase, hosting, and Discord.
- Ask before destructive database changes, force pushes, branch deletion, deployment, or external communication.

---

## 13. Candidate AI automation — not yet approved

The leading candidate is an AI-assisted Discord game announcement:

1. A user books a game on the Calendar.
2. A Supabase Edge Function receives the event data.
3. An AI step writes a concise invitation and classifies the sport or channel.
4. The function posts the result to a Discord incoming webhook.
5. The app records the request, AI output, delivery status, and timestamp in an automation-run table.

This counts only if the AI **transforms or routes** the data. Posting unchanged
event fields to Discord is a pass-through and does not satisfy the assignment.

Store the AI key and webhook URL in Supabase Edge Function secrets. Never commit
them or expose them in browser JavaScript. The team approves this workflow during
Sprint Planning before any implementation.

---

## 14. Hosting — not yet approved

The frontend is static, so GitHub Pages is likely the least complicated starting
option, with Supabase continuing to host the database and any Edge Function. The
team must compare course requirements, URL usability, secret handling, and
deployment ownership before choosing.

---

## 15. Connection test

Once the coordination Issue exists, test each agent separately. With
authorization, the agent posts:

```text
[CONNECTION TEST]
Agent: <agent-id>
Human owner: <name>
GitHub read: pass | fail
GitHub comment: pass | fail
Repository status: <branch and clean/dirty>
Trello visibility: pass | unavailable
Ready for assignments: yes | no
Blockers: <none or exact blocker>
```

Then another teammate runs `sync the team`, confirms their agent can read the
message, and replies in the agent message format. The first teammate syncs again
and confirms receipt. **The connection is validated only after that round trip
succeeds.** Reading the repository alone is not proof of two-way communication.

---

## 16. Bootstrap prompt for a new session

```text
You are a coding agent for Team 007 working on Rally Provo.

Read AGENTS.md, README.md, the current Trello card, and the linked GitHub Issue
before changing anything. Identify yourself using one approved agent identity. Run
the first-run checks and ask me only for missing information or authorization.
Never request that I paste credentials into chat.

Trello is the Scrum source of truth. GitHub is the code, review, and cross-agent
communication source of truth. Before editing, sync the team, claim the task and
files on its GitHub Issue, confirm no other agent owns those files, and work on a
dedicated branch or worktree. Do not push to main, merge, deploy, change shared
scope, or update external systems without authorization.

When you have a question or recommendation for another agent, use the AGENT
MESSAGE format in the appropriate GitHub Issue or PR. When finished, verify the
work and post the HANDOFF. State what was actually tested and what remains
unverified.
```

---

## 17. Optional future upgrade: live messaging

If asynchronous GitHub communication proves too slow, the team may adopt one shared
MCP communication service with tools resembling `register_agent`, `send_message`,
`read_inbox`, `claim_task`, `release_task`, `publish_finding`, and `update_status`.
Every computer would connect to the same authenticated service, and GitHub Issues
and PRs would still hold final decisions and engineering evidence. Do not claim
live cross-vendor messaging exists until every agent completes a verified
send-and-receive test through that service.

---

## References

- Codex repository instructions: <https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex>
- Claude Code project memory: <https://code.claude.com/docs/en/memory>
- GitHub project communication practices: <https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/best-practices-for-projects>
- Supabase Edge Functions: <https://supabase.com/docs/guides/functions>
- Supabase secret storage: <https://supabase.com/docs/guides/functions/secrets>
- Discord webhooks: <https://discord.com/safety/using-webhooks-and-embeds>
