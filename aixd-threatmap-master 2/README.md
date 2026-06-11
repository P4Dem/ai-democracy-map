# AIxD Threat Map

Filterable database of AI threats and opportunities to democracy, built for P4D researchers to share with policymakers.

## Architecture

Astro 6 static site with a single React island (`<ThreatMap />`), deployed on GitHub Pages via GitHub Actions. Data is compiled from CSV at build time and served as static JSON files.

## Stack

- Astro 6 (static)
- React 19 (single island: `<ThreatMap />`)
- TanStack Table v8, shadcn/ui (Base UI), Tailwind CSS v4, Beatrice font
- GitHub Pages (via GitHub Actions)
- Bun, Python 3

## Local dev

```sh
bun install
bun run dev   # → http://localhost:4321
```

The site is fully static — no server, no database, no admin panel. Data updates are done by editing `data/raw/mapping.csv` and committing.

## Data model

Two files drive the entire dataset:

**`public/data/aspects.json`** — the P4Democracy codebook. 16 aspect codes across 4 pillars (e.g. `2.1 Free and Fair Elections`). Each entry has a code, name, short definition, full description, and pillar. This file is the authoritative reference; the preprocessing pipeline warns on any CSV row that references an unknown code.

**`data/raw/mapping.csv`** — the source data. Each row is one entry with:
- A `Stable ID` (permanent identifier)
- Up to 3 text fields: threat (paraphrased + verbatim), mitigation strategy (paraphrased + verbatim), independent opportunity (paraphrased + verbatim) — `///` marks an absent field
- A `Source` field containing a full citation and URL
- Up to 6 `P4Dem Category` columns referencing aspect codes

The pipeline classifies each row as `threat`, `threat-solution`, or `independent-opportunity` based on which text fields are present, extracts the aspect codes, derives a short source label, and strips the URL from the citation string.

## Data pipeline

```
data/raw/mapping.csv + public/data/aspects.json
  → preprocessing/preprocess.py
  → public/data/data.json        (committed as build-time seed)
  → /data/data.json endpoint     (reads from KV at runtime, falls back to seed)
```

To regenerate the seed after a CSV update:

```sh
cd preprocessing
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cd .. && bun run preprocess
```

Tests: `pytest preprocessing/tests/`

Researchers can also publish CSV updates directly through the admin panel without touching the pipeline — the admin upload endpoint runs the same TypeScript port of the pipeline server-side.

## GitHub Pages deployment

The site builds as static files and deploys via GitHub Actions on push to `dev` or `main`:

1. Installs Bun + dependencies
2. Runs `bun run build`
3. Uploads `dist/` as a GitHub Pages artifact
4. Deploys to GitHub Pages

To deploy manually:

```sh
bun run build
```

## Project structure

```
data/raw/             source CSV (committed)
public/data/
  aspects.json        P4Dem aspect codebook (committed)
  data.json           build-time static data source (committed)
preprocessing/        Python pipeline (CSV → data.json)
src/
  components/         React components (ThreatMap, shadcn/ui)
  lib/
    types.ts          shared types
    utils.ts          utility functions (cn, exportToCsv)
  pages/
    index.astro       single page (static)
```
