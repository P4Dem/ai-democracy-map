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
- `bun run data` — regenerate all three JSON artifacts from `docs/20260828_Updated data + new labels + new descriptions.xlsx` (runs `taxonomy` then `preprocess`)
- `bun run preprocess` — `data.json` from the `DATASET V 10.3` sheet (harm/benefit codes now inline)
- `bun run taxonomy` — `harm_taxonomy.json` / `benefit_taxonomy.json` from the `CODEBOOKS V0.53-ED` sheet
- `bun run codes` — no-op (kept for back-compat; codes ship in the dataset sheet)
- `bun run stylecheck` — Visualization Style Gate ("De-Claude" guardrail lint); MUST pass + sign-off matrix filled before any viz/carousel step is marked done
- `bun test` — TypeScript unit tests (preprocessing module)
- `pytest preprocessing/tests/` — Python preprocessing tests (run via `preprocessing/.venv/bin/python -m pytest`)

## Visualization Style Gate (MANDATORY for all viz work)

The client requires the site **not to look AI-generated**. `PLAN.html` →
"Visualization Style Guide" is a hard style contract for every panel
(AspectBubbleMap, HarmMechanismMap, BipartiteMorphMap, PathwayBandsMap, carousel).

Enforcement, in order, at the END of every viz/carousel step:
1. `bun run stylecheck` → fix every finding (exit non-zero = not done).
2. Tick the per-panel manual guardrails in `docs/viz-style-guardrails.md`
   (tooltip content order, hover feel, readable labels, palette inspection).
3. Screenshot-verify the panel renders (dev server) before marking done.

A pre-commit hook (`scripts/git-hooks/pre-commit`, wired via `core.hooksPath`)
runs `bun run stylecheck` on every commit and aborts it on a red gate.

Guardrail summary for authored code: ecru panel bg `#F4F4EA`, warm ink
`#1a1a17` ±opacity (never pure `#000`), translucent brand-tint node fills +
full-strength strokes, no default D3 palettes / gradients / drop-shadows /
glows / 3D, no scale-on-hover, no SVG text < 10px, ONE shared ecru tooltip
(title → description → count), panel titles start "Which …", the mandated
footnote under every title, Beatrice type throughout, no auto-rotating
carousel (arrows + dots only), single 300ms fade-in, ≥100% D3-only (no
Recharts/Nivo/visx).

## Architecture

Single React island pattern: `src/pages/index.astro` imports `globals.css` and renders `<ThreatMap client:load />`. All table interactivity lives in React; Astro owns the shell.

All pages prerender at build time — no SSR. The site is fully static and deploys to GitHub Pages via GitHub Actions.

## Data flow

The `/docs` folder is the authoritative reference set for all content. Every
data input comes from there:

Everything now comes from **one workbook**:
`docs/20260828_Updated data + new labels + new descriptions.xlsx` (gitignored;
JSON outputs are the committed build seed).

| Content | Source | Produces |
|---|---|---|
| Records — text, source, aspects, **harm + pro-dem codes** | sheet `DATASET V 10.3` (204 rows, self-contained) | `bun run preprocess` → `data.json` |
| Harm / pro-dem mechanism taxonomy | sheet `CODEBOOKS V0.53-ED` | `bun run taxonomy` → `harm_taxonomy.json`, `benefit_taxonomy.json` |
| Democracy aspect codebook | `4_Codebook Democracy Aspects for AI 20260821.docx` (v0.5) | validated against `aspects.json` (unchanged) |

```
docs/20260828_…xlsx  ┬─ sheet "CODEBOOKS V0.53-ED"
                     │    → bun run taxonomy → harm_taxonomy.json + benefit_taxonomy.json
                     └─ sheet "DATASET V 10.3"
                          → bun run preprocess → data.json  (harmCodes + benefitCodes inline)

bun run data  = taxonomy && preprocess   (run taxonomy first so the aspect/code
                                          validation in preprocess has fresh JSON)
```

`bun run codes` / `preprocessing/extract_codes.py` is a **no-op** kept only so the
old command still resolves — codes now ship in the dataset sheet, no merge step.
Benefit ids are zero-padded in the sheet (`B03A`) and unpadded on write (`B3A`).
`data/raw/latest.csv`, `mapping.csv` and the mock JSX `const ENTRIES` are no
longer pipeline inputs (the legacy `read_csv` reader is kept for old fixtures).

Output files are committed as build-time data sources (static, no KV barrier).
Every harm/benefit code used in `data.json` MUST resolve in the taxonomies —
guarded by `test_build_artifacts_are_reference_complete` (pytest).

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
| `ThreatMap.tsx` | Root island — loads data, owns filter state, URL sync, sticky filterbar, "Explore findings…" carousel title, MapCarousel (no footer slot used), connecting paragraph, table context copy, floating feedback widget host |
| `DataTable.tsx` | 7-column TanStack table (type/aspects/description/harm/solution/benefit/source), group tints, infinite scroll, row grouping, skeleton; exports `COL_WIDTHS` |
| `FilterBar.tsx` | Search, type/aspects/source/harm/benefit filter buttons, 7-col label rail with group tints, filter pills, CSV export, sticky state |
| `MapCarousel.tsx` | Scroll-snap carousel of the 4 VizPanelCard panels, arrows + active-width dots, no auto-rotate; optional `footer` slot |
| `FloatingFeedback.tsx` | Vertically-centered right-edge bubble (brick, MessageCircleMore); fades in on scroll, hides after 3s idle, hover tooltip "Do you have feedback? Please let us know!"; opens feedback popover; submit = GitHub PAT → `data/questions.csv` commit, else local queue + optional mailto (`QUESTION_EMAIL`) |
| `CodeChips.tsx` | Mock-style code chips: translucent brand-tint fill, `§code — name` tooltip, max + `+N` overflow |
| `IntroSection.tsx` | Title, heading, stat tiles (flat beige tones), two intro purpose/methodology paragraphs |
| `SkeletonIntroSection.tsx` | Skeleton for IntroSection during load |
| `SkeletonTable.tsx` | `SkeletonTable` (initial) + `SkeletonRow` (infinite scroll, `noAnimation` prop) |
| `ExpandedRow.tsx` | Verbatim quotes, metadata, all aspect chips + Harm mechanisms / Benefit mechanisms code lists |
| `AspectChips.tsx` | Pillar-colored badge chips with `+N` overflow; `maxVisible` prop |
| `AspectDialog.tsx` | Pillar-accented dialog with aspect definition + description |
| `TypeBadge.tsx` | Mock dot + label badge ("Threat + mitigation", "Threat", "Opportunity"), `min-w-[5.5rem]` |
| `MultiSelect.tsx` | Dropdown via `createPortal` (escapes Card `overflow-hidden`) |
| `AdminPanel.tsx` | React island for admin — upload, preview, publish, restore |

## Table layout

```
Type: 160px | Aspects: 180px | Description: 220px | Harm: 210px | Solution: 220px | Benefit: 210px | Source: 120px
```

- `table-fixed`, `min-w-[1320px]` — scrolls horizontally below 1320px
- Column widths in `COL_WIDTHS` constant at top of `DataTable.tsx`, shared with FilterBar's label rail
- Group tints on cells + rail: aspects `#F3F3F0`, threat description + harm `#F7F1E0`, solution + benefit `#EAEAE3`
- Cell wrappers: `flex min-h-14 items-center` — 56px floor, no `overflow-hidden`
- `maxVisible=3` on table-row chips (harm/benefit/type), `maxVisible=99` in expanded view

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

- Filterable table: type, democracy aspects, source, harm mechanism (`h`), benefit mechanism (`b`)
- Global text search across description + mitigation + verbatim
- Active filter pills (individually removable)
- Default sort: threats first, then by description
- Row expand/collapse with animation
- Expanded parent row styled as section header: `bg-p4d-ecru` + type-aware left border (brick/grassroot) when open — hover locked to ecru so row reads as a stable header
- Visual grouping: same-description rows grouped with type-aware colored border
- ExpandedRow: verbatim quotes (description + mitigation strategy), metadata, all aspect chips, Harm mechanisms + Benefit mechanisms code lists
- AspectDialog: pillar-colored header, definition + description
- AspectChips: tooltip with code, pillar, full description
- CodeChips: harm/benefit code chips — tier-colored (harm) / cluster-colored (benefit), `§code — name` tooltip, max 3 + `+N`
- Type badges: "Threat", "Threat + mitigation", "Opportunity" (dot + label)
- Aspect ordering: primary codes first by pillar, then secondary
- Infinite scroll with skeleton resistance
- CSV export with full aspect names
- Alternating row stripe, staggered entrance animation
- Sticky filterbar with shadow/corner transition (7-col label rail + group tints)
- Intro: count-up stat tiles in flat beige tones (no pillar grid)
- MapCarousel: 4 panels, scroll-snap, arrows + dots, no auto-rotate; FloatingFeedback bubble bottom-right (back-to-top stacks above it)
- Sticky table header with info popovers and codebook link
- Tooltip contrast: code badge uses `bg-background/20 text-background` on dark tooltip bg
- GitHub issue templates: bug report, feature request, data correction (`.github/ISSUE_TEMPLATE/`)

## Features pending

- Coverage heatmap (aspects × source matrix)
- Dashboard summary panel (counts, percentages, top aspects)
- Row permalinks (`?id=X`)
- Search highlight (matched terms in description/mitigation strategy)
- Aspect examples in `aspects.json`
- Open source / reuse: LICENSE, CONTRIBUTING.md, CLONING.md (awaiting P4D license decision)
- Extend README with template/reuse section
- Update `docs/researcher-guide.md` (currently references removed admin panel)

## Data files

- `data/raw/latest.csv` — source CSV, committed (was `mapping.csv`; switched in Step 1)
- `public/data/aspects.json` — aspect codebook, git-tracked
- `public/data/data.json` — committed as build-time seed (static, no KV)
- `public/data/harm_taxonomy.json` / `public/data/benefit_taxonomy.json` — codebook taxonomies extracted from the client xlsx (Step 3)
- `docs/` — client reference materials (to-do notes, codebook docx, taxonomy xlsx, branding, mock JSX). Binary client files are gitignored; `.txt` extractions of the notes/codebook docx and `code_descriptions.md` are tracked.
