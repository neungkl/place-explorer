# Architecture

## Stack

- **Vite + React + TypeScript** — static build, no server.
- **MapLibre GL JS + [OpenFreeMap](https://openfreemap.org/)** vector tiles — free, no API key, no billing to lapse. The style URL lives in [`config.ts`](../config.ts) so swapping providers later is a one-line change.
- **No state library.** The only thing in the URL is the selected place (`?p=place-id` or `?p=place-id/experience-id`); everything else (filters, home base) lives in `localStorage`.
- **`data/places.json`** is imported at build time and ships inside the bundle — there is no client-side data fetch and no loading state for data.

## Repo layout

```
place-explorer/
├── data/
│   ├── places.json           # the actual wishlist — hand-edited
│   └── places.schema.json    # JSON Schema, structural validation
├── scripts/
│   └── validate-places.mjs   # runs the schema check (`npm run validate`)
├── src/
│   ├── components/           # FilterBar, Map, PlaceList, PlaceCard, ...
│   ├── lib/                  # filtering, distance, URL state, gmaps link building
│   ├── types.ts              # Place / Experience / Season / Plan / Visit types
│   ├── App.tsx
│   └── main.tsx
├── config.ts                 # home base default, tag vocabulary registry, map style URL
├── mise.toml                 # pinned Node version + dev tasks
└── .github/workflows/
    └── deploy.yml            # build + validate + deploy to GitHub Pages on push to main
```

This mirrors the layout sketched in the design doc's tech-stack section, with `scripts/` added for the schema-validation step.

## Why no backend

Everything the site needs — the place list, the tag registry, the map style — is static and known at build time. Adding a backend would mean a service to keep alive; the explicit goal is a site that still works in five years with nobody maintaining it. See the design doc's Goals and "The map fails" sections for the reasoning, including what happens if OpenFreeMap itself goes away.

## Current status

This is phase 0 — folder structure, tooling, and a placeholder `App.tsx` that loads `places.json` and prints a count. No map, no filters, no sheet UI yet. See the design doc's Phasing section for what comes next.
