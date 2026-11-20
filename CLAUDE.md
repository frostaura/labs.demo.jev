# labs.demo.jev — Jev classification talk

## Research question
**None — this is a talk, not a bet.** It is a public demonstration deck the founder presents to a general (university) audience. It tests no hypothesis and has no product behind it. It sits in Labs only because the routing rule sends early, odd-shaped work here; that it carries no research question is a placement signal, recorded rather than disguised.

## What this program is
A slideshow that runs as a small .NET web application. It argues that almost any problem can be phrased as classification, shows the traditional solution (XGBoost on the Titanic dataset — yes/no, one of many, several at once), then introduces **Jev**, TypeSafe's decision model, and answers the same questions live through OpenRouter's Decisions API. The audience-facing claims about speed and cost are measured on screen per call.

## Stack & repo
Repository `frostaura/labs.demo.jev` (public). **This directory is the working clone** — the founder directed that the project live here, in the tree, rather than under `~/src`.

- `src/Jev.Demo` — ASP.NET Core minimal API, .NET 10. `OpenRouterClient` (Jev decisions, the chat-model race, the on-disk replay cache), `TypedDecisions` (enum-driven questions and typed answers), `Sponsors` (logo discovery), `DotEnv`.
- `src/Jev.Demo/wwwroot` — the deck: `index.html` (every slide), `styles.css` (design tokens at the top), `app.js` (navigation and live demos), `data/titanic.json`, `assets/sponsors/`.
- `examples/xgboost` — the three Python scripts whose output the slides quote.

**Declared deviations from the mandated stack** (authority: the founder's brief for a "simple .NET web application" serving an HTML slideshow): the frontend is dependency-free HTML, CSS and JavaScript rather than React + Tailwind + shadcn/ui; there is no database and no EF Core; there is no deploy chain — it runs on the presenter's laptop.

## Owner & key people
Dean Martin (founder, presenter).

## Milestones
1. **Talk-ready** — every slide renders at 1920×1080 without overflow, and every live demo returns a real Jev answer from the presenter's laptop.
2. **Delivered** — presented once to a live audience.

## Kill criteria
- The talk has been delivered and no second delivery is scheduled within 90 days — archive the repository and remove this directory.
- OpenRouter's alpha Decisions API changes or withdraws and no talk is scheduled that would justify re-fitting the deck.

## Graduation pathway
None intended. If the typed-decision wrapper (`TypedDecisions.cs`) proves useful in a product, it moves into that product's repository; the deck itself does not graduate.

## Conventions & invariants
- **Jev is called directly** at `POST https://openrouter.ai/api/alpha/decisions`. Never route the demos through the Jev Router chat model.
- **The API key stays server-side.** The browser only ever talks to this app's `/api/*` endpoints.
- **Black on white is the default theme**; the inverted theme is the `C` key. Colours exist only as tokens at the top of `styles.css`.
- **The stage is a fixed 1920×1080 canvas scaled to the window.** Size everything in stage pixels; never add scrolling to a slide.
- **Numbers on slides are real.** XGBoost accuracies are the output of the scripts in `examples/xgboost`; if a script changes, re-run it and update the slide. Latency and cost are measured live, never hard-coded.
- **Claims about Jev stay within what is documented or measured.** OpenRouter's docs do not describe Jev's internals — do not add architecture claims.
- **Sponsor logos are the founder's to supply.** The only other images allowed in the sponsor folder are the invented `example-*.svg` files, kept at the founder's request to show how the strip and its `Overrides` work; never add a real company's mark that the founder did not hand over. An empty sponsor folder hides the strip.
- **Zero build warnings** — `dotnet build -warnaserror`.

## Build / test / run
- Run: `./run.sh` → <http://localhost:5080>. It sets `MSBuildEnableWorkloadResolver=false`, which this Mac's system .NET SDK needs for a plain web project to load.
- Build: `MSBuildEnableWorkloadResolver=false dotnet build -warnaserror`.
- Credentials: `OPENROUTER_API_KEY` in `.env` at the repo root (`.env.example` is the template). A real environment variable of the same name wins over the file.
- XGBoost examples: see `README.md`.
- There is no automated test suite; verification is a browser walk of every slide and every demo button.

## Never do this here
- Never commit `.env`, or print its values — inspect it by key name only.
- Never commit `src/Jev.Demo/.cache/` — it holds real API responses.
- Never add a scheduled or cron CI workflow.

## Upkeep

This file, `MEMORY.md` and its `memory/` topic store are kept current as changes land. Update the topic files at the end of any session that changed reality, then regenerate the index from the tree root with `python3 .claude/scripts/audit-tree.py --no-git --fix-index --scope Labs/projects/labs.demo.jev`; never hand-edit `MEMORY.md`. Edit this file only when a rule changed. Empty `.tmp/` before the session ends.
