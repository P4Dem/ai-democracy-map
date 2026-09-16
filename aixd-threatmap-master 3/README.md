# AIxD Threat Map

Filterable, searchable database of AI threats and opportunities to democracy, mapped to the IDEA Democracy Assessment Framework. Built for P4D researchers.

**Staging:** https://nashthecoder.github.io/ai-democracy-map-dev/  
**Production:** https://p4dem.github.io/ai-democracy-map/

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | >= 22.12.0 | Required by Astro 6 (v20 won't work) |
| **Bun** | latest | Package manager + dev server |
| **Python 3** | any 3.x | Data preprocessing pipeline |
| **Git** | any | Version control |

**Node.js version:** If `node --version` shows < 22, use nvm:

```sh
# Install Node 22 (one-time)
nvm install 22
nvm use 22

# Optional: make 22 the default
nvm alias default 22
```

## Quick start

**Important:** The repo path contains `$Connections` — the dollar sign can break Python's virtual environment. If you need the Python preprocessing pipeline, skip ahead to the [Python venv fix](#python-venv-fix) section first.

For the frontend only (no data preprocessing):

```sh
# 1. Enter the source directory
cd "aixd-threatmap-master 2"

# 2. Install JS dependencies
bun install

# 3. Start dev server
PUBLIC_BASE_PATH=/ bun run dev
```

Open **http://localhost:4321** in your browser.

> **About the base path:** The Astro config sets `base` to `/ai-democracy-map-dev` (for GitHub Pages deployment under a subdirectory). Override it with `PUBLIC_BASE_PATH=/` for local dev so the app serves at the root. Without this override, you'd need to visit `http://localhost:4321/ai-democracy-map-dev/`.

### Python venv fix (if `$` is in your repo path)

The repo path `Billion$Connections/` contains a literal `$` sign. Python's venv writes this into shell scripts, and at runtime `$Connections` is interpreted as a variable expansion, breaking pip, pytest, etc.

Workaround — create the venv outside the repo:

```sh
python3 -m venv /tmp/aixd-venv
cp -r /tmp/aixd-venv preprocessing/.venv
# Patch all venv scripts to escape the dollar sign
sed -i '' 's/Billion$Connections/Billion\\$Connections/g' preprocessing/.venv/bin/*
source preprocessing/.venv/bin/activate
pip install -r preprocessing/requirements.txt
```

Alternatively, symlink the repo into a path without a dollar sign:

```sh
ln -s "/full/path/to/Billion$Connections/ai-democracy-map" ~/Desktop/ai-democracy-map
cd ~/Desktop/ai-democracy-map/"aixd-threatmap-master 2"
# Now Python venv works normally
```

### Full setup (for data work)

```sh
# 1. Node + Bun (from above)
nvm use 22
cd "aixd-threatmap-master 2"
bun install

# 2. Python venv (with dollar-sign workaround)
# See "Python venv fix" above

# 3. Verify everything works
bun run dev                  # Frontend
bun test                     # TS tests (39)
pytest preprocessing/tests/  # Python tests (32)
bun run build                # Production build
```

## Stack

- **Framework:** Astro 6 (static)
- **UI:** React 19, TanStack Table v8, shadcn/ui (Base UI)
- **Styling:** Tailwind CSS v4, Beatrice font
- **Hosting:** GitHub Pages (via GitHub Actions)
- **Data:** CSV → Python → static JSON

## Brand Colors

### Primary

| Name | RGB | Hex | Use |
|---|---|---|---|
| Black | 0 / 0 / 0 | `#000000` | Text, objects, backgrounds |
| Ecru | 244 / 244 / 234 | `#F4F4EA` | Objects and backgrounds |

### Accent

| Name | RGB | Hex | Use |
|---|---|---|---|
| Brick | 150 / 55 / 53 | `#963735` | Threats, danger, Pillar 1 |
| Grassroot | 0 / 177 / 64 | `#00B140` | Mitigation strategies, opportunities, Pillar 2 |
| Blue | 153 / 194 / 255 | `#99C2FF` | Pillar 3, accent |
| Lime | 217 / 236 / 68 | `#D9EC44` | Pillar 4 |
| Orange | 255 / 127 / 50 | `#FF7F32` | Supplementary accent |
| Rose | 255 / 185 / 220 | `#FFB9DC` | Supplementary accent |

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
