---
name: labs-demo-jev-decisions
description: "Founder calls of 2026-11-21: public repo from creation, code lives in the tree not ~/src, black-on-white elegant look after rejecting the first dark design, annotated Jev JSON slides. The org slug `demo` is new."
type: decision
last_verified: 2026-11-21
---

# Live decisions

- **Public from creation (founder, 2026-11-21).** The founder asked for a public repository in the
  opening request. *Why:* the deck is shown to an audience and its closing slide points them at
  the source. This is the stealth-by-default exception Labs requires to be recorded.
- **The code lives in this directory, not under `~/src` (founder, 2026-11-21).** Work began in
  `~/src/labs.demo.jev` under the develop-outside-iCloud habit; the founder said twice that this
  directory is the correct place and that the `.env` must be here. The `~/src` clone was removed
  after its commits were pushed. *Why it holds:* the project is small and has no file watcher or
  heavy build, the two things that made iCloud painful elsewhere. Do not move it back.
- **Black on white, elegant and modern (founder, 2026-11-21).** The first design was a
  white-on-black, heavy-bordered "projector" look; the founder rejected it outright. The default is
  now black on white with soft cards and one accent colour; the dark theme survives only behind the
  `C` key. *Why:* the founder's taste, and dark-on-light survives a weak projector.
- **Slides show the raw Jev JSON with each keyword explained (founder, 2026-11-21).** Request,
  question types and response each have an annotated slide. *Why:* the founder wants the audience
  to see what is actually sent, not only a typed wrapper.
- **`demo` as the `<org>` segment (agent's reading of the founder's chosen name).** The founder
  named the repository `labs.demo.jev`; `demo` is not a client or FrostAura's own `fa`. It is read
  here as "a demonstration, not a product". Ask before reusing it as a convention.
- **Agent choices the founder has not reviewed:** an offline replay cache so a dropped connection
  mid-talk replays the last real answer, flagged on screen; a timed race against a chat model
  (`COMPARE_MODEL`); an honest "when to use which" slide stating that a trained model usually
  still wins on its own table; ticket-class fare hints written into the `criteria` text.
