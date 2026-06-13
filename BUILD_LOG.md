# AIxD Threat Map — Build Log

> Local reference document tracking all setup steps, fixes, and project state.

---

## 2026-06-10 — Initial Setup & Verification

### Project Overview

**AIxD Threat Map** — Filterable, searchable database of ~190 AI threats and
opportunities to democracy, mapped to the IDEA Democracy Assessment Framework
(P4Democracy aspect codes). Built for P4D researchers.

- **Stack:** Astro 6 (static) + React 19 + TanStack Table v8 + shadcn/ui + Tailwind CSS v4
- **Package mgr:** Bun
- **Hosting:** GitHub Pages (Cloudflare/SSR removed)
- **Data pipeline:** CSV → Python preprocessing → `data.json`

### Step 1: Environment Check

```sh
node --version  # v20.16.0 — TOO OLD (needs >= 22.12.0)
bun --version   # 1.3.14 ✓
python3 --version  # 3.14.4 ✓
```

**Issue:** Node.js v20 is installed but Astro 6 requires v22+.

**Fix:** Activated existing nvm installation with Node.js v22.22.3:
```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22  # → v22.22.3
```

nvm was available but shell wasn't sourcing it by default. Homebrew
installation of node@22 also available at `/usr/local/bin/node` (v22.14.0).

### Step 2: Dependency Verification

```sh
cd "aixd-threatmap-master 2"
bun install --frozen-lockfile  # 625 installs, 711 packages, no changes ✓
```

Dependencies were already installed (`node_modules/`, `bun.lock` existed).

### Step 3: Production Build Test

```sh
bun run build  # astro build → 1 page built in 28s ✓
```

Build succeeds with `output: "static"` (no Cloudflare adapter).

### Step 4: Dev Server Test

```sh
bun run dev  # Astro v6.1.1 ready at http://localhost:4321/
# curl → HTTP 200 ✓
```

### Step 5: TypeScript Unit Tests

```sh
bun test  # 39 pass, 0 fail, 47 expect() calls ✓
```

### Step 6: Python Environment Setup

**Issue:** The path `Billion$Connections` contains a literal `$` which gets
interpreted as a shell variable by the venv-generated scripts.

**Fix:** Created venv at `/tmp/aixd-venv` then copied to `preprocessing/.venv`.
Fixed all shell scripts (pip, pytest, activate, etc.) to escape `$Connections`
as `\$Connections` so the shell doesn't expand it.

```sh
python3 -m venv /tmp/aixd-venv
cp -r /tmp/aixd-venv/. preprocessing/.venv/
# Then fixed $ escaping in all scripts in .venv/bin/
```

### Step 7: Python Unit Tests

```sh
source preprocessing/.venv/bin/activate
pytest preprocessing/tests/  # 32 passed in 0.90s ✓
```

### Step 8: Data Preprocessing

```sh
source preprocessing/.venv/bin/activate
bun run preprocess  # python preprocessing/preprocess.py
```

Regenerates `public/data/data.json` from `data/raw/mapping.csv`.

---

## Current Project State

| Checklist | Status |
|---|---|
| Node.js v22+ | ✅ v22.22.3 via nvm |
| Bun deps installed | ✅ 711 packages |
| Production build | ✅ 1 page in 28s |
| Dev server | ✅ HTTP 200 at :4321 |
| TS tests (bun:test) | ✅ 39/39 pass |
| Python venv | ✅ `.venv/` with escaped `$` paths |
| Python tests (pytest) | ✅ 32/32 pass |
| Data preprocessing | ✅ `bun run preprocess` works |

### Known Discrepancies

Documentation (CLAUDE.md, README.md) references infrastructure that doesn't
exist in source code (these are planned features):

- `src/lib/storage.ts` — CloudflareKVAdapter / FilesystemAdapter — **not implemented**
- `AdminPanel.tsx` — React island for admin — **not implemented**
- API routes (`/api/admin/*`, `/data/data.json` endpoint) — **not implemented**
- Cloudflare/KV storage — **removed from source** (static output only)

### Pre-Publish Todo (from project_context.md)

Remaining work before publishing (labeled by priority):

**Color Palette (applied 2026-06-13):**

- ~~Brick corrected~~ ✅ `#963737` → `#963735` (client RGB 150/55/53); rgba values in `pillars.ts` also fixed
- ~~Blue corrected~~ ✅ `--accent: #92C2FF` → `#99C2FF`
- ~~Orange and Rose added~~ ✅ `#FF7F32`, `#FFB9DC` — client palette confirms valid supplementary accents
- ~~Brand Colors section in README~~ ✅

**Data & Content:**

- Update data to V10.0 — replace `mapping.csv` — CSV still says "V.8 ID" ❌
- ~~Rename "solution" → "mitigation strategy" everywhere~~ ✅ (UI labels done; `ExpandedRow.tsx:93` still says "Solution (verbatim)" ⚠️)
- ~~Update Introduction text~~ ✅
- ~~Add codebook link~~ ✅
- Move decentralisation pillar 3 → pillar 2 — 3.3 still in pillar 3 in `aspects.json` ❌

**Filter Buttons:**

- ~~Extend search bar~~ ✅ (`w-72`)
- ~~Rename filters (Type→Impact type, etc.)~~ ✅
- ~~Fix threat+solution filter~~ ✅ (now "Threat + Mitigation pairing")

**Table Headers:**

- ~~Freeze header row (sticky)~~ ✅ (column titles in sticky FilterBar)
- ~~Info icons with pop-ups~~ ✅ (`ColumnHeader` with `Popover`)
- ~~Codebook link on aspects header~~ ✅ (`ExternalLink` → `codebook.html`)
- ~~Rename Solution→Mitigation strategy~~ ✅ (`COLUMN_INFO` title updated)

**Table Entries:**

- ~~Update type labels~~ ✅ ("Threat + Mitigation", "Independent opportunity")
- ~~Threat paraphrase in every row~~ ✅
- ~~Improved aspects pop-up~~ ✅ (tooltip: code + pillar + description; click → AspectDialog)
- ~~Primary aspects first~~ ✅ (preprocess.py sorts rank=0 before rank=1)
- ~~Inline extension styling~~ ✅ (animated height + elevation shadow)

**Infrastructure:**

- ~~Push to GitHub org repo~~ ✅
- ~~Enable GitHub Pages in repo settings~~ ✅
- ~~Embed in P4D website~~ ✅ (live at Wagtail staging)
- ~~Auto-detect iframe embed context~~ ✅ (`window.self !== window.top`)
- ~~Remove padding layout shift on sticky~~ ✅ (paddingInline animation removed)
- ~~Back-to-top button~~ ✅ (floating `↑`, appears when sticky)
- ~~Embedded sticky filterbar~~ ✅ (scroll-listener for embedded mode)
- ~~Responsive column headers~~ ✅ (FilterBar labels hidden <900px; `<thead>` in DataTable for narrow screens)
- Fix Wagtail iframe height — currently `height="3000"` causes nested scroll ❌ (Wagtail team action — see project_context.md)

---

## Recurring Procedures

### Start dev session
```sh
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 22
cd "aixd-threatmap-master 2"
bun run dev
```

### Run all tests
```sh
cd "aixd-threatmap-master 2"
bun test                    # TS tests
source preprocessing/.venv/bin/activate && pytest preprocessing/tests/  # Python tests
```

### Update data from CSV
```sh
cd "aixd-threatmap-master 2"
source preprocessing/.venv/bin/activate
bun run preprocess
```

### Production build
```sh
cd "aixd-threatmap-master 2"
bun run build && bun run preview  # build + serve dist/
```
