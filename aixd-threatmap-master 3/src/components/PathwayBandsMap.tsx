"use client";

import { SelectAsFilter } from "@/components/SelectAsFilter";
import { VizPanelCard } from "@/components/VizPanelCard";
import { useLegendTip } from "@/components/LegendTip";
import { HM2_CLUSTERS, HM2_DA_NAME, HM2_DA_PILLAR, HM2_DA_PILLAR_NAME, HM2_PATHS, HM2_TIER_SHORT } from "@/lib/pathways";
import { TIER_COLORS } from "@/lib/tiers";
import { PATHWAY_CLUSTER_DESC, tierKeyOf } from "@/lib/legendInfo";
import { accessibleLabelOf, mixInk, withAlpha } from "@/lib/codes";
import type { HarmTaxonomy } from "@/lib/types";
import type { VizFilter } from "@/lib/types";
import type { ReactNode } from "react";
import { useState } from "react";

// 1040 originally left only 10px between the DA-chip column's right edge
// (HM2B_DAX + HM2B_DAW = 848 + 182 = 1030) and the canvas boundary – the
// chips read as flush against the panel edge. Widening the canvas (rather
// than shrinking the chips or shifting them left) adds real right padding
// without touching anything else's position. Widened another 40px on top of
// that (1070 → 1110) to make room for the wider Capability uses → Targeted
// use gap below – the connecting arrows sat almost flush against both node
// edges (only ~2px of real gap) with barely any room to read as curves.
const VIEW_W = 1110;
// The canvas matches this panel's own content: the three bands plus their
// header fill the height with a small bottom margin. Height was bumped from
// 480 to 552 so lanes get real height – 40px+ per row instead of a squeeze –
// which lets node pills grow to 34px and carry a third text line, cutting the
// "…" truncations to only the longest labels.
const VIEW_H = 552;

// Geometry rescaled from the colleague's original 430px-tall layout to this
// site's map height, matching the client mock's panels.
// T5-T7 shifted +40 from their original positions (604/698/782 → 644/738/822)
// to open up the Capability uses (T4) → Targeted use (T5) gap specifically –
// that pair's node edges sat only ~2px apart, leaving the connecting curves
// no real room to bow into and read as distinct arrows. The gaps among
// T5-T6-T7 themselves are unchanged; they all just moved together.
const HM2B_TX: Record<string, number> = { T0: 70, T1: 182, T2: 288, T3: 396, T4: 500, T5: 644, T6: 738, T7: 822 };
const HM2B_CLUS_X: [number, number][] = [
  [14, 126],
  [126, 342],
  [342, 696],
  [696, 878],
];
const HM2B_DAX = 888;
// Chip width – kept 12px inside the band card's own right edge (which sits
// at HM2B_DAX + HM2B_DAW + 12) rather than flush against it.
const HM2B_DAW = 170;
// Band geometry scaled from the colleague's original 400px-tall layout and
// then re-flowed for a 552px canvas: card heights are sized to each band's
// lane count (4 / 2 / 2 lanes) with ~14px gaps between cards and a real
// margin under the header chips. The third band (Lock-in & power
// concentration) is the tightest – the "Rules for building AI" pills at
// lane 0 sit directly under the band title – so it gets extra height to grow
// lane height to 48px and keep the first-row pills ~4px clear of the title's
// descenders instead of kissing them.
const HM2B_BAND = [
  { top: 90, h: 196 },
  { top: 300, h: 124 },
  { top: 434, h: 122 },
];
const HM2B_NODE_W = 102;
// Header strip rows: every cluster title plus the democracy-affected column
// sits at the very top of the svg on one aligned baseline (HM2B_TITLE_Y2),
// each centred over its territory; the titles too long for their columns wrap
// onto a distinct second row (HM2B_TITLE_WRAP); the tier sub-title chips sit
// below with real padding between them (HM2B_CHIP_Y) so the headers read as
// their own block instead of sitting on top of the column labels.
const HM2B_TITLE_Y2 = 20;
const HM2B_TITLE_WRAP = 32;
const HM2B_CHIP_Y = 55;
const HM2B_VLINE_BOTTOM = 540;

const TITLE = "Through which pathways does the literature link AI to harm for democracy?";
const NOTE =
  "* as mentioned in the sources (the data collected does not include information on which threats and mitigations are more impactful). Bands are recurring pathways; numbers count entries asserting that step within a single statement – recurring claims in the literature, not verified causation. Other pathways can be drawn from the data besides those visualised here.";

const hm2Lbl = (c: string, tax?: HarmTaxonomy) =>
  accessibleLabelOf(c, tax, undefined) ?? HM2_TIER_SHORT[c] ?? c;
const hm2TierOfPath = (c: string) => {
  const m = /^T(\d+)/.exec(c);
  return m ? "T" + m[1] : null;
};

function wrapWords(text: string, max: number): string[] {
  const w = String(text).split(" ");
  const out: string[] = [];
  let c = "";
  for (const x of w) {
    if ((c + " " + x).trim().length <= max) c = (c + " " + x).trim();
    else {
      if (c) out.push(c);
      c = x;
    }
  }
  if (c) out.push(c);
  return out;
}

const formatCount = (n: number) => new Intl.NumberFormat("en").format(n);

export const PathwayBandsMap = ({
  onFilterTable,
  harmTaxonomy,
}: {
  onFilterTable?: (target: VizFilter) => void;
  harmTaxonomy?: HarmTaxonomy;
}) => {
  const [active, setActive] = useState<ReactNode | null>(null);
  const [filterTarget, setFilterTarget] = useState<VizFilter | null>(null);
  const { tipNode, open } = useLegendTip();
  const openClusterTip = (name: string, tiers: string[], rect: DOMRect) =>
    open(
      {
        title: name,
        description: PATHWAY_CLUSTER_DESC[name],
        lines: tiers
          .flatMap((t) =>
            (harmTaxonomy?.tiers[tierKeyOf(t)]?.codeIds ?? [])
              .filter((code) => harmTaxonomy?.codes[code])
              .map((code) => harmTaxonomy?.codes[code]?.label)
          )
          .filter((x): x is string => !!x),
      },
      rect
    );
  // Democracy-aspect chip names truncate hard in the ~150px column ("Opinion
  // Formation and Political…") – hover reveals the full name plus the same
  // mention count the click detail below shows, using the panel's existing
  // hover-tip mechanism (already wired up for the cluster headers above).
  const openDATip = (code: string, name: string, count: number, total: number, pathway: string, rect: DOMRect, bounds?: DOMRect) =>
    open(
      {
        title: `${code} ${name}`,
        description: `Mentioned in ${formatCount(count)} of ${formatCount(total)} entries in the pathway "${pathway}".`,
      },
      rect,
      // These chips are stacked tightly in a column – dropping the tip
      // above/below (the default) covers the hovered chip and its neighbour.
      // Placing it to the right instead keeps every pill in the column clear.
      "right",
      // Clamp inside the panel card itself rather than the full viewport, so
      // the tip never spills out over neighbouring page content.
      bounds
    );
  const lbl = (c: string) => hm2Lbl(c, harmTaxonomy);
  // The clicked (filterable) code – highlighted in the diagram + legend.
  const selCode = filterTarget?.codes[0] ?? null;
  const selPillar = filterTarget?.key === "aspect" ? selCode?.[0] ?? null : null;

  const showDetail = (html: ReactNode) => {
    setActive(html);
  };

  return (
    <VizPanelCard
      id="viz-pathway-bands-map"
      title={TITLE}
      highlights={["pathways", "harm for democracy"]}
      note={NOTE}
      noteItalic
    >
      <div className="relative mt-2 overflow-x-auto" style={{ minHeight: VIEW_H }}>
        <svg
          width="100%"
          height={VIEW_H}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          style={{ display: "block", minWidth: VIEW_W }}
          role="img"
          aria-label="Which pathways does the literature link AI to harm for democracy? Band diagram; click a step, mechanism or aspect chip for detail."
        >
          <g>
            {HM2B_CLUS_X.map((cx, ci) => {
              const c = HM2_CLUSTERS[ci];
              const mid = (cx[0] + cx[1]) / 2;
              // Titles that would overflow their own territory wrap instead
              // ("Downstream social dynamics" is ~197px at this size against
              // a 182px column; "Properties and capabilities" at 174px fits
              // its wider 216px one) so only the genuinely-long names drop
              // onto the distinct second header row.
              const wrap = c.name.length > 18 && cx[1] - cx[0] < 200;
              const nameLines = wrap ? wrapWords(c.name, 17) : [c.name];
              return (
                <g key={ci}>
                  {ci > 0 && (
                    <line x1={cx[0] - 4} y1={6} x2={cx[0] - 4} y2={HM2B_VLINE_BOTTOM} stroke="#D6D6CA" strokeWidth={1} />
                  )}
                  {/* Invisible hover target for the cluster's "head category"
                      hover box (short description + sub-codes), matching the
                      hover boxes added to the other panels' legends. */}
                  <rect
                    x={cx[0] - 8}
                    y={4}
                    width={cx[1] - cx[0] + 16}
                    height={HM2B_CHIP_Y}
                    fill="#1a1a17"
                    fillOpacity={0}
                    style={{ cursor: "help" }}
                    onMouseEnter={(e) => openClusterTip(c.name, c.tiers, e.currentTarget.getBoundingClientRect())}
                  />
                  {/* Cluster titles read as a layered header, not one unbroken
                      line: Context, Properties and capabilities and AI model
                      use fit their columns and share a single baseline, while
                      Downstream social dynamics wraps onto a distinct second
                      row – same title weight, a real line break, still above
                      the tier sub-title chips. */}
                  <text
                    x={mid}
                    y={HM2B_TITLE_Y2}
                    textAnchor="middle"
                    fontSize={12.5}
                    fontWeight={800}
                    fill="#1a1a17"
                    style={{ pointerEvents: "none" }}
                  >
                    {nameLines.map((ln, li) => (
                      <tspan key={li} x={mid} dy={li === 0 ? 0 : HM2B_TITLE_WRAP - HM2B_TITLE_Y2}>
                        {ln}
                      </tspan>
                    ))}
                  </text>
                  {/* Skip the per-tier chip label when a cluster has only one
                      tier – e.g. "Context" (T0 alone), whose tier short name
                      is also literally "Context". With one member the group
                      title above already says it; repeating it as a chip
                      right underneath just duplicates the same word twice. */}
                  {c.tiers.length > 1 && c.tiers.map((t) => {
                    // Tier columns are only 84–112px apart – at the old 11-char
                    // budget nearly every name fractured into two lines ("AI" /
                    // "capabilities") at mixed baselines, so the sub-title row
                    // read as ragged fragments. 17 lets all but the longest
                    // names ("Individual downstream", "Societal downstream") sit
                    // on one whole-word line, keeping the row aligned and the
                    // labels clearly subordinate to the cluster titles above.
                    const lines = wrapWords(HM2_TIER_SHORT[t], 17).slice(0, 2);
                    return (
                      <text key={t} x={HM2B_TX[t]} y={HM2B_CHIP_Y} textAnchor="middle" fontSize={10.5} fontWeight={600} fill={TIER_COLORS[t]}>
                        {lines.map((line, li) => (
                          <tspan key={li} x={HM2B_TX[t]} dy={li === 0 ? (lines.length > 1 ? -2 : 0) : 9}>
                            {line}
                          </tspan>
                        ))}
                      </text>
                    );
                  })}
                </g>
              );
            })}

            <line x1={HM2B_DAX - 8} y1={6} x2={HM2B_DAX - 8} y2={HM2B_VLINE_BOTTOM} stroke="#D6D6CA" strokeWidth={1} />
            {/* Centred over the democracy-affected column like the cluster headings
                over theirs – the header row treats it as a fifth column even
                though its pills are left-anchored. Wraps like the Downstream
                social dynamics title because its full name is too wide for
                the column. */}
            <text x={HM2B_DAX + HM2B_DAW / 2} y={HM2B_TITLE_Y2} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#1a1a17">
              {wrapWords("Democracy aspects affected", 16).map((ln, li) => (
                <tspan key={li} x={HM2B_DAX + HM2B_DAW / 2} dy={li === 0 ? 0 : HM2B_TITLE_WRAP - HM2B_TITLE_Y2}>
                  {ln}
                </tspan>
              ))}
            </text>

            {HM2_PATHS.map((f, fi) => {
              const b = HM2B_BAND[fi];
              const lanes = Math.max(...f.nodes.map((n) => n.l)) + 1;
              const laneH = (b.h - 26) / lanes;
              const nx: Record<string, number> = {};
              const ny: Record<string, number> = {};
              f.nodes.forEach((n) => {
                nx[n.c] = HM2B_TX["T" + n.t];
                ny[n.c] = b.top + 2 + n.l * laneH + laneH / 2;
              });
              return (
                <g key={fi}>
                  {/* The accent bar's own rx (2.5) is far tighter than the
                      card's (14), so near the top/bottom the card's edge has
                      already curved inward while the bar's corners are still
                      almost square – the bar's corners poke out past where
                      the card's own rounded silhouette has receded to,
                      reading as a separate pill glued on top rather than an
                      inset border. Clipping the bar to the card's own
                      rounded-rect shape makes it follow that exact curve. */}
                  <clipPath id={`band-clip-${fi}`}>
                    <rect x={10} y={b.top - 16} width={1060} height={b.h} rx={14} />
                  </clipPath>
                  <rect x={10} y={b.top - 16} width={1060} height={b.h} rx={14} fill={fi % 2 ? "#FBFBF3" : "#F7F7EE"} stroke="#E4E4D6" strokeWidth={1} />
                  <rect x={10} y={b.top - 16} width={5} height={b.h} fill="#963735" opacity={0.75} clipPath={`url(#band-clip-${fi})`} />
                  {/* Band title sits right under the rounded card's top edge
                      (rect starts at b.top-16) – nudged down from the previous
                      b.top-4 to b.top+2 for real breathing room above the text.
                      Title + count are one <text> with the count as a tspan
                      so the browser lays out real glyph widths – the old
                      two-<text> version positioned the count by estimating
                      the title's pixel width from its character count, which
                      undershot for longer titles and ran the count straight
                      into the title's last letters. */}
                  <text x={24} y={b.top + 2} fontSize={11.5} fontWeight={800} fill="#1a1a17">
                    {f.name}
                    <tspan fontSize={10} fontWeight={600} fill="#9A9A92">
                      {" "}
                      · {formatCount(f.units)} entries
                    </tspan>
                  </text>

                  {/* Node columns can sit as little as ~2px apart edge-to-edge
                      (e.g. Capability uses → Targeted use), so however a
                      curve between them is bent, there's essentially no gap
                      to bend it INTO – any curviness just cranks up inside
                      that same sliver of space. The actual fix for several
                      links sharing one node: today every sibling starts (or
                      ends) at that node's exact center, so they're born from
                      one pixel with zero space between them regardless of
                      column gap. Spreading each sibling's attachment point
                      across the node's own height instead gives them real
                      separation from the moment they leave it. */}
                  {(() => {
                    const nodeH = Math.min(34, laneH - 6);
                    const attachSpan = nodeH * 0.6;
                    const attachOffset = (rank: number, count: number) =>
                      count > 1 ? (rank / (count - 1) - 0.5) * attachSpan : 0;

                    return f.segs.map((sg, si) => {
                    const outSiblings = f.segs.filter((s) => s.a === sg.a).sort((p, q) => ny[p.b] - ny[q.b]);
                    const inSiblings = f.segs.filter((s) => s.b === sg.b).sort((p, q) => ny[p.a] - ny[q.a]);
                    const y1 = ny[sg.a] + attachOffset(outSiblings.findIndex((s) => s.b === sg.b), outSiblings.length);
                    const y2 = ny[sg.b] + attachOffset(inSiblings.findIndex((s) => s.a === sg.a), inSiblings.length);
                    const x1 = nx[sg.a] + HM2B_NODE_W / 2;
                    const x2 = nx[sg.b] - HM2B_NODE_W / 2;
                    // A fixed 24px reach for both control points, regardless
                    // of how tight the column gap is (some are only a couple
                    // of px edge-to-edge). Scaling this down to the gap
                    // seemed safer on paper but collapsed the curve into a
                    // near-straight, kinked line for tight columns – visibly
                    // worse. The pill nodes render after (below) these paths,
                    // so a control point reaching past a neighbour's edge is
                    // simply hidden under that pill's opaque fill, not a
                    // visible defect.
                    const cx1 = x1 + 24;
                    const cx2 = x2 - 24;
                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;
                    const col = TIER_COLORS[hm2TierOfPath(sg.b) ?? "T0"];
                    const activateSeg = () => {
                      showDetail(
                        <>
                          <b>
                            {lbl(sg.a)} → {lbl(sg.b)}
                          </b>{" "}
                          – asserted together in <b>{formatCount(sg.n)} entries</b>. Pathway: {f.name}.
                        </>
                      );
                    };
                    return (
                      <g
                        key={si}
                        className="viz-node"
                        style={{ cursor: "pointer" }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${lbl(sg.a)} to ${lbl(sg.b)}, ${formatCount(sg.n)} entries`}
                        onClick={(e) => {
                          e.stopPropagation();
                          activateSeg();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            activateSeg();
                          }
                        }}
                      >
                        <path
                          d={`M${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                          fill="none"
                          stroke={col}
                          strokeWidth={(0.9 + sg.n * 0.42).toFixed(1)}
                          opacity={0.55}
                        />
                        <path d={`M${x2 - 6} ${y2 - 3.5} L${x2} ${y2} L${x2 - 6} ${y2 + 3.5}`} fill="none" stroke={col} strokeWidth={1.3} opacity={0.8} />
                        <text x={mx} y={my - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#22201a" stroke="#ffffff" strokeWidth={2.5} paintOrder="stroke">
                          {formatCount(sg.n)}
                        </text>
                      </g>
                    );
                    });
                  })()}

                  {f.nodes.map((n) => {
                    const x = nx[n.c];
                    const y = ny[n.c];
                    const col = TIER_COLORS["T" + n.t];
                    const h = Math.min(34, laneH - 6);
                    // 15 chars/line at 10px bold is the most that fits a
                    // 102px pill with real side margins (the 98px width was
                    // capped by the 104px T4→T5 column gap; 102 keeps a
                    // thin air gap between neighbouring pills). Two lines
                    // handle most names; taller lanes on the 2-lane bands
                    // give the longest labels a third line so only
                    // "Disinformation & deepfakes about political content"
                    // still drops a trailing "…".
                    const all = wrapWords(lbl(n.c), 15);
                    const maxLines = h >= 30 ? 3 : 2;
                    const lines = all.slice(0, maxLines);
                    const trunc = all.length > lines.length;
                    const activateNode = () => {
                      const t = hm2TierOfPath(n.c);
                      const clusterName = HM2_CLUSTERS.find((k) => t && k.tiers.includes(t))?.name || "";
                      setFilterTarget({
                        key: "harm",
                        codes: [n.c],
                        label: lbl(n.c),
                      });
                      showDetail(
                        <>
                          <b>
                            {lbl(n.c)} ({n.c})
                          </b>{" "}
                          – {t ? HM2_TIER_SHORT[t] : ""}
                          {clusterName ? `, in ${clusterName}.` : "."}
                        </>
                      );
                    };
                    return (
                      <g
                        key={n.c}
                        className="viz-node"
                        style={{ cursor: "pointer" }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${lbl(n.c)} (${n.c})`}
                        onClick={(e) => {
                          e.stopPropagation();
                          activateNode();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            activateNode();
                          }
                        }}
                      >
                        <rect
                          x={x - HM2B_NODE_W / 2}
                          y={y - h / 2}
                          width={HM2B_NODE_W}
                          height={h}
                          rx={8}
                          fill={withAlpha(col, selCode === n.c ? 0.32 : 0.16)}
                          stroke={selCode === n.c ? mixInk(col, 0.25) : withAlpha(col, 0.55)}
                          strokeWidth={selCode === n.c ? 2.5 : 1.5}
                        />
                        {lines.map((ln, li) => (
                          <text
                            key={li}
                            x={x}
                            y={y + (li - (lines.length - 1) / 2) * 9}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={10}
                            fontWeight={700}
                            fill={mixInk(col, 0.25)}
                          >
                            {ln}
                            {trunc && li === lines.length - 1 ? "…" : ""}
                          </text>
                        ))}
                      </g>
                    );
                  })}

                  {(() => {
                    // Each chip needs ~48px of vertical room: the three text
                    // rows (code+count, then a 2-line name) need ~38px to
                    // keep clear padding from the pill's own edges, plus a
                    // visible gap to the next chip. Show as many as actually
                    // fit cleanly rather than always forcing 4.
                    const maxByHeight = Math.max(1, Math.floor((b.h - 26) / 48));
                    return f.das.slice(0, Math.min(4, maxByHeight));
                  })().map((d, di, shownDAs) => {
                    const step = (b.h - 26) / shownDAs.length;
                    const y = b.top + 2 + di * step + step / 2;
                    // Three rows now (code+count, then the name wrapped over
                    // up to 2 lines) instead of hard-truncating the name to
                    // one line – with the old single-line truncation, every
                    // aspect name in this column cut off mid-word. Text-row
                    // offsets below are fixed regardless of hh, so extra
                    // room (when a band has fewer chips) becomes genuine
                    // padding rather than stretching the line spacing.
                    const hh = Math.min(50, step - 10);
                    const col = HM2_DA_PILLAR[d[0][0]];
                    const nameLines = wrapWords(HM2_DA_NAME[d[0]] || d[0], 22).slice(0, 2);
                    const nameTrunc = wrapWords(HM2_DA_NAME[d[0]] || d[0], 22).length > 2;
                    const activateDA = () => {
                      setFilterTarget({
                        key: "aspect",
                        codes: [d[0]],
                        label: HM2_DA_NAME[d[0]] || d[0],
                      });
                      showDetail(
                        <>
                          <b>
                            {d[0]} {HM2_DA_NAME[d[0]] || d[0]}
                          </b>{" "}
                          – mentioned in <b>{formatCount(d[1])} of {formatCount(f.units)} entries</b> in the pathway "{f.name}".
                        </>
                      );
                    };
                    return (
                      <g
                        key={`da-${di}`}
                        className="viz-node"
                        style={{ cursor: "pointer" }}
                        tabIndex={0}
                        role="button"
                        aria-label={`${d[0]} ${HM2_DA_NAME[d[0]] || d[0]}, ${formatCount(d[1])} entries`}
                        onClick={(e) => {
                          e.stopPropagation();
                          activateDA();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            activateDA();
                          }
                        }}
                        onMouseEnter={(e) =>
                          openDATip(d[0], HM2_DA_NAME[d[0]] || d[0], d[1], f.units, f.name, e.currentTarget.getBoundingClientRect())
                        }
                        onFocus={(e) =>
                          openDATip(d[0], HM2_DA_NAME[d[0]] || d[0], d[1], f.units, f.name, e.currentTarget.getBoundingClientRect())
                        }
                      >
                        <rect
                          x={HM2B_DAX}
                          y={y - hh / 2}
                          width={HM2B_DAW}
                          height={hh}
                          rx={10}
                          fill={withAlpha(col, selCode === d[0] ? 0.32 : 0.16)}
                          stroke={selCode === d[0] ? mixInk(col, 0.25) : withAlpha(col, 0.55)}
                          strokeWidth={selCode === d[0] ? 2.5 : 1.2}
                        />
                        {/* Row offsets are fixed (not scaled to hh) so extra
                            pill height becomes real padding above/below the
                            text block instead of stretching the line gaps.
                            Left/right insets bumped 9/8 → 12/12 – at the old
                            insets the code and count text sat right against
                            the pill's rx=10 rounded corners with no visible
                            margin. */}
                        <text x={HM2B_DAX + 12} y={y - 10} dominantBaseline="central" fontSize={10} fontWeight={800} fill={mixInk(col, 0.25)}>
                          {d[0]}
                        </text>
                        <text x={HM2B_DAX + HM2B_DAW - 12} y={y - 10} textAnchor="end" dominantBaseline="central" fontSize={9.5} fontWeight={700} fill={mixInk(col, 0.25)}>
                          {formatCount(d[1])} entries
                        </text>
                        {nameLines.map((line, li) => (
                          <text
                            key={li}
                            x={HM2B_DAX + 12}
                            y={y + li * 10}
                            dominantBaseline="central"
                            fontSize={10}
                            fontWeight={600}
                            fill={mixInk(col, 0.25)}
                          >
                            {line}
                            {nameTrunc && li === nameLines.length - 1 ? "…" : ""}
                          </text>
                        ))}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div
        style={{
          marginTop: 14,
          padding: "12px 14px",
          background: "#EAEAE3",
          borderRadius: 14,
          fontSize: 12.5,
          color: "#5C5C52",
          lineHeight: 1.55,
        }}
      >
        {active ?? "Click a mechanism, a step, or a democracy-aspect chip for detail."}
      </div>

      {filterTarget && onFilterTable && (
        <SelectAsFilter
          target={filterTarget}
          onApply={onFilterTable}
          onDismiss={() => setFilterTarget(null)}
        />
      )}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "8px 18px",
          fontSize: 10.5,
          color: "#5C5C52",
          marginTop: 14,
          paddingTop: 12,
          borderTop: "1px solid #D6D6CA",
        }}
      >
        <span style={{ fontWeight: 800, color: "#1a1a17", textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Democracy aspects
        </span>
        {["1", "2", "3", "4"].map((p) => {
          const isActive = selPillar === p;
          return (
            <span
              key={p}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                borderRadius: 8,
                padding: "3px 7px",
                margin: "-3px -7px",
                fontWeight: isActive ? 700 : undefined,
                color: isActive ? "#1a1a17" : undefined,
                background: isActive ? withAlpha(HM2_DA_PILLAR[p], 0.16) : "transparent",
                outline: isActive ? `1px solid ${withAlpha(HM2_DA_PILLAR[p], 0.5)}` : "none",
                outlineOffset: "-1px",
                transition: "background 140ms ease, outline-color 140ms ease",
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: HM2_DA_PILLAR[p], flexShrink: 0 }} />
              {HM2_DA_PILLAR_NAME[p]}
            </span>
          );
        })}
      </div>
      {tipNode}
    </VizPanelCard>
  );
};