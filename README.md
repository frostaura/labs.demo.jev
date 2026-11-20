# labs.demo.jev — Everything Is a Classification Problem

A conference talk that runs as a web app. It walks a general audience from *"almost any problem is a
classification problem"*, through the traditional way of solving one (XGBoost on the Titanic
dataset), to **Jev** — TypeSafe's decision model — answering the same questions live, with no
training at all.

The slides are a single page served by a small .NET web application. The live demos call Jev
**directly** through OpenRouter's Decisions API (`POST /api/alpha/decisions`), not through the Jev
Router.

## Run it

1. Copy `.env.example` to `.env` and paste your [OpenRouter key](https://openrouter.ai/keys) after
   `OPENROUTER_API_KEY=`. `.env` is git-ignored.
2. Start the app (needs the .NET 10 SDK):

   ```bash
   ./run.sh
   ```

3. Open <http://localhost:5080>.

| Key | Does |
| --- | --- |
| `→` `Space` `PageDown` | Next slide (presentation clickers send `PageDown`) |
| `←` `PageUp` | Previous slide |
| `Home` / `End` | First / last slide |
| `F` | Fullscreen |
| `C` | Flip contrast: black-on-white (default) ↔ white-on-black |

Append `#12` to the address to open on slide 12. The badge at the bottom right is green when a key
is loaded.

## Make it yours

Everything a speaker changes lives in `src/Jev.Demo/appsettings.json`:

- **`Talk`** — title, subtitle, event name, and the speaker's name, role, bio lines, links and
  optional photo (a path under `wwwroot`, e.g. `assets/speaker.jpg`).
- **`Sponsors`** — the scrolling logo strip on the first and last slides.

### Sponsor logos

Drop any number of image files into `src/Jev.Demo/wwwroot/assets/sponsors/` and refresh the page.
No rebuild, no restart; the strip repeats the set until it fills the screen and scrolls forever.
With no files, the strip is hidden. Optional settings (`Heading`, `SecondsPerLogo`, `Exclude`, and
per-file `Overrides` for name, link and order) are described in
[that folder's README](src/Jev.Demo/wwwroot/assets/sponsors/README.md).

## What is in the talk

| Part | Slides | Content |
| --- | --- | --- |
| Opening | 1–2 | Speaker and sponsors; what we will learn |
| 1 · Everything is classification | 3–5 | Eight everyday examples; the three shapes (yes/no, one of many, several at once); a chatbot is a classifier in a loop |
| 2 · The traditional way | 6–12 | The label → encode → train recipe; the Titanic data; three XGBoost snippets with their real outputs; what it cost |
| 3 · Meet Jev | 13–21 | What a decision model is; embeddings; LLM vs Jev; fast, cheap, typed; the request and response JSON with every keyword explained; type safety in C# |
| 4 · Live | 22–28 | The same three Titanic questions answered by Jev; free-text triage; a timed race against a chat model; an audience playground |
| Close | 29–31 | When to use which; recap; thank you and sponsors |

## How it works

```
browser (wwwroot: index.html · styles.css · app.js)
   │  POST /api/decide   { state, questions }
   ▼
Jev.Demo (.NET minimal API)  ── adds the key and model, times the call ──▶  OpenRouter Decisions API ──▶ Jev
```

| Endpoint | Purpose |
| --- | --- |
| `GET /api/config` | Talk, speaker, discovered sponsor logos, and whether a key is loaded |
| `POST /api/decide` | Ask Jev any typed questions about any state |
| `POST /api/race` | The same question to Jev and to `COMPARE_MODEL`, timed side by side |
| `POST /api/triage` | The type-safe example: C# enums in, a typed `TriageDecision` out |

The API key never reaches the browser. Latency and cost on screen are measured on each call, not
quoted from a brochure.

**Offline safety net.** Every successful answer is saved under `src/Jev.Demo/.cache/`. If a call
fails mid-talk (Wi-Fi, rate limit, credits), the last real answer to that exact question is replayed
and the badge turns from `LIVE` to `REPLAY (offline)`. Click through every demo once before going
on stage to warm it.

### Jev in one request

```json
{
  "model": "typesafe/jev-1.14",
  "state": { "customerMessage": "I was charged twice this month…" },
  "questions": {
    "department": {
      "type": "choice",
      "instructions": "Which team should handle this?",
      "criteria": { "billing": "Charges, invoices and refunds", "sales": "Pricing and upgrades" }
    }
  }
}
```

| Keyword | Meaning |
| --- | --- |
| `state` | The situation to judge: any text or JSON |
| `questions` | One or more named questions, answered in the same call |
| `type` | `noul` (yes/no → probability of yes) · `choice` (one of your options) · `score` (position on your ordered scale) |
| `instructions` | The question in plain language |
| `criteria` | The only allowed answers and what each means |

## The XGBoost examples

`examples/xgboost/` holds the three scripts shown on the slides. The accuracies on the slides are
their actual output.

```bash
cd examples/xgboost
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python 1_binary.py        # did they survive?            → 82.1%
.venv/bin/python 2_multiclass.py    # which ticket class?          → 95.0%
.venv/bin/python 3_multioutput.py   # both at once                 → 80.4% and 94.4%
```

## Honest notes

- Jev runs on OpenRouter's **alpha** Decisions API; its shape may change.
- The slides say a trained model usually still wins on its own table. That is deliberate: the point
  is the trade-off, not a winner.
- OpenRouter's documentation does not describe Jev's internals. The embeddings slides explain the
  general technique every neural network uses to turn text into numbers.

## Licence

MIT — see [LICENSE](LICENSE).
