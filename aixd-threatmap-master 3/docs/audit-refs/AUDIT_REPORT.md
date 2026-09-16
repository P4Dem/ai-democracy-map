# AIxD Threat Map — RQ1–RQ4 Visualization Audit

**Scope:** data-integrity + UX/UI audit of the four D3 visualizations (RQ1 AspectBubbleMap, RQ2 HarmMechanismMap, RQ3 PathwayBandsMap, RQ4 BipartiteMorphMap) against the codebook, the SHORT_LABELS mechanism taxonomy, and the client to-do notes.
**Type:** audit only — no code was changed while producing this report.
**Deadline context:** client review 28.09.26.
**Audited:** `aixd-threatmap-master 3` (the active branch this session has been working in).

**A note on file paths.** The brief points at `docs/audit-refs/` for the reference documents. That folder doesn't exist in this checkout — the actual files live directly in `docs/`:

| Reference | File used |
|---|---|
| Codebook, v0.5, 21.08.2026 | `docs/4_Codebook Democracy Aspects for AI 20260821.docx` (`.txt` extraction read) |
| To-do notes (governing version) | `docs/1_Notes on to do list_UPDATED20260821.docx` — confirmed this is the newer file: it has the RQ3/RQ4 sections and several items (e.g. the explicit "de-Claude", the "keep instructions at the bottom" line, the "delete primary/secondary" line) that `docs/3_Notes on to do list.docx` lacks. Treated `3_Notes...` as superseded throughout, per instruction. |
| SHORT_LABELS sheet | `docs/3_UPDATED_SHORT LABELS&DESCR_harms and pro-dem mechanisms.xlsx` — confirmed this is the file `preprocessing/generate_taxonomy.py` actually reads (`INPUT_XLSX` constant) and the one `CLAUDE.md` documents as canonical. **Column J is fully populated** in this file — verified across all 86 code rows, zero empty (see finding below; this corrects a premise from an earlier pass of this audit that assumed J was empty). |
| Mock JSX (design reference) | `docs/4_Code AI & democracy_map Mock Claude (see new updates).jsx` — audited for leakage per the brief; see dedicated section below. A second, separate mock file (`docs/2_Claude Code of Mock Website_UPDATED.jsx`) also exists and **is** intentionally consumed by the pipeline for a different purpose — the two are not interchangeable and this report treats them separately throughout. |

All counts in this report were computed by directly parsing `public/data/data.json`, `public/data/aspects.json`, the two taxonomy XLSX/JSON files, and both mock `.jsx` files' embedded `ASPECTS`/`ENTRIES` blobs — not estimated, not read off screenshots. Every number in the brief's Open Questions (a)–(d) was independently re-derived rather than taken on faith; one of them (d) did not hold up under verification — see below.

---

## Mock Data Integrity & Leakage Check (critical, per brief)

The brief's premise about the `4_` mock's embedded data was verified **exactly**, number for number:

| Claim | Verified |
|---|---|
| Mock's `ASPECTS` has 15 codes, not 16 | ✅ Exact — parsed the object directly: 15 keys. |
| `2.7` (Civilian Control of Military and Police) missing entirely | ✅ Confirmed — no `"2.7"` key maps to that name anywhere in the object. |
| `2.8` (Illegitimate Influence) misnumbered as `"2.7"` | ✅ Confirmed — `ASPECTS["2.7"].name === "Illegitimate Influence over Policy-Making"`. |
| Mock's `ENTRIES` still use correct codebook numbering | ✅ Confirmed — 33 entries reference `"2.8"` (which doesn't exist as a key in the mock's own `ASPECTS`, so a naive lookup against the mock's own taxonomy would fail for all 33), and 7 entries reference `"2.7"` (which *does* resolve in the mock's `ASPECTS`, but to the wrong topic). |
| 17 duplicate-verbatim groups, 26 excess entries (~13% of 206) | ✅ Exact — recomputed by grouping `descriptionVerbatim` (stripped/lowercased) across all 206 mock entries: 17 groups, 26 excess. |
| **Same 15-code / 2.7-missing / 2.8-misnumbered bug also exists in the *other* mock file**, `docs/2_Claude Code of Mock Website_UPDATED.jsx` | ✅ Confirmed — extracted and diffed both files' `ASPECTS` objects; they are identical in structure and share this exact defect. This matters because, unlike the `4_` mock, the `2_` mock **is** intentionally read by the live pipeline (next finding). |

### Has any of this leaked into the live site?

**No — verified clean, with one nuance worth stating precisely.**

- `grep`-ing all of `src/`, `preprocessing/`, and `public/` for any reference to the `4_` mock's filename returns **zero matches**. It is genuinely design-reference-only, exactly as instructed.
- The `2_` mock **is** used — by design, documented in `CLAUDE.md` and in `preprocessing/extract_codes.py`'s own docstring — but only for `harmCodes`/`benefitCodes`, never `aspects`. Read `extract_codes.py`'s `merge_codes()` function directly: it copies `mock.get("harmCodes")` and `mock.get("benefitCodes")` onto `data.json` items by id; there is no line that touches `item["aspects"]`. `data.json`'s aspect codes come exclusively from `data/raw/latest.csv` via `preprocess.py`, which validates against the codebook-derived `aspects.json` — independently confirmed to have the correct 16 codes with `2.7`/`2.8` correctly assigned (see RQ1 table below).
- **Conclusion:** the mock's broken 15-code aspect taxonomy has not contaminated `aspects.json`, `data.json`'s `aspects` field, or any of the 4 visualizations' aspect-code rendering. The only place a mock's aspect labels *are* baked into live code is `src/lib/pathways.ts` (`HM2_DA_NAME`, used by RQ3) — and there, checked directly, `2.7`/`2.8` are both present and **correctly** labeled (matching the codebook, not the mock's bug), despite the file's own header comment claiming the data was "ported verbatim" from the `2_` mock. Whoever built that file corrected the 2.7/2.8 bug by hand during the port. The one aspect-taxonomy defect that *did* survive into `lib/pathways.ts` is unrelated to this bug: code `2.6` is missing from `HM2_DA_NAME` entirely (see RQ3 findings).

---

## Executive Summary — Top 10 Issues by Severity

| # | Issue | Viz | Severity | Evidence |
|---|---|---|---|---|
| 1 | **RQ3 and RQ4 render entirely from a hardcoded data blob, not the live dataset.** `PathwayBandsMap` and `BipartiteMorphMap` take no `items` prop at all — every number, connection, and co-occurrence is a static object (`HM2_HB`, `HM2_PATHS`) copy-pasted from the client's `2_` mock, frozen at whatever the dataset looked like when that mock was authored. | RQ3, RQ4 | **Critical** | Component signatures take only `onFilterTable`; `lib/bipartite.ts`/`lib/pathways.ts` headers say "ported verbatim... All thresholds/numbers kept exactly as authored by the client." Recomputed from live deduplicated data: RQ4's per-tier/benefit totals are off by as much as **-15** (B4: hardcoded 3 vs live 18), and the "joined" co-occurrence count is off by **25** (115 vs 90). See RQ4 data table. |
| 2 | **RQ2's connection threshold is 3, not the required 2.** | RQ2 | High | `MIN_VISIBLE_WEIGHT = 3` in `HarmMechanismMap.tsx`. At threshold 2 the initial view would show **106** connections instead of the current **52** — more than double. |
| 3 | **RQ2 node ordering within each tier is sorted by mention count, not codebook order**, contradicting the explicit "keep the ordering of the codes according to the codebook" requirement. | RQ2 | High | `useTieredForceLayout`: `list.sort((a, b) => (b.value || 0) - (a.value || 0))`. The taxonomy already carries the correct `order` field (verified sequential: `T0a.1`→0, `T0a.3`→1, `T0a.4`→2…, matching workbook row order) but it's never read. |
| 4 | **RQ2 has no interactive connections at all** — the ctrl-click multi-select-and-isolate-paths requirement is not just incomplete, the `<line>` elements have zero `onClick`/keyboard handlers. | RQ2 | High | `visibleLinks.map((l,i) => <line ... />)` — no event handlers, no `role`, no `tabIndex`. `ctrlKey`/`metaKey` appear nowhere in `src/components`. |
| 5 | **RQ1 aspect bubbles are not grouped into pillar clusters with pillar names beside them** — the client's central ask for RQ1's layout. All 16 aspects go through one global `d3.pack()`, colored by pillar but not spatially separated; pillar names only appear in the bottom legend. | RQ1 | High | `AspectBubbleMap.tsx:95-116`, single `hierarchy({children: data})` call across all aspects. |
| 6 | **`aspects.json` lists code `2.6` out of codebook order** (after `3.2` instead of between `2.5` and `2.7`), and this ordering is visible in the live RQ1 legend. | RQ1, table filters | Medium | `Object.values(aspects)` in `AspectBubbleMap.tsx:126` preserves this insertion order for the legend's per-pillar code list — renders "2.1, 2.2, 2.3, 2.4, 2.5, 2.7, 2.8, 2.6". (`FilterBar.tsx` re-sorts numerically and is unaffected.) |
| 7 | **RQ3's democracy-aspect chip labels are missing code `2.6` entirely** — `HM2_DA_NAME` in `lib/pathways.ts` has 15 of the 16 codebook aspect codes (the *only* aspect-labeling defect that survived into this file — its `2.7`/`2.8` are correct, see Mock Leakage section above). | RQ3 | Medium | `grep '"2\.'` on `lib/pathways.ts`: `2.1,2.2,2.3,2.4,2.5,2.7,2.8` present, `2.6` absent. |
| 8 | **Tooltip occlusion / positioning is inconsistent and unfixed across panels** — the priority UX issue named in the brief. RQ1 anchors to the node with only right/top-edge clamping (no bottom-edge or flip logic); RQ2 pins to a fixed top-left corner disconnected from the node; RQ3/RQ4 have no tooltip at all (click-to-reveal instead). No shared collision-detection utility exists. | All 4 | High (UX) | See Part 2 detail and the Tooltip Fix Specification below. |
| 9 | **RQ4's "grey box" never shows code descriptions** — confirmed zero description text anywhere in `BipartiteMorphMap.tsx`; the bottom legend shows only code + accessible label + sub-code list. | RQ4 | Medium | `BipartiteMorphMap.tsx:322-331`. |
| 10 | **Chip text/background color contrast fails WCAG AA for several brand-tint colors** used throughout (harm/benefit code chips, RQ3/RQ4 boxes) — computed, not assumed. | RQ2, RQ3, RQ4, table | Medium | Spot-checked 6 colors at their actual rendered opacity: T5 orange 3.84:1, T2 light-blue 3.71:1, B1 lime 2.25:1, B2 pink 2.62:1, B4 green 4.04:1 — all **fail** the 4.5:1 AA threshold for normal-size text; only T0 brick (7.98:1) passes. |

**Items already correctly implemented** (verified, not assumed) are called out inline in the per-viz tables below — there are more of these than the top-10 list suggests, and the report is written so it can double as a 28.09 checklist.

---

## RQ1 — AspectBubbleMap ("Which democracy aspects…")

### Data findings

| Issue | Evidence | Impact | Fix effort |
|---|---|---|---|
| Duplicates **are** correctly discounted | `freq` computation: `if (item.isDuplicate) continue`. Independently re-verified the `isDuplicate` flag itself against `descriptionVerbatim` grouping across all 206 live items (not the mock's) — 26 duplicates, flag matches recomputation exactly (0 discrepancies). | ✅ Resolved | — |
| Top-10 aspect codes, before vs. after dedup (recomputed independently) | `3.2: 112→93`, `2.3: 101→85`, `2.1: 45→33`, `1.3: 39→38`, `2.8: 37→32`, `1.1: 35→28`, `3.1: 30→28`, `1.2: 28→24`, `1.4: 26→23`, `4.1: 23→23`. App renders the "after" column (verified by code trace: identical filter logic to the recomputation). | Informational — confirms correctness | — |
| Taxonomy names/pillars conform to the codebook for 16 of 16 codes, `2.7`/`2.8` correctly assigned | Diffed `aspects.json` (16 codes) against the codebook `.txt` line by line: `2.7 = "Civilian Control of the Military and Police"`, `2.8 = "Illegitimate Influence over Policy-Making"` — correct per the brief's explicit callout. One minor naming variance: `2.7`'s live label includes "the" (matching the codebook's *Detailed*-section heading) where the codebook's own *Overview* table omits it — a codebook-internal inconsistency, not an app bug. | Low | S (if client wants exact Overview-table wording) |
| `2.6` present in `aspects.json` but rendered out of codebook order | See Executive Summary #6. | Medium | S — resort `Object.values(aspects)` by numeric code before deriving `legendGroups` |
| RQ1 tooltip description sourced from the codebook (`aspects.json`), not the SHORT_LABELS sheet | The to-do notes literally say "check the new excel… under column J" for the RQ1 bubble description — but the SHORT_LABELS sheet has no democracy-aspect rows at all (it only covers harm/benefit mechanisms). This reads as a copy-paste artifact reusing RQ2/RQ4's instruction text. Current behavior (codebook-sourced description) is the only thing that's actually possible and is correct. | ✅ Resolved (see Open Questions) | — |
| No pillar-total-mentions computation exists anywhere for the pillar-hover requirement | Recomputed independently for reference: Pillar 1 = 113, Pillar 2 = 181, Pillar 3 = 121, Pillar 4 = 29 (deduplicated mentions). | High (feature missing, not incorrect) | M |
| "(primary)"/"(secondary)" suffix does not leak into any displayed text | Grepped `data.json`'s `description`/`solution`/verbatim fields for `(primary)`/`(secondary)` — 0 hits across 206 items. The suffix-stripping only affects internal aspect-code sort order in `preprocessing.ts`/`preprocess.py`, never displayed text. | ✅ Resolved | — |

### UX findings

| Issue | Evidence | Fix effort |
|---|---|---|
| RQ text doesn't match required wording | Current: *"Which democracy aspects are more frequent across threats?"* Required: *"Which aspects of democracy are most frequently mentioned as affected by AI threats?"* | S |
| Labels instead of numbers on bubbles | ✅ Done — `n.name` rendered, no raw codes on the bubble face. | — |
| Mention count removed from inside the bubble | ✅ Done — count only appears in the tooltip, never on the shape itself. | — |
| Bubbles grouped by pillar in visible clusters, pillar name beside each cluster | ❌ Not implemented — single global pack, pillar names only in the bottom legend, not spatially adjacent to any cluster. Biggest open item for RQ1. | L — requires 4 independent `d3.pack()` calls (one per pillar) arranged side-by-side or in a grid, each with its own label, similar to how RQ2 already does tier columns |
| Hover highlights and singles out the bubble | ✅ Done — `othersOpacity` dims non-hovered/non-selected nodes to 0.35–0.45. | — |
| Bubble-hover tooltip: pillar title / subcode title / n mentions / description | **Partial.** Subcode title ✓, description ✓, count ✓ — but **pillar title is never passed** (`VizTooltip`'s `eyebrow` prop, built for exactly this, is unused here). | S — pass `eyebrow={PILLAR_LABELS[hovered.pillar]}` |
| Pillar-name hover: title / short description / total mentions | ❌ Not implemented — `VizLegend.tsx` has zero hover/interactivity; pillar names are static text. Blocked on the missing-cluster-layout issue above (no on-canvas pillar label exists yet to attach a hover handler to). | M (once cluster layout exists) — L on its own otherwise |
| Ctrl+select multiple bubbles | Not implemented — explicitly marked "POTENTIAL tbd" in the notes, so this is expected, not a defect. | — (optional) |
| Keyboard access to tooltip content | ❌ **Bug, not just a gap.** Bubbles are `tabIndex={0}` with `onFocus`/`onBlur`, and focusing does draw a highlight ring (`isFocus`) — but the tooltip itself is only keyed off `hoveredCode`, which focus never sets. A keyboard user sees the ring but never sees the pillar/description/count content a mouse user gets. | S — set `hoveredCode` (or a shared `activeCode`) on focus too |

---

## RQ2 — HarmMechanismMap ("Which mechanisms…")

### Data findings

| Issue | Evidence | Impact | Fix effort |
|---|---|---|---|
| Duplicates correctly discounted for both node frequency and edge co-occurrence | `if (item.isDuplicate) continue` before both the `freq` and `edgeMap` accumulation. | ✅ Resolved | — |
| Top-10 harm codes, before vs. after dedup | `T4.1: 42→34`, `T7b.2: 27→22`, `T7b.1: 19→17`, `T5c.1: 18→16`, `T5a.2: 17→13`, `T1b.4: 17→12`, `T5a.1: 16→12`, `T7a.2: 16→9`, `T2.2: 15→12`, `T4.4: 14→13`. | Informational | — |
| Connection threshold is 3, not 2 | `MIN_VISIBLE_WEIGHT = 3`. Recomputed: threshold 2 → **106** connections shown initially; threshold 3 (current) → **52**. | High | S — one constant |
| Ordering ignores codebook/`order` field, sorts by value instead | `list.sort((a,b) => (b.value||0)-(a.value||0))` per tier. `harm_taxonomy.json`'s `order` field is present and correctly sequential (verified: `T0a.1`→0…`T0b.3`→5, matching workbook row order) but unused. | High | S — sort by `harmTaxonomy.codes[id].order` instead |
| Every code/label shown is the accessible label, not a raw ID | `entry.label || id` used for node text; raw ID only appears alongside the label in the tooltip title and the aria-label, matching the "codes only in a secondary style line" convention used elsewhere. | ✅ Resolved | — |
| Harm taxonomy reconciliation between excel and mock is already correct — **verified, no client decision actually needed here** | Independently checked all four codes named ambiguous in the brief: excel has `T3.4`✓ and `T7c.2`✓ but lacks `T2.4` and `T0a.2`; the `2_` mock has the reverse. `generate_taxonomy.py`'s `orphan_definitions_from_mock()` already backfills `T2.4`/`T0a.2` from the `2_` mock (tagged `source: "mock"` in the output) on top of the excel's native `T3.4`/`T7c.2`. Confirmed `harm_taxonomy.json` contains **all four** with no conflict, and confirmed both orphan codes are load-bearing: live `data.json` actually uses `T2.4` on 9 entries and `T0a.2` on 1 — matching the `2_` mock's own usage counts exactly. This is a working union, not a version conflict. | ✅ Resolved — see Open Questions (a) | — |
| A/B/C sub-code lighter-shade differentiation | Not implemented — `TIER_COLORS` is one flat color per tier (T0–T7), applied identically to every code in that tier regardless of sub-cluster level. Client flagged this as exploratory ("perhaps… need to assess"), not a hard requirement. | Medium (design decision, not a bug) | M |
| Co-occurring democracy aspects on hover/click | Not implemented anywhere — the tooltip only shows the mechanism's own code/label/description/count. No cross-reference from `harmCodes` to `aspects` exists in this component (would need to tally, over all non-duplicate items containing the hovered code, their `aspects` field, floored at 2–3 co-occurrences). | High (explicit ask; client said "open to suggestions" on placement) | M |
| Drag removed | ✅ Done — nodes are `fx`-pinned to their tier column; no drag handlers exist anywhere in the component. | — |

### UX findings

| Issue | Evidence | Fix effort |
|---|---|---|
| RQ text doesn't match required wording | Current: *"Which mechanisms are more frequently involved in harming democracy?"* Required: *"Which mechanisms are frequently mentioned as harming democracy and how are they connected?"* — also drops the "how are they connected" clause entirely. | S |
| Ctrl-click multi-select on connections, click-again-to-isolate | ❌ Not implemented. The `<line>` elements for `visibleLinks` are purely decorative — no `onClick`, no `tabIndex`, no `role`. Connections are currently **not interactive at all**, so there's nothing to build the ctrl-click behavior on top of yet. | L |
| No bottom instructions text | Unlike RQ3/RQ4, this panel has no "click/hover a node for…" copy anywhere — just the tier legend. The client's general note (*"keep instructions at the bottom of the map, adjusted based on the visualization"*) implies every panel should have one. | S |
| Tooltip positioning | Fixed at `left=10, top=10` (svg's own top-left corner) regardless of which node is active — never occludes the node, but is spatially disconnected from it (see Tooltip Fix Specification). | — see shared fix |
| Keyboard access | ✅ Actually fine here (unlike RQ1) — `onKeyDown` (Enter/Space) sets `pinnedId`, which drives `activeId` → the same tooltip a mouse click produces. Nodes have `tabIndex`, `role="button"`, `aria-pressed`, `aria-label`. | — |
| `role="img"` on the whole SVG, with individually-focusable children inside | Minor ARIA conflict — `role="img"` signals assistive tech to treat the whole element as one opaque image, which can suppress or confuse exposure of the focusable circles inside it in some screen readers. Same pattern in all 4 panels. | S–M, cross-cutting |

---

## RQ3 — PathwayBandsMap ("Through which pathways…")

### Data findings

| Issue | Evidence | Impact | Fix effort |
|---|---|---|---|
| **Entire dataset is a static, hardcoded blob — not computed from `data.json`** | `PathwayBandsMap` takes no `items` prop. `lib/pathways.ts` header: *"Client-authored RQ3 pathway data + labels, ported verbatim from docs/2_Claude Code of Mock Website_UPDATED.jsx… All thresholds/numbers kept exactly as authored by the client."* Every band's entry count, every segment's co-occurrence number, and the democracy-aspect mention counts shown are frozen at whatever the `2_` mock's dataset was — not the current 206-item / 26-duplicate live dataset. | **Critical** — same class of issue as RQ4 #1 | L — would need a full rebuild of this panel's data layer to compute pathway segments live from `items`, `harmCodes`, `aspects` |
| Democracy-aspect code `2.6` missing from the label map (but `2.7`/`2.8` correct — see Mock Leakage section) | `HM2_DA_NAME` in `lib/pathways.ts` has 15 of 16 codebook aspect codes. If code `2.6` is ever a pathway's top aspect it renders as the raw code, not a name. | Medium | S — add the missing entry |
| Duplicate-discounting is not applicable/checkable | Because the data is static and hand-authored, there's no live counting logic to check for dedup — the question is moot until the panel is rebuilt on live data. | — | — |

### UX findings

| Issue | Evidence | Fix effort |
|---|---|---|
| Numbers on connector lines overlap in the initial view | Confirmed — `f.segs.map(...)` renders the count `<text>` on **every** segment unconditionally, regardless of click state. The client explicitly offered the fallback: *"if they can't help but overlap… it is okay to delete them and have them only when clicking."* Current behavior does neither — numbers are always on, always in the same crowded initial layout. | S — conditionally render the count text only when `active`/hovered, matching the fallback the client pre-approved |
| Legend at the bottom needs adjustment | Confirmed gap, specifically: the panel's bottom legend shows **only the 4 democracy-aspect pillar colors** — it never explains the T0–T7 tier colors used throughout the band nodes and connector lines, which is most of the diagram's color-coding. A viewer has no way to look up what an orange vs. teal node means from this panel alone. | S–M — add a second legend row for tier colors (the same `TIER_COLORS`/`HM2_TIER_SHORT` data RQ2 already has a legend for) |
| Bottom instructions present | ✅ Done — *"Click a mechanism, a step, or a democracy-aspect chip for detail."* | — |
| Codebook ordering not applicable | Cluster layout order (`HM2_CLUSTERS`) is fixed by tier grouping, not a sort — not a violation, just noting it's a different mechanism than RQ2's code ordering. | — |
| Keyboard access | ✅ Done this session — every segment, node, and DA chip has `tabIndex`, `role="button"`, `aria-label`, `onKeyDown` (Enter/Space), plus a shared `.viz-node:focus-visible` brick outline. | — |

---

## RQ4 — BipartiteMorphMap ("Which pro-democracy activities…")

### Data findings

| Issue | Evidence | Impact | Fix effort |
|---|---|---|---|
| **Entire dataset is a static, hardcoded blob — not computed from `data.json`** | `BipartiteMorphMap` takes no `items` prop. `lib/bipartite.ts` header: *"Client-authored bipartite benefit view data, extracted verbatim from docs/2_Claude Code of Mock Website_UPDATED.jsx."* Recomputed the same aggregates independently from the live, deduplicated `data.json`: | **Critical** | L |
| — per-tier harm totals, hardcoded vs. live | `T0: 18→19`, `T1: 56→57`, `T2: 30→36`, `T3: 20→16`, **`T4: 42→56`**, `T5: 57→66`, `T6: 9→11`, **`T7: 49→61`** | see above | — |
| — per-group benefit totals, hardcoded vs. live | `B1: 3→6`, `B2: 3→9`, `B3: 11→14`, **`B4: 3→18`**, `B5: 13→13` (only exact match), `B6: 36→28`, `B7: 20→16`, `B9: 13→16`, `B10: 31→28`, `B11: 25→23` | see above | — |
| — total co-occurrence count | Hardcoded `joined: 115` vs. live-recomputed `90` (items with ≥1 harm tier AND ≥1 benefit group, deduplicated) — a 25-entry (28%) overstatement | see above | — |
| `B8` numbering gap — confirmed genuinely present in the *source* excel, not a pipeline bug | Enumerated every `B`-prefixed code in the workbook: `B1, B2, B3(A/B), B4(A/B/C), B5, B6(A/B/C/D), B7(A/B/C/D), B9, B10(A/B), B11(A/B/C)` — `B8` does not exist anywhere in the file, at parent or sub-code level. The gap is in the client's own taxonomy, faithfully reproduced downstream. | Low (pending client confirmation, per brief) | — (no fix needed unless client says it's an error) |
| Duplicate-discounting is not applicable/checkable | Same reasoning as RQ3 — static data, no live counting logic exists to audit. | — | — |
| All codes/labels present and correctly named | Spot-checked `HM2_BEN_NAME`/`HM2_TIER_SHORT` against the SHORT_LABELS sheet's Accessible-label column for a sample of codes — matched. (This only speaks to label *text* correctness, not the *count* correctness covered above.) | ✅ Resolved (labels) | — |

### UX findings

| Issue | Evidence | Fix effort |
|---|---|---|
| Grey-box description text | ❌ Confirmed missing — the bottom legend (`legendItems`) renders only `code + accessible label + sub-code list`, never a description, and this panel has no hover tooltip at all to carry it either. | S–M — add `description` from `harm_taxonomy.json`/`benefit_taxonomy.json` (both already populated, sourced from column J per the pipeline) to the legend rows or a click-revealed detail panel |
| Bottom instructions present | ✅ Done — dynamic note text depending on drill-down state, base copy *"a link means an entry mentions both together… Click any box or link to unfold the detail behind it."* | — |
| Drag/zoom | Uses the shared `useSvgPanZoom` hook (pan + wheel-zoom + zoom buttons) — this is the one panel of the four that legitimately keeps zoom controls (dense two-column diagram with many links), a deliberate, already-reviewed decision from earlier this session. | — |
| Keyboard access | ❌ Not implemented — the interactive `<g>` boxes for tier/benefit/edge selection have `onClick` but no `tabIndex`/`role`/`onKeyDown`. Same gap pattern that existed (and was fixed) in RQ3 before this session's earlier pass — RQ4 was not brought up to the same standard. | S — same pattern already used in RQ3, straightforward to port over |

---

## Accessibility & Responsiveness (cross-viz)

- **Keyboard access to hover-only info:** RQ2 and RQ3 are fine (Enter/Space triggers the same content as hover/click). RQ1 is broken (see finding above — focus shows a ring but not the tooltip). RQ4 has no keyboard access to its interactive elements at all.
- **ARIA on interactive SVG elements:** RQ1/RQ2/RQ3 nodes are `role="button"` with `aria-label`/`aria-pressed` where relevant. RQ4's boxes have none. All four panels wrap their content in a top-level `role="img"` — a minor but real conflict with having focusable descendants (see RQ2 note).
- **Color contrast:** computed, not assumed — see Executive Summary #10. Five of six spot-checked chip-text/background pairs (the shared `withAlpha`/`mixInk` pattern used for harm/benefit/DA chips across RQ2/RQ3/RQ4 and the table) fail WCAG AA 4.5:1 at their actual rendered opacity. Only the darkest brand color (brick) passes. This is systemic — the pattern itself needs either a darker text mix ratio or a less translucent background for the lighter source colors (lime, pink, light blue, orange), not a per-instance fix.
- **Narrow viewports:** all four SVGs are fixed-`viewBox` and scroll horizontally below their `min-width` rather than reflowing (consistent, deliberate choice per the Visualization Style Guide). This means the tooltip-occlusion problem gets **worse**, not better, on narrow screens — the panels don't shrink, so a tooltip's fixed pixel offsets (e.g. RQ1's `left: n.x*sx + n.r*sx - 90`) are computed against the same coordinate space at any viewport width, but the visible viewport window into that horizontally-scrolling content is narrower, so a tooltip anchored near a node close to the current scroll edge is more likely to be clipped by the container's own `overflow-x-auto` boundary than on a wide desktop screen. None of the four panels currently account for this.

---

## Part 3 — Cross-Cutting

### Consistency of interaction patterns

Currently inconsistent in ways a user would notice moving between panels:

| Behavior | RQ1 | RQ2 | RQ3 | RQ4 |
|---|---|---|---|---|
| Hover shows info | Tooltip | Tooltip | Click-reveal only | Click-reveal only |
| Click behavior | Select (highlight) | Pin (locks tooltip) | Reveal detail in bottom box | Drill down one level |
| Zoom/pan controls | ❌ Removed (correct — too sparse to need it) | ❌ Removed (correct — earlier finding this session) | ❌ Removed (correct) | ✅ Kept (correct — genuinely dense) |
| Keyboard-operable | Partial (broken tooltip) | ✅ Full | ✅ Full | ❌ None |
| Tooltip anchor | Node-relative | Fixed corner | N/A | N/A |

The hover-vs-click split between RQ1/RQ2 and RQ3/RQ4 is a reasonable, deliberate design difference (RQ3/RQ4 are denser, multi-level diagrams where click-to-drill genuinely suits the content better than a hover tooltip) — this was flagged and accepted as a considered trade-off earlier this session, not an oversight. But the **keyboard-access gap on RQ4** and the **tooltip-anchor inconsistency between RQ1 and RQ2** don't have the same justification and are worth closing.

### Shared code opportunities

- **Tooltip positioning/collision logic** is reimplemented per-panel (`placeTooltip` in `AspectBubbleMap.tsx`, the fixed-corner constant in `HarmMechanismMap.tsx`) with no shared utility — see the Tooltip Fix Specification below for where a shared hook should live.
- **Label lookup from taxonomy** is duplicated: `AspectBubbleMap` reads `aspects[code]`, `HarmMechanismMap` reads `harmTaxonomy.codes[id]`, `BipartiteMorphMap`/`PathwayBandsMap` read from the hardcoded `HM2_*` maps in `lib/bipartite.ts`/`lib/pathways.ts` instead of `harm_taxonomy.json`/`benefit_taxonomy.json` — three different lookup shapes for conceptually the same "code → accessible label + description" operation. Once RQ3/RQ4 are rebuilt on live data (Executive Summary #1), this should collapse to one shared lookup against the two taxonomy JSON files, used by all four panels.
- **De-duplication logic** (`if (item.isDuplicate) continue`) is correctly re-implemented identically in `AspectBubbleMap.tsx` and `HarmMechanismMap.tsx` — small enough that duplication isn't costly today, but a shared `nonDuplicateItems(items)` helper would remove the risk of a future panel forgetting it (as RQ3/RQ4 effectively have, by not consuming live items at all).
- **Chip color/text treatment** (`withAlpha` + `mixInk` from `lib/codes.ts`) is already shared and used consistently across `CodeChips.tsx`, `AspectChips.tsx`, and this session's RQ3/RQ4 box styling — good pattern, just needs the contrast fix noted above applied once, centrally.

### "De-Claude" check

No default D3 categorical palettes, no generic placeholder copy, and Beatrice is used throughout — this was audited and fixed earlier this session (translucent brand-tint fills replacing near-solid ones, keyboard focus rings, tier-header label wrapping). Nothing new to flag here beyond the contrast issue above, which is a WCAG problem rather than a "looks AI-generated" problem.

---

## Tooltip Fix Specification

**Do not implement — this specifies the approach only, per the audit brief.**

### Shared approach

Extract a `useTooltipPlacement` hook (suggested home: `src/lib/useTooltipPlacement.ts`, alongside the existing `useSvgPanZoom.ts`) that all four panels' hover/active state feeds into. Inputs: the hovered/active node's bounding box (in *screen* pixels, not SVG viewBox units — the current bugs in RQ1's `placeTooltip` come from mixing the two coordinate spaces with an ad-hoc `sx`/`sy` scale factor), the panel container's bounding box, and the tooltip's own rendered size (measured via a `ref` + `getBoundingClientRect`, or a fixed estimate for the common case). Output: `{ left, top, placement }` where `placement` is one of `top-left | top-right | bottom-left | bottom-right`, chosen by whichever quadrant relative to the node has the most free space inside the container — the classic "flip" pattern (similar to what Radix/Floating-UI's `autoPlacement` does, without needing the dependency).

Concretely, the utility should:
1. Compute the node's center and radius/half-height in screen space.
2. Compute available space to the node's top/bottom/left/right within the *panel's* bounding box (not the viewport — these SVGs live inside `overflow-x-auto` containers, so viewport-relative math would place tooltips outside the scrollable region on narrow screens, worsening the existing narrow-viewport problem noted above).
3. Pick the quadrant with the most room, offset the tooltip so its corner (not center) sits just outside the node's bounding circle/box in that quadrant, and clamp so it never crosses the panel's own edges.
4. Keep `pointer-events: none` on the tooltip (already correct in `VizTooltip.tsx`) so it never sits between the cursor and the node it's describing, and re-affirm this in the hook's contract so future callers don't regress it.

`VizTooltip.tsx` itself needs no visual changes — only the `left`/`top` values it receives change source, and each caller (`AspectBubbleMap.tsx`, `HarmMechanismMap.tsx`) swaps its own bespoke placement math for a call into the shared hook.

### Per-viz notes

- **RQ1 (`AspectBubbleMap.tsx`):** Replace `placeTooltip`'s manual `sx`/`sy` scaling + single-direction clamp with the shared hook. Also fix the keyboard-access bug noted above as part of the same change (drive tooltip visibility from a single `activeCode` set by both hover and focus, not just `hoveredCode`), and pass the missing `eyebrow={PILLAR_LABELS[...]}` for the pillar-title requirement.
- **RQ2 (`HarmMechanismMap.tsx`):** Currently the *safest* of the four re: occlusion (fixed corner never covers the node) but the least connected to what's being described. Switching to node-anchored quadrant-flip placement via the shared hook would improve spatial association without reintroducing occlusion, since the hook's job is specifically to pick the side with room.
- **RQ3/RQ4:** No tooltip today (click-reveal instead) — no fix needed unless the design direction changes to add hover tooltips, in which case they'd consume the same shared hook.

---

## Open Questions for the Client

1. **Which harm-taxonomy version is current — already resolved, confirming for the record.** The excel has `T3.4`/`T7c.2` but lacks `T2.4`/`T0a.2`; the `2_` mock has the reverse. This is **not actually a live conflict**: `generate_taxonomy.py` already unions both sources (`orphan_definitions_from_mock()` backfills `T2.4`/`T0a.2` from the mock, tagged `source: "mock"`, on top of the excel's native `T3.4`/`T7c.2`), and I confirmed `harm_taxonomy.json` contains all four with correct labels, and that live `data.json` actually uses `T2.4` (9 entries) and `T0a.2` (1 entry) — both resolving correctly. **No action needed** unless the client considers `T2.4`/`T0a.2` erroneous codings that should be dropped rather than kept.
2. **B8 numbering gap — confirmed present in the source excel itself** (enumerated every B-code in the workbook; there is no B8 at any level). Requesting confirmation this is intentional in the client's taxonomy, not a missing sheet row on their end.
3. **1_...UPDATED notes doc governs over 3_Notes draft** — confirmed by content diff (the UPDATED doc is a superset: it has RQ3/RQ4 sections and several general-outlook items the older draft lacks). Treated as canonical throughout this report, per instruction.
4. **T1b.2 / T1b.7 descriptions — checked, and did not find the issue described.** The brief states T1b.2 is "marked needs update" and T1b.7 is "empty." I read every populated cell in both rows directly from `docs/3_UPDATED_SHORT LABELS&DESCR_harms and pro-dem mechanisms.xlsx`: both have complete, non-empty text in column G (long description), column H (accessible label), and column J (short description); no "needs update" marker or similar flag exists in any column for either row (column I is just `"+"` for both, the same generic marker present on nearly every other row in the sheet). Both also render correctly in the live `harm_taxonomy.json` with full labels and descriptions. **Flagging this discrepancy rather than silently accepting the premise** — if the client has a newer version of the sheet with different content for these two rows, we don't have it in `docs/`; the version in hand shows no issue with either code.
5. **Which "SHORT_LABELS" file is canonical for the older "column J empty" premise** (from an earlier pass of this audit, retained for completeness): that premise is true of `docs/2_SHORT LABELS_harms and pro-dem mechanisms .xlsx` (no column J exists there at all) but false of the `3_UPDATED...&DESCR...` file used throughout this report, where J is fully populated. Per the brief's own instruction to use the `3_UPDATED` file, this is resolved — noting it only so the discrepancy between the two files doesn't resurface as a surprise later.
6. **RQ1's tooltip-description source note appears misapplied.** The to-do list's RQ1 bullet says to source the bubble-hover description from "column J" of the SHORT_LABELS sheet — but that sheet has no democracy-aspect rows at all. Confirming this was a copy-paste from the RQ2/RQ4 instructions and that the codebook (current source) is correct for RQ1.
7. **RQ3/RQ4 data rebuild scope.** Given both panels currently run on a frozen, materially-inaccurate snapshot of the dataset (Executive Summary #1), should rebuilding them on live `data.json` be treated as its own prioritized task ahead of the smaller UX items in this report? Given the 28.09 deadline, this is the single largest remaining engineering item.
8. **RQ2 sub-code shading ("A/B/C… lighter colour"):** the notes mark this "perhaps," "up to Naijeria." Confirming this is genuinely optional/exploratory and not required for the 28.09 review.
9. **RQ2 co-occurring-aspects placement:** the notes say "we're open to suggestions" for sidebar vs. hover-box. Given RQ2 already uses a fixed-position tooltip (not node-anchored), a sidebar that appears alongside the panel on hover/pin would likely integrate more cleanly than trying to fit a second data dimension into the existing tooltip. Flagging for a client decision before implementation.
10. **Codebook's own internal naming inconsistency** (`2.7` — "Civilian Control of Military and Police" in the Overview table vs. "…of **the** Military and Police" in the Detailed section heading; similarly `4.1`/`4.2` drop "the Country's" in the Overview table). The app currently follows the Overview table for everything except `2.7`, where it follows the Detailed heading. Which is canonical?

---

*Report generated 2026-08-28. All counts independently recomputed from `public/data/data.json` (206 items, 26 duplicates verified), `public/data/aspects.json`, `public/data/harm_taxonomy.json`/`benefit_taxonomy.json`, both mock `.jsx` files' embedded data, and the SHORT_LABELS XLSX via direct parsing — not read off rendered UI or estimated. Every specific figure named in the audit brief (33 entries referencing "2.8", 17 duplicate groups / 26 excess entries, the T2.4/T0a.2/T3.4/T7c.2 split, the B8 gap) was independently re-derived rather than taken on faith; all matched exactly except the T1b.2/T1b.7 description claim, which did not hold up against the file in hand (see Open Question 4).*
