---
name: labs-demo-jev-state
description: "Created 2026-11-21 for a university talk on 2026-11-22: 31-slide .NET deck, all six live Jev demos verified against OpenRouter from the founder's Mac. Session-rating QR on the closing slide, both speaker roles (FrostAura, MagicOrange) on the opening slide, and 13 real sponsor logos in the strip. No speaker photo yet."
type: state
last_verified: 2026-11-21
---

# Current state

**Phase: talk-ready, not yet delivered.** Built in one session on 2026-11-21 for a university talk
the founder gives on 2026-11-22. Repository `frostaura/labs.demo.jev`, **public** from creation.
This directory is the only clone — the `~/src` clone it started in was removed the same session at
the founder's direction.

**Verified 2026-11-21 by a browser walk in the founder's Chrome** (`./run.sh`, port 5080):

- All 31 slides render on the 1920×1080 stage with no overflow, in both themes; no console errors.
- All six live demos returned real answers from `typesafe/jev-1.14` (snapshot
  `typesafe/jev-1.14-20261014`): Titanic yes/no, ticket class, both in one call, text triage through
  the typed C# endpoint, the race against `anthropic/claude-sonnet-5.5`, and the playground.
- Measured that day, one call at a time: Jev about 450–600 ms and about $0.000016–0.000022 per
  decision ($0.042 per million input tokens, output free — derived from `usage.cost`); the chat
  model about 1.0–1.4 s and about $0.0005, so roughly 2–3× slower and 30× dearer.
- Offline replay proven by running a second instance with an invalid key: a previously asked
  question replayed flagged as cached; a new one returned the 401.
- The sponsor strip was exercised with throwaway SVG logos, then removed.
- The real 13-logo strip was checked in headless Chromium against the running app in a cloud
  session (Linux, no API key): `/api/config` listed all 13 with their names, every logo sat whole
  inside its white card on slides 1 and 31 in both themes, and `dotnet build -warnaserror` gave
  0 warnings. Not yet seen on the founder's Mac.
- `dotnet build -warnaserror`: 0 warnings. The three XGBoost scripts were run in a throwaway
  virtualenv: 82.1% · 95.0% · 80.4% and 94.4%, the figures on the slides.

**Real sponsor logos are in** (founder, 2026-11-21): 13 PNGs in `assets/sponsors/` — the Data & AI
Community Day Durban event mark plus 12 sponsors — cropped from the founder's screenshot of the
event's sponsor slide, with display names in `Sponsors:Overrides`. The four invented `example-*.svg`
files and their overrides were removed at the founder's direction. Excluded on the founder's
markup: the .NET Conf banner, the heading, the tier labels and the individual contributor. The
crops are screenshot resolution (about 100–180 px tall); swap in vector originals if they turn up.

**Added later on 2026-11-21 (PR #1, merged), at the founder's
request:**

- A session-rating QR code on the Thank-you slide (`assets/rate-session.svg`, pointing at
  `https://durban-encore.sessionize.com`, the conference's Sessionize page), on the right next to the
  closing words.
- The speaker config is now a `Roles` list, and the opening slide shows both roles in order:
  FrostAura (Founder & CEO, since 2014), then MagicOrange (AI Architect, since October 2025), each
  with a one-line description. The MagicOrange line was written from its public site (IT and cloud
  cost-transparency software). The closing slide shows both titles on one line.
- These were checked from a cloud session, not the founder's Mac: `dotnet build -warnaserror`
  gave 0 warnings, the real app's `/api/config` returned both roles, and both slides fit at
  1920×1080 in both themes, with and without an event name and with the example sponsor strip.
  The QR code decodes to the right URL from the rendered slide.

**Not done:** no speaker photo supplied; no automated tests; not walked on the actual projector;
the session-rating QR, the speaker-role changes and the real sponsor strip have not been seen on
the founder's Mac.

**The key in use during verification came from the founder's shell environment**, not from `.env`
— `.env` was still blank when the session's checks ran. A real environment variable wins over the
file.
