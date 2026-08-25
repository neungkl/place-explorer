# Data model

`data/places.json` is a flat array of places, edited through [`scripts/places.py`](../scripts/places.py) rather than by hand — run `python3 scripts/places.py --help` for the full command list (add/remove places and experiences, set season bands, plans, visits). Every mutating command saves and immediately runs `npm run validate`. Full field-by-field rationale lives in the design doc — this is the shape, for quick reference.

## Place vs. experience

**A place is one pin, an experience is one reason to go there.** Koh Tao is one place with two experiences — scuba diving and island hiking — each with its own tags, seasons, plan, and visits. A place with one experience is the common case.

```jsonc
{
  "id": "koh-tao",
  "name": "Koh Tao",
  "region": "Surat Thani, Thailand",
  "tier": { "min": "weekend", "max": "long" },
  "location": { "lat": 10.0956, "lng": 99.8403, "precision": "exact" },
  "gmaps": "https://www.google.com/maps/place/Koh+Tao/@10.0956,99.8403,13z",
  "description": "Cheap, warm, reliable diving.",
  "travel": "Overnight bus + ferry, ~9h. Or fly to Samui + ferry, ~4h.",
  "photo": { "src": "photos/koh-tao.webp", "credit": "own, 2026" },
  "emoji": null,
  "experiences": [
    {
      "id": "dive",
      "title": "Scuba diving",
      "tags": ["scuba-diving", "beach"],
      "seasons": {
        "peak": { "months": [3, 4, 5, 6, 7, 8], "why": "Flat seas, 25m+ viz, whale sharks Mar–May." },
        "unavailable": { "months": [11, 12], "why": "NE monsoon — most shops closed, ferries cancelled." }
      },
      "plan": { "year": 2026, "month": 8 },
      "visits": [{ "start": "2026-08-15", "end": "2026-08-17", "note": "AOW checkout dives" }]
    }
  ]
}
```

## Field notes

- **`tier`** is a band (`{ min, max }`), not a single value — a place can span "weekend to a week." Manually assigned; the site never estimates travel time (see below).
- **`location.precision`** is `exact` or `approximate`. Any band whose `min` is below `long` must be `exact` — schema-enforced.
- **`seasons`** has up to four bands: `peak`, `mid`, `low`, `unavailable`. Their `months` arrays must together cover 1–12 exactly, no gaps or dupes. Every band should carry a one-line `why`; required for `unavailable`.
- **`plan`** is two independent nullable fields, `year` and `month` — not one enum. `{ year: 2027, month: null }` ("2027, haven't picked the month") is a real, common, and valid state.
- **`visits`** is a list of dated visits (`start`, optional `end`), not a boolean — so repeat trips and partial-precision dates (`"2021-07"`) are both representable.
- **`gmaps`** is a stored real Google Maps URL, not derived from coordinates — it should open the actual place (reviews, photos), not just drop a pin. Optional; falls back to a coordinate- or name-based link when missing.
- **Ids are stable slugs.** Place ids are globally unique; experience ids unique within their place. Deep links use `place-id/experience-id`.

## Distance: haversine only, never routing

The site computes straight-line (haversine) distance from a configurable home base, used only for (1) sorting the "someday" list nearest-first, and (2) a build-time sanity warning when a place's manual tier looks wrong for its distance. It is never used to assign tiers and never drawn as travel-time rings — road/ferry/flight routing can't be inferred from distance, so tiers stay a manual, honest judgment call. See the design doc for the full argument against a routing API.

## Tags

Open-ended but registered — see [`config.ts`](../config.ts). A tag used in `places.json` must exist in the `TAGS` registry there, so typos fail validation instead of silently splitting a filter in two (e.g. `scuba` vs. `scuba-diving`). Adding a new tag is a one-line addition to that file.

## Validation

`data/places.schema.json` enforces structure and types — run it with:

```bash
npm run validate
```

This checks shape (required fields, enums, types) but not yet the cross-field semantic rules described above (month coverage, tier/precision consistency, tag-registry membership). Those land alongside the filter logic in a later phase — see the design doc's Phasing section.
