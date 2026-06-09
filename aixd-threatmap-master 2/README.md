# AIxD Threat Map

Filterable database of AI threats and opportunities to democracy, built for P4D researchers to share with policymakers.

## Architecture

Astro 6 static site with a single React island (`<ThreatMap />`), deployed on Cloudflare Workers. Data lives in Cloudflare KV and is updated through a password-protected admin panel — no redeploys needed for content changes.

Uses `@astrojs/cloudflare`. To target a different host, swap the adapter in `astro.config.mjs` and implement a new backend in `src/lib/storage.ts` — the `StorageAdapter` interface is the seam.

## Stack

- Astro 6 + `@astrojs/cloudflare`
- React 19 (single island: `<ThreatMap />`)
- TanStack Table v8, shadcn/ui, Tailwind CSS v4, Beatrice font
- Cloudflare Workers + KV
- Bun, Python 3

## Local dev

```sh
bun install
bun run dev   # → http://localhost:4321
```

The admin panel at `/admin` requires a password. Create `.env.local`:

```sh
ADMIN_PASSWORD=yourpassword
# ADMIN_USERNAME=admin   # optional, defaults to "admin"
```

Without Cloudflare bindings, storage falls back to the local filesystem at `./data/kv-store/`.

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

## Cloudflare deployment

The KV namespace is declared in `wrangler.toml` without an ID. Wrangler (v3.91+) auto-creates it on first deploy:

```toml
[[kv_namespaces]]
binding = "DATA_KV"
```

Do not configure this binding only in the Cloudflare dashboard — `wrangler deploy` drops dashboard-only bindings on subsequent deploys.

Build and deploy:

```sh
bun run build && wrangler deploy
```

Set admin credentials as secrets:

```sh
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_USERNAME   # optional
```

## Admin panel

`/admin` — HTTP Basic Auth using the credentials above.

Upload a CSV, review the preview (item counts by type, warnings for unknown aspect codes, first 5 items), then publish. Each publish backs up the current live dataset. Restore is one click.

## Project structure

```
data/raw/             source CSV (committed)
public/data/
  aspects.json        P4Dem aspect codebook (committed)
  data.json           build-time seed; KV takes over at runtime
preprocessing/        Python pipeline (CSV → data.json)
src/
  components/         React components (ThreatMap, AdminPanel, shadcn/ui)
  lib/
    storage.ts        StorageAdapter — CloudflareKV or local filesystem
    types.ts          shared types across pipeline and frontend
    preprocessing.ts  TypeScript port of the pipeline (used by admin upload)
  middleware.ts       Basic Auth guard on /admin and /api/admin
  pages/
    admin/            admin panel (SSR)
    api/admin/        upload, publish, restore, preview endpoints
    data/data.json.ts KV endpoint with build-time fallback
wrangler.toml         Cloudflare Workers + KV config
```
