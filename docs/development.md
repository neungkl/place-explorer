# Development

## Setup

Tooling is pinned with [mise](https://mise.jdx.dev/) — one `mise.toml` fixes the Node version so `npm install` and builds are reproducible.

```bash
mise trust      # first time only, approves this repo's mise.toml
mise install    # installs the pinned Node version
npm install
```

If you don't use mise, any Node ≥ 20 should work — check `mise.toml` for the exact pinned version.

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build the static site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Lint with [oxlint](https://oxc.rs/docs/guide/usage/linter.html) |
| `npm run validate` | Validate `data/places.json` against `data/places.schema.json` |

Equivalent `mise run <task>` versions exist for `dev`, `build`, `lint`, and `preview` in `mise.toml`.

## Editing places

`data/places.json` is hand-edited. Run `npm run validate` after editing — it catches structural mistakes (missing fields, bad enums, malformed months) before they reach the app. See [data-model.md](./data-model.md) for the field reference.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which validates the data, builds, and publishes `dist/` to GitHub Pages. No manual deploy step needed.
