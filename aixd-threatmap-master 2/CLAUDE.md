# AIxD Threat Map

## What it is

Filterable, searchable table of ~190 AI threats and opportunities mapped to the IDEA Democracy Assessment Framework (P4Democracy aspect codes). Built for P4D researchers to share with policymakers. Data is researcher-maintained via CSV and published through an admin panel without code changes.

## Stack

- **Frontend:** Astro 6 (static) + React 19 island + TanStack Table v8 + shadcn/ui (Base UI) + Tailwind CSS v4
- **Hosting:** GitHub Pages (static via GitHub Actions)
- **Data:** Static JSON files (`public/data/data.json` + `public/data/aspects.json`) fetched at runtime
- **Preprocessing:** Python 3 (framework-free, `preprocessing/preprocess.py`)
- **Package manager:** Bun
- **Testing:** Bun test runner (`bun:test`) for TypeScript, pytest for Python

## Commands

- `bun run dev` — Astro dev server at localhost:4321
- `bun run build` — production build
- `bun run preprocess` — regenerate `public/data/data.json` from `data/raw/mapping.csv`
- `bun test` — TypeScript unit tests (preprocessing module)
- `pytest preprocessing/tests/` — Python preprocessing tests

## Architecture

Single React island pattern: `src/pages/index.astro` imports `globals.css` and renders `<ThreatMap client:load />`. All table interactivity lives in React; Astro owns the shell.

All pages prerender at build time — no SSR. The site is fully static and deploys to GitHub Pages via GitHub Actions.

## Data flow

```
data/raw/mapping.csv + public/data/aspects.json
  → bun run preprocess (Python)
  → public/data/data.json   (committed as build-time data source)
```

Data is fetched at runtime by the React app via the `useDataLoader` hook. No server or KV store involved — purely static.

## Design system

**Brand:** Power4Democracy (P4D). Authoritative, grounded, accessible. Looks like a think-tank publication, not a startup dashboard.

**Theme:** Light only. Ecru background (`#F4F4EA`), white cards.

**Font:** Beatrice (P4D brand grotesque). OTF files in `public/fonts/`. Loaded via `@font-face` in `globals.css`. Set globally at `17px` — no media query (avoids CLS).

**Colors (semantic):**
- `--color-p4d-ecru: #F4F4EA` — page background
- `--color-p4d-brick: #963735` — threats, danger, destructive actions, Pillar 1
- `--color-p4d-grassroot: #00B140` — mitigation strategies, opportunities, publish actions, Pillar 2
- `--color-p4d-blue: #92C2FF` — Pillar 3, accent
- `--color-p4d-lime: #D9E021` — Pillar 4, warnings
- `--color-p4d-orange: #FF8E32`, `--color-p4d-pink: #FFB3E6` — supplementary

**Principles:**
1. Data density over decoration — the table is the product
2. Brand colors carry meaning — brick = threat/danger, grassroot = mitigation strategy/opportunity
3. Hierarchy through typography, not chrome — weight and size, not borders or fills
4. Ecru base is intentional — preserve it across all surfaces
5. Restraint is the aesthetic — considered, not stripped

## Component map

| File | Role |
|---|---|
| `ThreatMap.tsx` | Root island — loads data, owns filter state, URL sync, sticky filterbar |
| `DataTable.tsx` | TanStack table, infinite scroll, row grouping, skeleton |
| `FilterBar.tsx` | Search, type/aspects/source/mapped filters, filter pills, CSV export, sticky state |
| `IntroSection.tsx` | Count-up stats (threats, mitigation strategies, opportunities, aspects) |
| `SkeletonIntroSection.tsx` | Skeleton for IntroSection during load |
| `SkeletonTable.tsx` | `SkeletonTable` (initial) + `SkeletonRow` (infinite scroll, `noAnimation` prop) |
| `ExpandedRow.tsx` | Verbatim quotes, metadata, aspect chips (all visible) |
| `AspectChips.tsx` | Pillar-colored badge chips with `+N` overflow; `maxVisible` prop |
| `AspectDialog.tsx` | Pillar-accented dialog with aspect definition + description |
| `TypeBadge.tsx` | Threat/Opportunity/Threat+Mitigation badge, `min-w-[5.5rem]` uniform width |
| `MultiSelect.tsx` | Dropdown via `createPortal` (escapes Card `overflow-hidden`) |
| `AdminPanel.tsx` | React island for admin — upload, preview, publish, restore |

## Table layout

```
Type: 160px | Description: auto | Mitigation Strategy: auto | Aspects: 280px | Source: 140px
```

- `table-fixed`, `min-w-[900px]` — scrolls horizontally below 900px
- Column widths in `COL_WIDTHS` constant at top of `DataTable.tsx`
- Cell wrappers: `flex min-h-14 items-center` — 56px floor, no `overflow-hidden`
- `maxVisible=3` in table rows, `maxVisible=99` in expanded view

## Infinite scroll

- `INITIAL_BATCH=40`, `BATCH_SIZE=20`, `RESISTANCE_MS=600`
- `IntersectionObserver` with `rootMargin: "0px"` — fires only when sentinel visible
- `document.body.style.overflowY = "hidden"` during load — prevents trackpad inertia

## Sticky filterbar

`IntersectionObserver` on a sentinel `<div>` between IntroSection and table. Sets `isSticky` only when sentinel scrolls above viewport (`boundingClientRect.top < 0`) — guards against false positive on initial load.

Padding animation uses `style.paddingInline` (matches Tailwind v4's `padding-inline`). Forces layout flush with `void el.offsetHeight` before value change. Entering: 120ms snap, returning: 250ms settle.

## URL state

All filters (`search`, `type`, `aspects`, `source`, `mapped`) synced to `?` params via `pushState`/`popstate`. Deep-linkable.

## Key conventions

- Single React island — all interactivity inside `<ThreatMap client:load />`
- Brand colors carry semantic meaning — don't use brick/grassroot decoratively
- No `overflow-hidden` on table cell wrappers (causes chip clipping; `line-clamp` owns its overflow)
- `createPortal` for MultiSelect (Card has `overflow-hidden`)
- `sourceShort` in table, full `source` in expanded row
- Commits: granular, imperative, no co-author attribution

## Features built

- Filterable table: type, democracy aspects, source, mapped (has mitigation)
- Global text search across description + mitigation + verbatim
- Active filter pills (individually removable)
- Default sort: threats first, then by description
- Row expand/collapse with animation
- Visual grouping: same-description rows grouped with type-aware colored border
- ExpandedRow: verbatim quotes, metadata, all aspect chips
- AspectDialog: pillar-colored header, definition + description
- AspectChips: tooltip with code, pillar, full description
- Type badges: "Threat", "Threat + Mitigation pairing", "Independent opportunity"
- Aspect ordering: primary codes first by pillar, then secondary
- Infinite scroll with skeleton resistance
- CSV export with full aspect names
- Alternating row stripe, staggered entrance animation
- Sticky filterbar with padding/corner animation
- Sticky table header with info popovers and codebook link
- IntroSection with count-up stats


## Features pending

- Coverage heatmap (aspects × source matrix)
- Dashboard summary panel (counts, percentages, top aspects)
- Row permalinks (`?id=X`)
- Search highlight (matched terms in description/mitigation strategy)
- Aspect examples in `aspects.json`

## Data files

- `data/raw/mapping.csv` — source CSV, committed
- `public/data/aspects.json` — aspect codebook, git-tracked
- `public/data/data.json` — committed as build-time seed; KV takes over at runtime
- `data/kv-store/` — local filesystem KV (gitignored)
