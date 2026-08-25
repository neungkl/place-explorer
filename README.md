# Place Explorer

A static, single-page site holding every place I want to go, on one map — filterable by trip length, activity, and month. No backend, no accounts, no running cost.

See [`docs/`](./docs/index.md) for architecture, the data model, and how to develop.

## Quick start

```bash
mise trust && mise install   # pin + install the Node version (see mise.toml)
npm install
npm run dev
```

## Stack

Vite + React + TypeScript, MapLibre GL + OpenFreeMap, a hand-edited `data/places.json`. Deploys to GitHub Pages via GitHub Actions.
