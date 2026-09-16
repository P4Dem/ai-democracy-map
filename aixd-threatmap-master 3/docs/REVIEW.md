# Client review — AI–Democracy Map (preview + admin)

Last updated: 2026-08-31

## URLs

| What | URL | Notes |
|---|---|---|
| **Preview site** | https://nashthecoder.github.io/ai-democracy-map-dev/ | The build under review. Static, public, `noindex`. |
| **Admin console (demo)** | https://nashthecoder.github.io/ai-democracy-map-dev/admin/ | Read-only demo — see "Admin" below. |
| Current production (for comparison) | https://p4dem.github.io/ai-democracy-map/ | Unchanged. Older table-only build from `aixd-threatmap-master 2/`. |

Production is **not touched** by this review. Promotion path is at the bottom.

## What's new since production

- **Data rebuilt** from the single client workbook `20260828_Updated data + new
  labels + new descriptions.xlsx` — dataset `DATASET V 10.3` (204 records) and
  codebook `CODEBOOKS V0.53-ED` (58 harm codes, 28 pro-dem codes). All three JSON
  artifacts (`data`, `harm_taxonomy`, `benefit_taxonomy`) regenerate from that
  one file via `bun run data`.
- **Q1 "Which democracy aspects…"** redesigned as a four-corner bubble map, one
  cluster per pillar. Hover shows title + mention count + short definition; click
  pins the full description. Non-focused nodes grey out.
- **Q2 / Q3 / Q4** — chronological node ordering, overlap fixes, and click-to-
  filter that also highlights the matching legend entry / node.
- **Suggested filters** — clicking a node no longer force-applies a table filter;
  it surfaces an "Apply filter: X" button with a dismiss control.
- **Legend highlighting** — the legend row for a hovered / selected code gets a
  tinted background across all four panels.
- **Responsive table** — narrow screens restructure the text (stepped
  min-widths, code-only aspect chips, wrapping type labels) instead of dropping
  columns.
- **Admin console** — redesigned; adds a reader-questions review workflow.

## Admin (demo mode)

The console is a **demo for this review only** — final sign-off from P4D pending.

- With **no GitHub token** it loads a bundled sample file
  (`public/data/questions.csv`, 10 example reader questions) so the workflow is
  visible offline. A blue "Demo preview" banner and a "Sample data" badge mark
  this state. All save actions are disabled.
- Click any question row to expand it: full text, metadata, and a response box.
  **Save & mark answered / Skip / Reopen** write `status`, `answer`, and
  `answeredAt` back to `data/questions.csv` through the GitHub Contents API —
  only when a fine-grained PAT (Contents: R/W) is entered in the sidebar. The
  token stays in that tab's `sessionStorage`; there is no server.
- The **Codebook** tab is disabled ("Soon") for this review — it still writes the
  pre-v0.53 `aspects.json` shape and needs to be re-pointed at the new pipeline.
- Reader questions capture no contact details, so answers are stored in the CSV
  (e.g. to build a public FAQ), not emailed.

## Known issues / open items

- **CI is billing-locked.** GitHub Actions on `nashthecoder` is disabled for a
  billing issue, so the normal deploy workflow cannot run. The preview is served
  from a `gh-pages` branch (built locally, `Pages → Deploy from branch`). The old
  `Deploy to GitHub Pages` workflow still fires on push and shows as failed —
  cosmetic, ignore it. Clearing the billing lock restores normal CI.
- **Q2 node sizing + labels** are not finalised.
- **Q3 / Q4** do not grey out non-selected nodes (Q1 / Q2 do).
- `bipartite.ts` / `pathways.ts` still carry hardcoded figures from the mock and
  do not yet reflect the v10.3 data — Q3/Q4 counts are indicative.
- Codebook admin tab disabled (above).

## Updating the preview (while CI is locked)

```bash
cd "aixd-threatmap-master 3"
bun run build
cd dist && touch .nojekyll
git init -q && git add -A && git commit -q -m "deploy: $(date -u +%FT%RZ)"
git branch -M gh-pages
git push -f git@github.com:nashthecoder/ai-democracy-map-dev.git gh-pages
# if the Pages build doesn't auto-trigger:
gh api -X POST repos/nashthecoder/ai-democracy-map-dev/pages/builds
```

## Promotion to production (after sign-off)

Production builds `aixd-threatmap-master 2/` from `P4Dem/ai-democracy-map`.
To ship this work:

1. Reconcile `aixd-threatmap-master 3/` into the prod repo (or re-point the prod
   deploy workflow at the master-3 source).
2. Restore normal CI on whichever account owns the deploy, or keep the
   branch-deploy fallback documented above.
3. Re-enable / re-point the Codebook admin tab at the v0.53 pipeline before
   researchers rely on it.
