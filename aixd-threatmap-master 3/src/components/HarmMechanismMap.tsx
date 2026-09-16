"use client";

import { VizLegend } from "@/components/VizLegend";
import { VizPanelCard } from "@/components/VizPanelCard";
import { VizTooltip } from "@/components/VizTooltip";
import { SelectAsFilter } from "@/components/SelectAsFilter";
import type { HarmTaxonomy, Item, VizFilter } from "@/lib/types";
import { withAlpha } from "@/lib/codes";
import { HARM_TIER_DESC } from "@/lib/legendInfo";
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceY } from "d3";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

const VIEW_W = 1040;
const VIEW_H = 600;
const MIN_W = 640;
const MARGIN = 56;
const TOP_MARGIN = 64;
// Vertical room reserved under each node, since every node always shows a
// title (two 10px lines spaced 11px, rendered at y + r + 11). The panel
// height grows to fit the most packed tier so no title is ever clipped.
const LABEL_H = 24;
const MIN_GAP = 6;

const TIER_ORDER = ["tier0", "tier1", "tier2", "tier3", "tier4", "tier5", "tier6", "tier7"];
const TIER_CODE = { tier0: "T0", tier1: "T1", tier2: "T2", tier3: "T3", tier4: "T4", tier5: "T5", tier6: "T6", tier7: "T7" } as const;

const TIER_COLORS: Record<string, string> = {
  tier0: "#963735",
  tier1: "#4A5FA6",
  tier2: "#7BA8D9",
  tier3: "#2E9CA8",
  tier4: "#1E93A8",
  tier5: "#F97C2B",
  tier6: "#C6402F",
  tier7: "#4E5A63",
};

// Short client-authored tier names, exactly as in the mock (compact header chips).
const TIER_SHORT: Record<string, string> = {
  tier0: "Context",
  tier1: "AI capabilities",
  tier2: "Model-inherent",
  tier3: "Use decisions",
  tier4: "Capability uses",
  tier5: "Targeted use",
  tier6: "Individual downstream",
  tier7: "Societal downstream",
};

const MIN_VISIBLE_WEIGHT = 3;

const TITLE = "Which mechanisms are more frequently involved in harming democracy?";
const NOTE = "* as mentioned in the sources (the data collected does not include information on which threats and mitigations are more impactful)";

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
  if (words.join(" ").length > lines.join(" ").length && lines.length > 0) {
    lines[lines.length - 1] = lines[lines.length - 1].replace(/.{0,3}$/, "…");
  }
  return lines;
}

const formatCount = (n: number) => new Intl.NumberFormat("en").format(n);

const tierOfCode = (code: string, taxonomy: HarmTaxonomy): string => {
  const entry = taxonomy.codes[code];
  if (entry?.tier) return entry.tier;
  const m = /^T(\d+)/.exec(code);
  return m ? `tier${m[1]}` : "tier0";
};

type GraphNode = { id: string; label: string; value: number; tier: string; order: number };

function useTieredForceLayout(nodes: GraphNode[], edges: { source: string; target: string; weight: number }[], width: number) {
  return useMemo(() => {
    if (nodes.length === 0) return { nodes: [] as any[], links: [] as any[], radius: () => 6, colX: () => 0, height: VIEW_H };
    const colWidth = (width - MARGIN * 2) / TIER_ORDER.length;
    const colX = (tier: string) => MARGIN + colWidth * TIER_ORDER.indexOf(tier) + colWidth / 2;

    const byTier: Record<string, GraphNode[]> = {};
    nodes.forEach((n) => {
      (byTier[n.tier] = byTier[n.tier] || []).push(n);
    });
    TIER_ORDER.forEach((t) => (byTier[t] = byTier[t] || []));
    // Chronological within each tier: codebook order (T7a.1 → T7a.2 → … → T7c.2),
    // top to bottom, independent of node size.
    Object.values(byTier).forEach((list) => list.sort((a, b) => a.order - b.order));

    const nodeById = new Map();
    const simNodes: any[] = [];
    Object.entries(byTier).forEach(([tier, list]) => {
      const usableH = VIEW_H - TOP_MARGIN - 30;
      list.forEach((n, i) => {
        const y = TOP_MARGIN + ((i + 0.5) / Math.max(list.length, 1)) * usableH;
        const node = { ...n, tier, x: colX(tier), y, fx: colX(tier) };
        nodeById.set(n.id, node);
        simNodes.push(node);
      });
    });

    const simLinks = edges
      .map((e) => ({ source: nodeById.get(e.source), target: nodeById.get(e.target), weight: e.weight }))
      .filter((l) => l.source && l.target);

    const maxVal = Math.max(1, ...nodes.map((n) => n.value || 0));
    const radius = (n: any) => 5 + 22 * Math.sqrt(Math.max(0, n.value || 0) / maxVal);

    // Every node carries a title, so this step's vertical space must cover the
    // whole data set: the tallest tier decides the SVG height, computed up front
    // so the band below always clears the worst column target & ≥ MIN_GAP gaps.
    const sim = forceSimulation(simNodes)
      .force("y", forceY((d: any) => d.y).strength(0.04))
      .force(
        "link",
        forceLink(simLinks)
          .id((d: any) => d.id)
          .distance(30)
          .strength((l: any) => Math.min(0.3, 0.04 + (l.weight || 0) * 0.015))
      )
      .force("collide", forceCollide((d: any) => radius(d) + 2.5).strength(1).iterations(2))
      .force("charge", forceManyBody().strength(-8))
      .stop();

    for (let i = 0; i < 260; i++) sim.tick();

    // x is pinned per tier, so the sim only nudges nodes vertically and links
    // can reorder or overlap them. Re-lay each column deterministically in
    // codebook order (T7a.1 → T7a.2 → … → T7c.2), top to bottom. Every node
    // shows a title, so each reserves LABEL_H and columns share the leftover
    // height as an even inter-node gap (≥ MIN_GAP, capped at MAX_GAP). The
    // tallest tier sets the SVG height so no title can clip off the bottom.
    // The sim result is discarded for y.
    const labelTotalForTier = (list: any[]) => list.length * LABEL_H;
    const neededByTier = Object.values(byTier).map((list: any[]) => {
      if (list.length <= 1) return labelTotalForTier(list);
      const diam = list.reduce((s: number, n: any) => s + 2 * radius(n), 0);
      return diam + labelTotalForTier(list) + MIN_GAP * (list.length - 1);
    });
    const svgH = Math.max(VIEW_H, TOP_MARGIN + 16 + Math.ceil(Math.max(1, ...neededByTier)));

    const bandTop = TOP_MARGIN;
    const bandBottom = svgH - 16;
    const MAX_GAP = 44;
    Object.values(byTier).forEach((list) => {
      const colNodes = list
        .map((n) => nodeById.get(n.id))
        .filter(Boolean)
        .sort((a: any, b: any) => a.order - b.order);
      if (colNodes.length === 0) return;
      if (colNodes.length === 1) {
        colNodes[0].y = (bandTop + bandBottom) / 2;
        return;
      }

      const diameters = colNodes.reduce((s: number, n: any) => s + 2 * radius(n), 0);
      const labelTotal = labelTotalForTier(colNodes);
      const gap = Math.max(
        0,
        Math.min(MAX_GAP, (bandBottom - bandTop - diameters - labelTotal) / (colNodes.length - 1))
      );
      // centre the stack in the band (it may not use the full height once gap is capped)
      const usedH = diameters + labelTotal + gap * (colNodes.length - 1);
      let cursor = bandTop + Math.max(0, (bandBottom - bandTop - usedH) / 2);
      for (let i = 0; i < colNodes.length; i++) {
        const n = colNodes[i];
        n.y = cursor + radius(n);
        cursor += 2 * radius(n) + LABEL_H + gap;
      }
    });

    return { nodes: simNodes, links: simLinks, radius, colX, height: svgH };
  }, [nodes, edges, width]);
}

type HarmMechanismMapProps = {
  items: Item[];
  harmTaxonomy: HarmTaxonomy;
  title?: string;
  note?: string;
  onFilterTable?: (target: VizFilter) => void;
};

export const HarmMechanismMap = ({
  items,
  harmTaxonomy,
  title = TITLE,
  note = NOTE,
  onFilterTable,
}: HarmMechanismMapProps) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // A pinned selection owns the dimming: once pinned, hovering another node
  // must NOT re-shuffle the bright neighbourhood (that left the previously
  // selected node + its links lit). While unpinned, hover takes over.
  const activeId = pinnedId ?? hoveredId;

  // The eight tier columns should all fit inside the panel on any screen: the
  // map adapts its layout to the container width (capped at the 1040 design
  // width; floored at 640 so column circles/labels stay readable on phones,
  // where a horizontal nudge is acceptable).
  const [layoutWidth, setLayoutWidth] = useState(VIEW_W);
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      if (w > 0) setLayoutWidth(Math.max(MIN_W, Math.min(VIEW_W, w)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes: graphNodes, edges } = useMemo(() => {
    const freq: Record<string, number> = {};
    const edgeMap: Record<string, number> = {};
    for (const item of items) {
      if (item.isDuplicate) continue;
      const codes = [...new Set(item.harmCodes ?? [])];
      codes.forEach((c) => (freq[c] = (freq[c] || 0) + 1));
      for (let i = 0; i < codes.length; i++) {
        for (let j = i + 1; j < codes.length; j++) {
          const key = [codes[i], codes[j]].sort().join("|");
          edgeMap[key] = (edgeMap[key] || 0) + 1;
        }
      }
    }
    const nodes = Object.entries(harmTaxonomy.codes).map(([id, entry], i) => ({
      id,
      label: entry.label || id,
      value: freq[id] || 0,
      tier: tierOfCode(id, harmTaxonomy),
      order: entry.order ?? i, // codebook order (T…a.1, a.2, … b.1, …)
    }));
    const edges = Object.entries(edgeMap).map(([k, weight]) => {
      const [source, target] = k.split("|");
      return { source, target, weight };
    });
    return { nodes, edges };
  }, [items, harmTaxonomy]);

  const nodeById = useMemo(() => new Map(graphNodes.map((n) => [n.id, n])), [graphNodes]);

  const { nodes: laidOut, links, radius, colX, height: svgH } = useTieredForceLayout(graphNodes, edges, layoutWidth);

  const neighborSet = useMemo(() => {
    if (!activeId) return null;
    const s = new Set([activeId]);
    links.forEach((l) => {
      if (l.source.id === activeId) s.add(l.target.id);
      if (l.target.id === activeId) s.add(l.source.id);
    });
    return s;
  }, [activeId, links]);

  // Selecting a node (hover or pin) greys out everything that isn't the node
  // or one of its direct links, so the surrounding context stays readable.
  const dimSet = neighborSet;

  const visibleLinks = useMemo(() => {
    if (activeId) return links.filter((l) => l.source.id === activeId || l.target.id === activeId);
    return links.filter((l) => l.weight >= MIN_VISIBLE_WEIGHT);
  }, [links, activeId]);

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.target === e.currentTarget) resetViz();
  };

  // Clicking anywhere on the map background (outside a node) reverts the viz
  // to its load state: no selection, all nodes & titles at full strength.
  const resetViz = () => {
    setPinnedId(null);
    setHoveredId(null);
  };

  // The tooltip follows the node under the cursor (or the pinned one), so a
  // pin doesn't freeze the hover tip.
  const tooltipId = hoveredId ?? pinnedId;
  const tooltipNode = laidOut.find((n) => n.id === tooltipId);

  // Column width drives how many chars a label can hold before it would bleed
  // into the neighbouring tier's nodes; shrink the wrap budget as the panel
  // gets narrower so every title stays inside its own column.
  const colWidthW = (layoutWidth - MARGIN * 2) / TIER_ORDER.length;
  const tierHeaderChars = Math.max(5, Math.min(13, Math.floor((colWidthW - 8) / 6.4)));
  const labelChars = Math.max(7, Math.min(16, Math.floor((colWidthW - 12) / 5.4)));

  const legendGroups = useMemo(
    () =>
      TIER_ORDER.map((tier) => {
        const tierCodes = (harmTaxonomy.tiers[tier]?.codeIds ?? []).filter((c) => harmTaxonomy.codes[c]);
        return {
          color: TIER_COLORS[tier],
          label: TIER_SHORT[tier],
          codes: tierCodes,
          description: HARM_TIER_DESC[tier],
          subNames: tierCodes.map((c) => harmTaxonomy.codes[c].label).filter(Boolean),
        };
      }),
    [harmTaxonomy]
  );

  return (
    <VizPanelCard id="viz-harm-mechanism-map" title={title} highlights={["mechanisms", "harming democracy"]} note={note}>
      <div ref={wrapRef} className="relative mt-2 overflow-x-auto" style={{ minHeight: svgH }} onClick={resetViz}>
        <svg
          width={layoutWidth}
          height={svgH}
          viewBox={`0 0 ${layoutWidth} ${svgH}`}
          style={{ display: "block", margin: "0 auto" }}
          onClick={handleSvgClick}
          role="img"
          aria-label={TITLE}
        >
          <g>
            {TIER_ORDER.map((tier, i) => {
              const x = colX(tier);
              return (
                <g key={tier}>
                  {i > 0 && (
                    <line
                      x1={x - (VIEW_W - MARGIN * 2) / TIER_ORDER.length / 2}
                      y1={30}
                      x2={x - (VIEW_W - MARGIN * 2) / TIER_ORDER.length / 2}
                      y2={VIEW_H - 10}
                      stroke="#D6D6CA"
                      strokeWidth={1}
                    />
                  )}
                  <text x={x} y={28} textAnchor="middle" fontSize={19} fontWeight={800} fill={TIER_COLORS[tier]}>
                    {TIER_CODE[tier as keyof typeof TIER_CODE]}
                  </text>
                  <text x={x} y={46} textAnchor="middle" fontSize={11} fontWeight={600} fill="#5C5C52">
                    {wrapLabelLines(TIER_SHORT[tier], tierHeaderChars, 2).map((line, li) => (
                      <tspan key={li} x={x} dy={li === 0 ? 0 : 12}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              );
            })}

            {visibleLinks.map((l, i) => (
              <line
                key={i}
                x1={l.source.x}
                y1={l.source.y}
                x2={l.target.x}
                y2={l.target.y}
                stroke={activeId ? "rgba(34, 32, 26, 0.35)" : "rgba(34, 32, 26, 0.2)"}
                strokeWidth={Math.min(5, 0.5 + l.weight * 0.4)}
              />
            ))}

            {laidOut.map((n) => {
              const r = radius(n);
              const dim = dimSet && !dimSet.has(n.id);
              const isActive = activeId === n.id;
              const isFocus = focusedId === n.id;
              return (
                <g key={n.id}>
                  {isFocus && <circle cx={n.x} cy={n.y} r={r + 3} fill="none" stroke="#963735" strokeWidth={2} />}
                  <circle
                    className="viz-node"
                    cx={n.x}
                    cy={n.y}
                    r={r}
                    fill={withAlpha(TIER_COLORS[n.tier] ?? "#5C5C52", isActive ? 0.22 : 0.14)}
                    opacity={dim ? 0.15 : 1}
                    stroke={isActive ? "#1a1a17" : (TIER_COLORS[n.tier] ?? "#5C5C52")}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    tabIndex={0}
                    role="button"
                    aria-pressed={!!pinnedId && pinnedId === n.id}
                    aria-label={`${n.id} ${n.label}, ${formatCount(n.value)} entries coded`}
                    style={{ transition: "opacity 120ms ease, stroke-width 120ms ease", cursor: "pointer" }}
                    onMouseEnter={() => setHoveredId(n.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onFocus={() => setFocusedId(n.id)}
                    onBlur={() => setFocusedId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPinnedId((p) => (p === n.id ? null : n.id));
                      setHoveredId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setPinnedId((p) => (p === n.id ? null : n.id));
                        setHoveredId(null);
                      }
                    }}
                  />
                </g>
              );
            })}

            {laidOut.map((n) => {
              const r = radius(n);
              const dim = dimSet && !dimSet.has(n.id);
              const isActive = activeId === n.id;
              const meta = nodeById.get(n.id);
              return (
                <text
                  key={`label-${n.id}`}
                  x={n.x}
                  y={n.y + r + 11}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isActive ? 800 : 600}
                  fill={dim ? "rgba(34, 32, 26, 0.25)" : "#22201a"}
                  stroke="#ffffff"
                  strokeWidth={2.5}
                  paintOrder="stroke"
                  style={{ pointerEvents: "none" }}
                >
                  {wrapLabelLines(meta?.label ?? n.id, labelChars, 2).map((line, i) => (
                    <tspan key={i} x={n.x} dy={i === 0 ? 0 : 11}>
                      {line}
                    </tspan>
                  ))}
                </text>
              );
            })}
          </g>
        </svg>

        {tooltipNode && (
          <VizTooltip
            variant="dark"
            title={`${tooltipNode.id} – ${nodeById.get(tooltipNode.id)?.label ?? tooltipNode.id}`}
            description={harmTaxonomy.codes[tooltipNode.id]?.description}
            count={`${formatCount(tooltipNode.value)} entries coded`}
            left={10}
            top={10}
          />
        )}
      </div>
      <p
        style={{
          fontSize: 12.5,
          color: "#5C5C52",
          lineHeight: 1.55,
          margin: "16px 0 0",
        }}
      >
        The harm mechanisms are arranged in eight tiers by causal depth, running from the conditions
        under which AI systems are built and released (T0), through their capabilities (T1–T2),
        outputs and deployment (T4–T5), to the ways they are used and the cumulative effects on
        individuals and society (T6–T7).
      </p>
      <VizLegend groups={legendGroups} activeCode={activeId} showCodes={false} />
      {pinnedId && onFilterTable && (() => {
        const target: VizFilter = {
          key: "harm",
          codes: [pinnedId],
          label: harmTaxonomy.codes[pinnedId]?.label ?? pinnedId,
        };
        return (
          <SelectAsFilter
            target={target}
            onApply={onFilterTable}
            onDismiss={() => setPinnedId(null)}
          />
        );
      })()}
    </VizPanelCard>
  );
};