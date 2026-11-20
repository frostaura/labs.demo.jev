# Sponsor logos

Drop any number of logo files in this directory (`.png`, `.jpg`, `.jpeg`, `.svg`, `.webp`, `.gif`).
They appear in the scrolling sponsor strip on the opening and closing slides on the next page
load — no rebuild, no restart. Logos are sorted by file name; prefix with `01-`, `02-` to order them.

## The example logos

The four `example-*.svg` files are made-up companies, there so the strip has something to show and
so you can see how it is wired. **Delete them when the real logos arrive**, and remove their four
entries from `Sponsors:Overrides` in `appsettings.json` (an override whose file is missing is
simply ignored, so nothing breaks if you forget).

Logos sit on a white tile about twice as wide as it is tall. A wide, horizontal logo with a
transparent or white background fills it best; anything else is scaled down to fit, never cropped.

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
