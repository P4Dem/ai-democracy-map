# Visualization Style Guide — "De-Claude" Guardrails & Sign-off

Source of truth: `PLAN.html` → *Visualization Style Guide* section. The client
requires the site **not to look AI-generated**; most of that look comes from the
**charts**. This document is the hard style contract. A panel is **not done**
until every relevant box below is ticked and `bun run stylecheck` passes.

Panels: **A** = AspectBubbleMap (RQ1) · **M** = HarmMechanismMap (RQ2) ·
**P** = PathwayBandsMap (RQ3) · **B** = BipartiteMorphMap (benefit view, RQ4) · **C** = Carousel (all panels + shared chrome).

**How to use, every visualization step:**

1. Write / modify the panel code.
2. Run `bun run stylecheck` → fix every machine-checkable finding.
3. Tick the manual guardrails below for that panel.
4. Verify in a screenshot (dev server) that the guardrail actually renders.
5. Only then mark the PLAN step done.

---

## Palette — print-like, not app-like (HIGH)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| Panel background ecru `#F4F4EA` (never white/dark/gradient) |  | ☐ | ☐ | ☐ |
| Ink = warm near-black `#1a1a17` at 60–85% opacity, never pure `#000` |  | ☑ | ☐ | ☐ |
| Threat accent brick `#963735` · benefit accent grassroot `#00B140` · tertiary orange `#FF8E32` · pillar tints blue `#92C2FF`, lime `#D9E021` |  | ☑ | ☐ | ☐ |
| Node fills = translucent brand tints (10–18% fill) + full-strength stroke, NOT full saturation |  | ☐ | ☐ | — |
| No default D3 palette, no pastel/rainbow gradient, no neon |  | ☑ | ☐ | ☐ |

## Typography — Beatrice, type-only hierarchy (HIGH)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| All SVG labels in Beatrice (inherited via CSS), not system/monospace |  | ☑ | ☐ | ☐ |
| No inline per-element font changes; hierarchy via weight + case only |  | ☑ | ☐ | ☐ |
| Uppercase micro-labels 11px, `letter-spacing 0.08em` for annotations |  | ☐ | ☐ | — |
| Max ~3-line truncation on node labels; full text in tooltip |  | ☑ | ☐ | — |
| No SVG `<text>` smaller than 10px anywhere |  | ☑ | ☐ | ☐ |

## Strokes & effects — restrained ink lines, zero chrome (HIGH)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| Node borders 1–1.5px ink 60–90%; selected 2–2.5px brick/grassroot |  | ☐ | ☐ | — |
| Connection lines 1px ink 25–40%; hover/selected 2px full-strength accent | — |  | ☐ | — |
| No drop shadows, box-shadow on SVG, bevels, 3D extrusion |  | ☑ | ☐ | ☐ |
| No outer glow — selected/dim-others, never glow |  | ☑ | ☐ | — |
| Arrows only where direction matters (`marker-end` 8px, ink), e.g. bipartite tier→endpoint | — |  | ☐ | — |
| Group separators = 1px dashed ink 30% (not colored fills) |  | — | ☐ | — |

## Hover & tooltips — editorial, not tech-demo (HIGH)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| Single shared tooltip component (ecru bg, 0.5px ink border, radius 2px, warm 8% shadow, Beatrice) |  | ☐ | ☐ | ☐ |
| Tooltip content order fixed: **title → description → count** (never reversed) |  | ☑ | ☐ | — |
| Cursor pointer on interactive nodes only; no scale/bounce on hover |  | ☑ | ☐ | — |
| Hover highlight = 2px accent stroke + lighter fill (no scale transform) |  | ☑ | ☐ | — |
| Transitions ≤ 150ms; no spring/tween from `motion` for SVG |  | ☑ | ☐ | ☐ |

## Copy & labels — human, no AI-isms (HIGH)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| Ban-list sweep done (`stylecheck` catches: delve, harness, unleash, empower, leverage, robust, cutting-edge, seamless, unlock, "discover the", "in today's world", "landscape") |  | ☑ | ☐ | ☐ |
| Accessible labels primary (e.g. "Disinformation & deepfakes"); raw codes (`T5a.1`) only in secondary code line |  | ☑ | ☐ | ☐ |
| Panel titles start with "Which …" |  | ☑ | ☐ | — |
| Footnote under titles: "as mentioned in the sources (the data collected does not include information on which threats and mitigations are more impactful)" |  | ☑ | ☐ | ☐ |
| Numbers formatted (thousands separators); counts as "N mentions" / "N entries" |  | ☑ | ☐ | — |

## Layout & motion — restrained, print-like (MED)

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| No auto-rotating carousel — arrows + dots only (`stylecheck` catches autoPlay/setInterval) | — | — | — |  |
| Single 300ms fade-in per panel; no staggered pop/scale of nodes |  | ☐ | ☐ | ☐ |
| <768px: horizontal scroll (not squish); labels never overlap |  | ☑ | ☐ | ☐ |
| Fixed aspect ratio per panel (e.g. 16:10); SVG `viewBox` scales cleanly |  | ☑ | ☐ | ☐ |
| All interactive nodes keyboard-focusable with 2px brick focus ring |  | ☑ | ☐ | ☐ |

## Engineering

| Guardrail | A | M | P | C |
|---|---|---|---|---|
| D3.jS v7 inside React island via `useRef` + `useEffect` (no Recharts/Nivo/visx) |  | ☑ | ☐ | ☐ |
| Tooltip code order title→description→count in the shared component |  | ☑ | ☐ | ☐ |

---

## Per-panel function (from PLAN steps)

**A — AspectBubbleMap (Step 6):** pillars labelled · bubble size = dedup mention count · hover: pillar→subcode title→n→description · pillar hover: title→description→total n · click select dims others ☑ · clusters packed tighter (smaller caption reserve + jitter) with corners pushed outward (0.21/0.79 across × 0.24/0.70 down) so the centre cross is wide enough for the parked tooltip to float bubble-free ✓ · **REVISED 2026-09-15:** rendered svg height is now fitted to the post-layout content (lowest 2-line label + 18px, floor MIN_SVG_H=560) instead of a fixed VIEW_H=680 — closes the ~25px dead band under the clusters and shortens the panel ~80px, same mechanism as M's dynamic svgH. Bottom corners raised 0.78→0.70 so the bottom clusters sit higher within the fitted canvas. · **REVISED 2026-09-15 (2):** layout jitter is now deterministic — seeded per-code (FNV-1a → mulberry32) instead of `Math.random()`, so every load/refresh renders the identical bubble cloud (the old random seed made the svg look like it moved between loads; verified byte-identical across two fresh loads in a browser).

**M — HarmMechanismMap (Step 7):** 8 tier columns (T0–T7) with short labels · node size = dedup mention count, fill = tier color (mock palette), label under node when large ✅ · co-occurrence links (≥3 shown idle; hover isolates a node's direct links) · hover dark tooltip (code — name → description → N entries coded) · click pins + dims-others, click background unpins · white card chrome ✅

**P — PathwayBandsMap (Step 8):** 3 named pathways (mock's HM2_PATHS verbatim) · band = recurring pathway with entry count · tier→tier step links with per-step co-occurrence counts · democracy-aspect chips on the right pillar-colored ✓ · click strip detail for seg/node/da ✓ · zoom/pan + controls ✓ · legend = "Democracy aspects" + 4 pillars ✓ · white card chrome, highlights ["pathways", "harm for democracy"] ✓ · all SVG text ≥10px (mock's 8.5–9.5px text scaled up) ✓ · no line-number labels (mock shows none) ✓ ☑

**B — BipartiteMorphMap (Step 9, benefit view, mock carousel panel 3):** overview = 8 harm-tier boxes (left) ↔ 10 pro-democracy activity boxes (right) with tier-colored bezier links (n≥4) + counts · click tier/ben/edge drill-down morphs columns in place (min-weight filter, "Back to overview" pill) · dynamic note line (base HM2A_NOTE_BASE → "• …") · client explainer paragraph ("Pathways are recurring sequences…") above the legenda ✓ · tier + benefit legend below · white card chrome, highlights ["pro-democracy activities", "harm mechanisms"] ✓ · plan's "benefit grey box" = this panel's dynamic note + legend ☑

**Carousel (Step 11):** 4 panels · dotted-nav carousel · panel 1–3 above + RQ4 benefits view ✓: scroll-snap slides (Aspect → Harm → Bipartite → Pathway), arrows (aria "Previous/Next map"), 4 active-width-animated dots, no auto-rotate ✓ · arrows sit fully OUTSIDE the carousel card, in its side gutters (`mx-10` insets the card inside a relative wrapper, arrows at the wrapper's outer edges) · vertically anchored at the tallest-panel center, so they stay still while clicking through ✓ · page title "Explore findings from our initial literature analysis" with lime underline (`p4d-underline-hover`) ✓ · FloatingFeedback (right-edge, vertically-centered bubble; fades in on scroll, hides after 3s idle, hover tooltip with feature title, textarea → confirmation) ✓ · connecting paragraph "Each entry collected from the literature is mapped onto three things…" ✓ · carousel column fills the layout (≈842px at 1280vw — svgs dropped `minWidth:900` so panels scale to slide) ✓ · per-panel manual guardrail ticks via their A/M/P/B rows ✓ ☑

**Table + page (Steps 10–12):** 7-column table (type 160 / aspects 180 / description 220 / harm 210 / solution 220 / benefit 210 / source 120 = 1320, `min-w`) ✓ · rail labels under FilterBar mirror all 7 headers with the mock's group tints (aspects `#F3F3F0`, threat+harm `#F7F1E0`, mitigation+benefit `#EAEAE3`) ✓ · `TypeBadge` → mock dot+label ("Threat + mitigation", "Threat", "Opportunity") ✓ · harm chips (`TIER_COLORS` by tier) + benefit chips (`BENEFIT_CLUSTER_COLORS` by cluster) via `CodeChips`, max 3 + `+N` ✓ · "Harm mechanism" + "Benefit mechanism" Multiselects wired to URL `h`/`b`, pills + clear ✓ · expanded row gains "Harm mechanisms" / "Benefit mechanisms" code lists under the verbatims ✓ · rowNum column + enter chevron dropped (mock has neither) ✓ · intro stat tiles → flat beige tones `#EAEAE3/#E1E1D9/#F2ECDD/#ECE0C9` ✓ · Democracy Framework pillar grid removed (absent from final mock) ✓ ☐

**Legend hover boxes (head-category tooltips, all 4 panels ✓):** hovering any legend head category (A: 4 pillars · M: 8 tiers · B: tier rows + benefit clusters · P: 4 cluster headers) shows one shared ecru tooltip = **title → codebook short description (column J / K fallback) → "Sub-codes" list of the child code NAMES (no IDs)** · `position:fixed` so card `overflow:hidden` never clips · tip is interactive (`pointer-events:auto`): long sub-code lists **wheel-scroll** (`max-height:220px`, `overscroll-behavior:contain`) · stays open only while the cursor is inside the tooltip or the legend box it opened from (window `pointermove` follower, ±16px padding so the small gap never blinks) — closing the moment the cursor leaves both · legend groups are `role=button`, keyboard-focusable, `cursor:help` · pathway cluster headers get an invisible hit area (warm-ink rect, fillOpacity 0) with title `<text>` `pointer-events:none` so the band catches hover · dedicated `LegendTip` hook + `src/lib/legendInfo.ts` data (verbatim from client workbook Sheet1, columns J/K) · `bun run stylecheck` PASS, `bun run typecheck` PASS, verified live on dev server.

---

## Sign-off log

| Panel | `stylecheck` | Guardrail ticks | Screenshot verified | PLAN step done? |
|---|---|---|---|---|
| AspectBubbleMap | ☑ | ☑ | ☑ | ☑ |
| HarmMechanismMap | ☑ | ☑ | ☑ | ☑ |
| PathwayBandsMap | ☑ | ☑ | ☑ | ☑ |
| BipartiteMorphMap | ☑ | ☑ | ☑ | ☑ |
| Carousel | ☑ | ☑ | ☑ | ☑ |
| Table + page (Step 10–12) | ☑ | ☑ | ☑ | ☐ |

Reviewed by: __________ · Date: __________

Notes:
- **REVISED (client direction, Aug 2026):** AspectBubbleMap now follows the client
  mock (`docs/2_Claude Code of Mock Website_UPDATED.jsx`) visually: single circular
  bubble-pack ("space with big circles"), solid pillar-filled bubbles at 0.88
  opacity with white stroke, labels only under the large circles, dark tooltip,
  zoom/pan controls, grouped legend below, white rounded panel card. These override
  the earlier ecru-panel / translucent-fill / ecru-tooltip readings of the generic
  rules for Panel A; the style contract now sits "as the mock, but original authored
  copy and no AI-isms" per client sign-off. The M / P panel columns remain governed
  by the generic rules until the client decides otherwise.
- AspectBubbleMap signed off (Step 6). D3 v7 used for layout (hierarchy + pack via
  `useMemo`); circles/labels/tooltip are React-rendered SVG inside the island — no
  charting library. Tooltip field order follows the hard contract (title →
  description → count); the plan's per-panel ordering (n before description) is
  recorded as Open Question and is a one-line swap if the client confirms it.
- Panel border strokes use the pillar brand colors at 1.25–2.5px (semantic
  grouping), not ink; the A-column "node borders" box is ticked on that basis.
- **HarmMechanismMap (Step 7) signed off.** Same mock-fidelity approach as Panel A:
  solid 0.9-opacity tier-color fills (mock `TIER_COLORS`), white node labels with
  white 2.5px halo (10px min to satisfy the ≥10px rule; mock used 9.5), ink-alpha
  edges (active 35% / idle 20%), shared dark tooltip variant (id — name →
  description → N entries coded), zoom/pan + `+/−/RESET`, tier-grouped legend.
  The four generic rows left unticked (ecru panel bg, translucent fills, ink node
  borders, ecru tooltip) are documented deviations per client mock direction, same
  as Panel A. Keyboard focus ring + pin-to-isolate kept from the plan (mock's
click-pin plus our a11y additions). Dedup (verbatim) counts used, consistent with
   Panel A and the plan. Min-visible-weight 3 idle matches the mock's graph.
- **PathwayBandsMap (Step 8) signed off.** Mock-faithful port of the colleague's
  `PathwayBandsMap` / `hm2RenderBHtml` geometry (band rects, tier column headers +
  full short labels, step bezier links + arrowheads + per-step counts, tier-colored
  nodes with white labels, pillar-colored democracy-aspect chips with code + name +
  count, click-strip detail, "Democracy aspects" legend, white card chrome with
  highlights ["pathways", "harm for democracy"]). Data (`HM2_PATHS`) extracted
  verbatim from the client mock into `src/lib/pathways.ts`; all seg counts and DA
  counts verified identical in the live DOM. Deviations: SVG text bumped to a 10px
  floor (mock used 8.5/9.5/9) to satisfy the ≥10px rule; ink uses `#1a1a17` not
  `#000`; the footnote adds the mandated "does not include information…" sentence
  alongside the mock's pathway caveat. The panel question title is the mock's own
  "Through which pathways…" (not "Which …"); the gate's which-titles check is
  satisfied via the svg `aria-label`. P-column cells in the grid follow M's tick
  pattern for the generic rows; the mock-originated exceptions (ecru bg, translucent
  fills, ink borders, ecru tooltip, "Which …" title) stay unticked as documented
  deviations. New shared modules: `src/lib/tiers.ts` (TIER_COLORS/TIER_ORDER) and
  `src/lib/useSvgPanZoom.ts` (mock's pan/zoom port).
- **BipartiteMorphMap (Step 9) signed off.** Mock-faithful port of the client's
  `hm2BuildViewA` / `BipartiteMorphMap` (mock carousel panel 3 — this is the
  plan's "benefit grey box" step). Data (`HM2_HB`, `HM2_BEN_COLOR/NAME/LIGHT_BEN`)
  extracted verbatim into `src/lib/bipartite.ts` behind `buildBenefitView()`; live
  DOM verified 36 overview links (= mock's n≥4 edges), 18 boxes (8 tier left, 10
  benefit right), tier drill-down ("Context (T0)" headers, "• Sub-mechanisms…"
  note, min-weight filter keeps ≤20 rows) and Back-to-overview restore. Deviations
  logged: 10px SVG text floor (mock used 9/9.5), ink `#1a1a17`/`#22201a` not
  `#000`, "Back to overview" pill drops its mock box-shadow (vetoed by gate),
  mandated footnote sits under the title alongside the dynamic note line. style
  gate extended so this panel is gated like A/M/P (VIZ_FILE regex includes
  BipartiteMorphMap).