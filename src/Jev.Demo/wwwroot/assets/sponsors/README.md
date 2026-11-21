# Sponsor logos

Drop any number of logo files in this directory (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`).
They appear in the scrolling sponsor strip on the opening and closing slides on the next page
load — no rebuild, no restart. Logos are sorted by file name; prefix with `01-`, `02-` to order them.

## The current set

The event mark first, then the sponsors by tier (platinum, gold, silver, then Derivco), each cropped
from the event's sponsor slide. Their display names live in `Sponsors:Overrides` in
`appsettings.json` (an override whose file is missing is simply ignored).

Every logo sits whole inside a white card about twice as wide as it is tall, in both themes. A
wide, horizontal logo with a transparent or white background fills it best; anything else is
scaled to fit, never cropped.

## Settings

Optional tuning lives in `appsettings.json` under `Sponsors`:

```json
"Sponsors": {
  "Directory": "assets/sponsors",
  "Heading": "With thanks to our sponsors",
  "SecondsPerLogo": 4,
  "Exclude": [ "old-logo.png" ],
  "Overrides": [
    { "File": "01-acme.png", "Name": "Acme Corp", "Url": "https://acme.example", "Order": 1 }
  ]
}
```
