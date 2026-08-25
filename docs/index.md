# Place Explorer — docs

A static, single-page site holding every place I want to go, on one map, filterable by trip length, activity, and month. No backend, no accounts, no running cost.

The full rationale — every decision and the "why" behind it — lives in a private design doc outside this repo. These docs are the short, implementation-facing version: what's here, why it's shaped this way, and how to run it.

## Contents

- [Architecture](./architecture.md) — stack, repo layout, how the pieces fit together.
- [Data model](./data-model.md) — the `places.json` schema, in brief.
- [Adding places](./adding-places.md) — step-by-step recipe for an AI agent to add/edit places or experiences via `scripts/places.py`.
- [Development](./development.md) — environment setup, scripts, workflow.

## At a glance

| | |
| --- | --- |
| Stack | Vite + React + TypeScript, MapLibre GL + OpenFreeMap |
| Data | `data/places.json`, edited via [`scripts/places.py`](../scripts/places.py), validated against `data/places.schema.json` |
| Hosting | GitHub Pages, deployed via GitHub Actions on push to `main` |
| State | No router, no state library — URL carries only the selected place; filters live in `localStorage` |
| Status | Skeleton — folder structure and tooling only, UI not built yet |
