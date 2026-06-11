# AIxD Threat Map

Filterable, searchable database of AI threats and opportunities to democracy, mapped to the IDEA Democracy Assessment Framework. Built for P4D researchers.

**Staging:** https://nashthecoder.github.io/ai-democracy-map-dev/  
**Production:** https://p4dem.github.io/ai-democracy-map/

## Quick start

```sh
git clone <repo-url>
cd "aixd-threatmap-master 2"
bun install
bun run dev        # → http://localhost:4321
```

## Requirements

| Tool | Version |
|---|---|
| Node.js | >= 22.12.0 |
| Bun | latest |
| Python 3 | any 3.x |

## Stack

- **Framework:** Astro 6 (static)
- **UI:** React 19, TanStack Table v8, shadcn/ui (Base UI)
- **Styling:** Tailwind CSS v4, Beatrice font
- **Hosting:** GitHub Pages (via GitHub Actions)
- **Data:** CSV → Python → static JSON

## Two-repo workflow

| Repo | Branch | Role | URL |
|---|---|---|---|
| `nashthecoder/ai-democracy-map-dev` | `dev` | Staging — make changes, test, preview | `https://nashthecoder.github.io/ai-democracy-map-dev/` |
| `P4Dem/ai-democracy-map` | `main` | Production — push when ready | `https://p4dem.github.io/ai-democracy-map/` |

Push to staging to preview changes. When ready, push staging `dev` to production `main`:

```sh
git remote add prod https://github.com/P4Dem/ai-democracy-map.git
git push prod dev:main
```

The GitHub Action auto-detects the repo name and sets the correct base path — no config changes needed between repos.

## CI checks (run on every push and PR)

1. **Type check** — `bun run typecheck` (tsc --noEmit)
2. **Tests** — `bun test` (39 TypeScript tests)
3. **Build** — `bun run build` (astro build)

All three must pass before deploy. If any fail, the PR shows a red X and deploy is blocked.

## Data pipeline

```
data/raw/mapping.csv + public/data/aspects.json
  → preprocessing/preprocess.py
  → public/data/data.json  (committed — static data source)
```

To regenerate after updating the CSV:

```sh
source preprocessing/.venv/bin/activate
bun run preprocess
```

Tests: `pytest preprocessing/tests/`

## Data model

- **`data/raw/mapping.csv`** — source data. Each row: stable ID, threat (paraphrased + verbatim), mitigation strategy (paraphrased + verbatim), independent opportunity (paraphrased + verbatim), source citation/URL, up to 6 aspect codes.
- **`public/data/aspects.json`** — P4Democracy codebook. 16 aspect codes across 4 pillars. The authoritative reference; the pipeline warns on unknown codes.
- **`public/data/data.json`** — preprocessed build artifact, committed for static deployment.

## Commands

| Command | Description |
|---|---|
| `bun run dev` | Dev server at localhost:4321 |
| `bun run build` | Production build → `dist/` |
| `bun run preview` | Preview production build locally |
| `bun run preprocess` | Regenerate data.json from CSV |
| `bun run typecheck` | TypeScript type check |
| `bun run lint` | TypeScript type check (alias) |
| `bun test` | TypeScript unit tests |
| `pytest preprocessing/tests/` | Python preprocessing tests |

## Project structure

```
data/raw/             source CSV (committed)
public/data/
  aspects.json        P4Dem codebook (committed)
  data.json           build-time data source (committed)
preprocessing/        Python pipeline + tests
src/
  components/         React components (ThreatMap, DataTable, etc.)
  hooks/              useDataLoader, useFilters
  lib/                types.ts, utils.ts
  pages/              index.astro (single page)
  styles/             globals.css (Tailwind + P4D theme)
```

## Architecture

Single page, fully static. React handles all interactivity (filtering, search, infinite scroll). Data fetches at runtime via the `useDataLoader` hook. No server, no database, no admin panel. Data updates go through the CSV → commit → auto-deploy pipeline.

For full design system and component documentation, see `CLAUDE.md`.
