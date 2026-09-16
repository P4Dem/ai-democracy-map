"use client";

import { SelectAsFilter } from "@/components/SelectAsFilter";
import { VizLegend } from "@/components/VizLegend";
import { VizPanelCard } from "@/components/VizPanelCard";
import { VizTooltip } from "@/components/VizTooltip";
import type { AspectMap, Item, VizFilter } from "@/lib/types";
import { withAlpha } from "@/lib/codes";
import { ASPECT_PILLAR_DESC } from "@/lib/legendInfo";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { forceCollide, forceManyBody, forceSimulation, forceX, forceY } from "d3";

const VIEW_W = 1040;
// Layout canvas for the force sim only. The RENDERED svg height is derived from
// the post-layout content (`svgH` below): the lowest 2-line label decides the
// canvas bottom, so no dead band is ever left below the clusters and no label
// can clip. Bubble placement is deterministic (seeded by code), so the fitted
// height is stable too. The carousel measures each panel's height on view, so
// this still just makes Q1 taller than the denser panels – nothing downstream
// jumps.
const VIEW_H = 680;
// Floor for the fitted canvas: even with zero-width content the 4-corner
// layout + parked tooltip still need this much vertical room.
const MIN_SVG_H = 560;
const ZOOM = 1.18;
// Vertical room reserved below every bubble for its caption, fed into the
// collide force so captions never land on a neighbouring bubble or caption.
// Kept modest so clusters pack tight (bubbles sit close together).
const CAPTION_RESERVE = 20;

// Deterministic layout: the jitter below is seeded from each bubble's code, so
// a load or refresh always reproduces the same bubble cloud. Math.random() here
// re-rolled every mount and made the whole svg look like it "moves" between
// loads (viz 2/4 are stable because their geometry never randomises).
function hashSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// P4D brand tokens (globals.css): brick / grassroot / blue / lime.
const PILLAR_COLORS: Record<string, string> = {
  "1": "#963735",
  "2": "#00B140",
  "3": "#92C2FF",
  "4": "#D9E021",
};

const PILLAR_LABELS: Record<string, string> = {
  "1": "Citizenship, Law and Rights",
  "2": "Representative and Accountable Government",
  "3": "Civil Society and Popular Participation",
  "4": "Transnational Dynamics",
};

// Short labels from codebook `docs/4_Codebook Democracy Aspects for AI 20260821.txt`
// so the bubble captions fit without 2-line wrap colliding inside a corner cluster.
const SHORT_LABELS: Record<string, string> = {
  "1.1": "Nationhood",
  "1.2": "Rule of Law",
  "1.3": "Civil Rights",
  "1.4": "Social Rights",
  "2.1": "Elections",
  "2.2": "Parties",
  "2.3": "Accountable Govt",
  "2.4": "Legislature",
  "2.5": "Judiciary",
  "2.6": "Subnational",
  "2.7": "Security Oversight",
  "2.8": "Policy Influence",
  "3.1": "Journalistic Media",
  "3.2": "Political Participation",
  "4.1": "External Influence",
  "4.2": "Impact Abroad",
};

const TITLE = "Which democracy aspects are more frequent across threats?";
const HIGHLIGHT = "democracy aspects";
const NOTE = "* as mentioned in the sources (the data collected does not include information on which threats and mitigations are more impactful)";

type BubbleNode = {
  code: string;
  name: string;
  pillar: string | null;
  freq: number;
  x: number;
  y: number;
  r: number;
};

function wrapLabelLines(text: string, maxChars = 16, maxLines = 2): string[] {
  const words = (text || "").split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w;
    if (candidate.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
      if (lines.length >= maxLines) break;
    } else {
      cur = candidate;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  const consumedLen = lines.join(" ").length;
  if (words.join(" ").length > consumedLen && lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

const formatCount = (n: number) => new Intl.NumberFormat("en").format(n);

type LegendGroup = { color: string; label: string; codes: string[]; description?: string; subNames?: string[] };

type AspectBubbleMapProps = {
  items: Item[];
  aspects: AspectMap;
  onFilterTable?: (target: VizFilter) => void;
};

export const AspectBubbleMap = ({ items, aspects, onFilterTable }: AspectBubbleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [hoveredCode, setHoveredCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const freq = useMemo(() => {
    const c: Record<string, number> = {};
    for (const item of items) {
      if (item.isDuplicate) continue;
      for (const code of item.aspects ?? []) c[code] = (c[code] ?? 0) + 1;
    }
    return c;
  }, [items]);

  const nodes = useMemo<BubbleNode[]>(() => {
    const flat: { code: string; name: string; pillar: string | null; freq: number; value: number }[] = Object.values(
      aspects
    ).map((a) => ({
      code: a.code,
      name: a.name,
      pillar: a.pillarCode,
      freq: freq[a.code] ?? 0,
      value: (freq[a.code] ?? 0) + 1,
    }));
    const unknownTotal = Object.entries(freq)
      .filter(([code]) => !aspects[code])
      .reduce((sum, [, v]) => sum + v, 0);
    if (unknownTotal > 0) {
      flat.push({ code: "Other", name: "Other / unclassified codes", pillar: null, freq: unknownTotal, value: unknownTotal + 1 });
    }
    // 4-corner clustering: each pillar in its own quadrant, inset from edges
    // so the middle stays open (distinct centre cross for the parked tooltip).
    // 0.70 down (was 0.78) pulls the bottom clusters up so their 2-line labels
    // end well inside the fitted canvas bottom – the leftover was a ~25px dead
    // band under the clusters, and trimming the corner closes it. Global radius
    // keeps cross-pillar size comparable (pack per-pillar would normalize away
    // frequency). Rows spread so clusters use the full canvas height instead of
    // leaving a dead band above the legend.
    const CORNERS: Record<string, { x: number; y: number }> = {
      "1": { x: VIEW_W * 0.21, y: VIEW_H * 0.24 },
      "2": { x: VIEW_W * 0.79, y: VIEW_H * 0.24 },
      "3": { x: VIEW_W * 0.21, y: VIEW_H * 0.7 },
      "4": { x: VIEW_W * 0.79, y: VIEW_H * 0.7 },
    };
    const maxVal = Math.max(1, ...flat.map((d) => d.value));
    // Enlarged bubbles. The collide force adds CAPTION_RESERVE so the caption
    // slot under each bubble is kept clear of neighbours.
    const getR = (v: number) => (12 + 31 * Math.sqrt(v / maxVal)) * ZOOM;
    const simNodes: any[] = flat.map((d) => {
      // Per-code jitter, seeded so the cloud is identical on every load.
      const rand = mulberry32(hashSeed(d.code ?? ""));
      return {
        ...d,
        r: getR(d.value),
        x: (CORNERS[d.pillar ?? "4"]?.x ?? VIEW_W / 2) + (rand() - 0.5) * 22,
        y: (CORNERS[d.pillar ?? "4"]?.y ?? VIEW_H / 2) + (rand() - 0.5) * 22,
      };
    });
    const sim = forceSimulation(simNodes)
      .force("collide", forceCollide<any>((d: any) => d.r + CAPTION_RESERVE).strength(0.98))
      .force("x", forceX<any>((d: any) => CORNERS[d.pillar ?? "4"]?.x ?? VIEW_W / 2).strength(0.1))
      .force("y", forceY<any>((d: any) => CORNERS[d.pillar ?? "4"]?.y ?? VIEW_H / 2).strength(0.1))
      .force("charge", forceManyBody().strength(-10))
      .stop();
    for (let i = 0; i < 360; i++) sim.tick();
    // Clamp inside viewBox
    for (const n of simNodes) {
      n.x = Math.max(n.r + 6, Math.min(VIEW_W - n.r - 6, n.x));
      n.y = Math.max(n.r + 6, Math.min(VIEW_H - n.r - 6, n.y));
    }
    return simNodes.map((n) => ({ code: n.code, name: n.name, pillar: n.pillar, freq: n.freq, x: n.x, y: n.y, r: n.r }));
  }, [aspects, freq]);

  const maxR = useMemo(() => Math.max(1, ...nodes.map((n) => n.r)), [nodes]);
  // Lowest rendered content in the layout canvas: every labelled node adds its
  // wrapped caption (y + r + 18, +11 per extra line) below its bubble, so the
  // canvas bottom that fits everything is `contentBottom`. The rendered svg is
  // sized to that + a little slack – identical mechanism to HarmMechanismMap's
  // dynamic svgH, which is why that panel never shows a dead band at the bottom.
  const contentBottom = useMemo(() => {
    let max = 0;
    for (const n of nodes) {
      if (n.r > maxR * 0.38) {
        const label = SHORT_LABELS[n.code] ?? n.name;
        const lines = wrapLabelLines(label, 14, 2).length;
        max = Math.max(max, n.y + n.r + 18 + (lines - 1) * 11);
      } else {
        max = Math.max(max, n.y + n.r);
      }
    }
    return max;
  }, [nodes, maxR]);
  const svgH = Math.max(MIN_SVG_H, Math.ceil(contentBottom + 18));
  // Tooltip target: whatever is hovered, else whatever is pinned by a click.
  // A click keeps the tooltip up until the same node is clicked again, and
  // expands it – hover shows the one-line definition, a pinned click shows the
  // full codebook description.
  const tipNode = nodes.find((n) => n.code === (hoveredCode ?? selected)) ?? null;
  const tipPinned = tipNode != null && selected === tipNode.code;
  const tipDescription = tipNode
    ? (tipPinned ? aspects[tipNode.code]?.description : aspects[tipNode.code]?.definition) ?? ""
    : "";

  const selectedTarget: VizFilter | null =
    selected && selected !== "Other"
      ? { key: "aspect", codes: [selected], label: aspects[selected]?.name ?? selected }
      : null;

  const legendGroups = useMemo<LegendGroup[]>(
    () =>
      ["1", "2", "3", "4"].map((p) => {
        const pillarAspects = Object.values(aspects).filter((a) => a.pillarCode === p);
        return {
          color: PILLAR_COLORS[p],
          label: PILLAR_LABELS[p],
          codes: pillarAspects.map((a) => a.code),
          description: ASPECT_PILLAR_DESC[p],
          subNames: pillarAspects.map((a) => a.name),
        };
      }),
    [aspects]
  );

  // Actual rendered tooltip height, measured after paint so the clamp is exact
  // (hover card ≈ 130px, pinned full-description card ≈ 260px).
  const [tipH, setTipH] = useState(0);
  useLayoutEffect(() => {
    const t = mapRef.current?.querySelector('[role="tooltip"]') as HTMLElement | null;
    const h = t?.offsetHeight ?? 0;
    setTipH((prev) => (Math.abs(prev - h) > 1 ? h : prev));
  }, [tipNode?.code, tipPinned, tipDescription]);

  const placeTooltip = useCallback(
    (n: BubbleNode) => {
      const el = mapRef.current;
      if (!el) return { left: 0, top: 0 };
      const rect = el.getBoundingClientRect();
      const TIP_W = 220; // dark VizTooltip maxWidth
      const h = tipH || (tipPinned ? 260 : 130);

      // The 4-corner layout keeps the centre cross of the canvas permanently
      // clear (clusters sit at ~21% / 79% across, ~24% / 78% down). Park the
      // tooltip there so it never covers a bubble or label:
      //  · always horizontally centred in the visible canvas
      //  · nudged vertically toward the row the hovered node is in, so it
      //    still reads as "this belongs to that bubble"
      //  · clamped by its measured height so it's never clipped by the card
      const left = Math.min(
        Math.max(12, (rect.width - TIP_W) / 2),
        Math.max(12, rect.width - TIP_W - 12)
      );
      const bias = n.y < VIEW_H / 2 ? 26 : -26; // top node → below mid; bottom → above
      const rawTop = rect.height / 2 + bias - h / 2;
      const top = Math.min(Math.max(12, rawTop), Math.max(12, rect.height - h - 12));
      return { left, top };
    },
    [tipH, tipPinned]
  );

  // Center viz on small screens so 4-corner clusters appear balanced
  // (default scrollLeft 0 shows only TL cluster). Runs on mount + resize.
  useLayoutEffect(() => {
    const scroller = mapRef.current?.querySelector("div.overflow-x-auto") as HTMLDivElement | null;
    if (!scroller) return;
    const center = () => {
      if (scroller.clientWidth < scroller.scrollWidth) {
        scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
      }
    };
    center();
    const ro = new ResizeObserver(center);
    ro.observe(scroller);
    window.addEventListener("resize", center);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", center);
    };
  }, []);

  return (
    <VizPanelCard id="viz-aspect-bubble-map" title={TITLE} highlights={[HIGHLIGHT]} note={NOTE}>
      <div
        ref={mapRef}
        className="relative mt-2"
        style={{ height: svgH }}
        onClick={(e) => {
          if (!(e.target as Element).closest(".viz-node")) {
            setHoveredCode(null);
            setSelected(null);
            setFocused(null);
          }
        }}
      >
        <div className="overflow-x-auto" style={{ height: svgH }}>
          <svg
            width="100%"
            height={svgH}
            viewBox={`0 0 ${VIEW_W} ${svgH}`}
            style={{ display: "block", minWidth: VIEW_W }}
            role="img"
            aria-label={TITLE}
            onClick={(e) => {
              // Click on empty canvas (not a bubble) resets focus/selection
              if (!(e.target as Element).closest(".viz-node")) {
                setHoveredCode(null);
                setSelected(null);
                setFocused(null);
              }
            }}
          >
            <g>
              {nodes.map((n) => {
                const color = n.pillar ? PILLAR_COLORS[n.pillar] : "#5C5C52";
                const activeCode = hoveredCode ?? selected;
                const isHovered = hoveredCode === n.code;
                const isSel = selected === n.code;
                const isFocus = focused === n.code;
                // While a node is hovered/selected, grey every other node out so
                // the focused one reads clearly.
                const dimmed = activeCode != null && n.code !== activeCode;
                return (
                  <g key={n.code}>
                    {isFocus && (
                      <circle cx={n.x} cy={n.y} r={n.r + 3} fill="none" stroke="#963735" strokeWidth={2} />
                    )}
                    <circle
                      className="viz-node"
                      cx={n.x}
                      cy={n.y}
                      r={n.r}
                      fill={dimmed ? "#CBC6BB" : color}
                      opacity={dimmed ? 0.5 : 0.92}
                      stroke={dimmed ? "#EAE5D8" : "#ffffff"}
                      strokeWidth={isHovered || isSel ? 3 : 1.5}
                      tabIndex={0}
                      role="button"
                      aria-pressed={isSel}
                      aria-label={`${n.name}, ${formatCount(n.freq)} entries coded`}
                      style={{ transition: "fill 140ms ease, opacity 140ms ease, stroke 140ms ease, stroke-width 120ms ease", cursor: "default" }}
                      onMouseEnter={() => setHoveredCode(n.code)}
                      onMouseLeave={() => setHoveredCode(null)}
                      onFocus={() => setFocused(n.code)}
                      onBlur={() => setFocused(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(isSel ? null : n.code);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelected(isSel ? null : n.code);
                      }}
                    />
                  </g>
                );
              })}
              {nodes.map((n) => {
                const showLabel = n.r > maxR * 0.38;
                if (!showLabel) return null;
                const label = SHORT_LABELS[n.code] ?? n.name;
                const lines = wrapLabelLines(label, 14, 2);
                const activeCode = hoveredCode ?? selected;
                const dimmed = activeCode != null && n.code !== activeCode;
                return (
                  <text
                    key={`label-${n.code}`}
                    x={n.x}
                    y={n.y + n.r + 18}
                    textAnchor="middle"
                    fontSize={10.5}
                    fontWeight={700}
                    fill={dimmed ? "#B4AEA1" : "#22201a"}
                    stroke="#F4F4EA"
                    strokeWidth={3}
                    paintOrder="stroke"
                    style={{ transition: "fill 140ms ease", pointerEvents: "none" }}
                  >
                    {lines.map((line, i) => (
                      <tspan key={i} x={n.x} dy={i === 0 ? 0 : 11}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>

        {tipNode && (
          <VizTooltip
            variant="dark"
            title={tipNode.name}
            description={tipDescription}
            count={`${formatCount(tipNode.freq)} mention${tipNode.freq === 1 ? "" : "s"}`}
            {...placeTooltip(tipNode)}
          />
        )}
      </div>

      <VizLegend groups={legendGroups} topGap={10} activeCode={hoveredCode ?? selected} showCodes={false} />
      {selectedTarget && onFilterTable && (
        <SelectAsFilter
          target={selectedTarget}
          onApply={onFilterTable}
          onDismiss={() => setSelected(null)}
        />
      )}
    </VizPanelCard>
  );
};