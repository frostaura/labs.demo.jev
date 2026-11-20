# Sponsor logos

Drop any number of logo files in this directory (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`).
They appear in the scrolling sponsor strip on the opening and closing slides on the next page
load — no rebuild, no restart. Logos are sorted by file name; prefix with `01-`, `02-` to order them.

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
