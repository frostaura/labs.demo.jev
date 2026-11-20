---
name: labs-demo-jev-state
description: "Created 2026-11-21 for a university talk on 2026-11-22: 31-slide .NET deck, all six live Jev demos verified against OpenRouter from the founder's Mac. Public repo, in-tree clone is the working copy. No sponsor logos or speaker photo yet."
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
- `dotnet build -warnaserror`: 0 warnings. The three XGBoost scripts were run in a throwaway
  virtualenv: 82.1% · 95.0% · 80.4% and 94.4%, the figures on the slides.

**Not done:** no sponsor logos and no speaker photo supplied; the speaker bio in
`appsettings.json` is a two-line stand-in written from the root brand lines; no automated tests;
not walked on the actual projector.

**The key in use during verification came from the founder's shell environment**, not from `.env`
— `.env` was still blank when the session's checks ran. A real environment variable wins over the
file.
