"use client";

import { SelectAsFilter } from "@/components/SelectAsFilter";
import { VizPanelCard } from "@/components/VizPanelCard";
import { VizZoomControls } from "@/components/VizZoomControls";
import { useLegendTip } from "@/components/LegendTip";
import {
  buildBenefitView,
  HM2_BEN_COLOR,
  HM2_BEN_NAME,
  hm2BenOf,
  tierOf,
  type BipState,
} from "@/lib/bipartite";
import { HM2_TIER_SHORT } from "@/lib/pathways";
import { TIER_COLORS } from "@/lib/tiers";
import { HARM_TIER_DESC, tierKeyOf } from "@/lib/legendInfo";
import { useSvgPanZoom } from "@/lib/useSvgPanZoom";
import { accessibleLabelOf, mixInk, withAlpha } from "@/lib/codes";
import type { BenefitTaxonomy, HarmTaxonomy } from "@/lib/types";
import type { VizFilter } from "@/lib/types";
import { useMemo, useState } from "react";

const VIEW_W = 1040;
// The canvas matches this panel's own content: the band fills TOP..BOT plus a
// small bottom margin – no forced height that would spread the rows out and
// leave dead space inside the diagram.
const VIEW_H = 480;

// Geometry verbatim from the client mock (docs/2_Claude Code of Mock Website_UPDATED.jsx),
// except BOT – extended from 392 to fill the taller 480px canvas (was tuned to
// a 400px-tall layout; row heights derive from BOT - TOP, so this is the only
// constant that needs to move for content to fill the new height).
const LX = 34;
const LW = 274;
const RX = 676;
const RW = 274;
const TOP = 54;
const BOT = 460;

const TITLE = "Which pro-democracy activities are frequently linked to which harm mechanisms?";
const FOOTNOTE =
  "* as mentioned in the sources (the data collected does not include information on which threats and mitigations are more impactful)";

const fmt = (n: number) => new Intl.NumberFormat("en").format(n);

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

interface BoxEl {
  c: string;
  label: string;
  code: string;
  n: number;
  color: string;
  ink: string;
  act: string | null;
  t?: string;
  b?: string;
}

export const BipartiteMorphMap = ({
  onFilterTable,
  harmTaxonomy,
  benefitTaxonomy,
}: {
  onFilterTable?: (target: VizFilter) => void;
  harmTaxonomy?: HarmTaxonomy;
  benefitTaxonomy?: BenefitTaxonomy;
}) => {
  const [view, setView] = useState<BipState>({ type: "overview" });
  const pz = useSvgPanZoom(0.5, 4);
  const { tipNode, open, close } = useLegendTip();

  const v = useMemo(
    () => buildBenefitView(view, harmTaxonomy, benefitTaxonomy),
    [view, harmTaxonomy, benefitTaxonomy]
  );

  const blabel = (c: string) =>
    accessibleLabelOf(c, harmTaxonomy, benefitTaxonomy) ?? HM2_BEN_NAME[c] ?? c;

  const changeView = (nv: BipState) => {
    setView(nv);
    pz.reset();
  };

  const note = view.type === "overview" ? v.note : "• " + v.note;

  const svgBody = useMemo(() => {
    const lH = (BOT - TOP) / Math.max(v.left.length, 1);
    const rH = (BOT - TOP) / Math.max(v.right.length, 1);
    const lY: Record<string, number> = {};
    const rY: Record<string, number> = {};
    v.left.forEach((d, i) => (lY[d.c] = TOP + lH * i + lH / 2));
    v.right.forEach((d, i) => (rY[d.c] = TOP + rH * i + rH / 2));
    const lBox = Math.min(34, lH - 5);
    const rBox = Math.min(34, rH - 5);

    const renderBox = (d: BoxEl, x: number, w: number, y: number, h: number) => {
      const all = wrapWords(d.label, h >= 20 ? 24 : 30);
      const lines = all.slice(0, h >= 20 ? 2 : 1);
      const trunc = all.length > lines.length;
      // Pro-democracy activity boxes (B-codes) drop the code label per client
      // request – only the harm-tier boxes (T-codes) keep theirs. The name
      // text shifts left to fill the gap where the code used to sit.
      const isActivity = d.code.startsWith("B");
      const tx = isActivity ? x + 9 : x + 9 + d.code.length * 5.6 + 8;
      const ink = mixInk(d.color, 0.25);
      const activate = () => {
        if (d.act === "tier") changeView({ type: "tier", t: d.t ?? d.c });
        else if (d.act === "ben") changeView({ type: "ben", b: d.b ?? d.c });
        else if (d.act === "edge")
          changeView({ type: "edge", t: d.t ?? d.c, b: d.b ?? d.c });
      };
      return (
        <g
          key={d.c}
          className={d.act ? "viz-node" : undefined}
          style={d.act ? { cursor: "pointer" } : undefined}
          tabIndex={d.act ? 0 : undefined}
          role={d.act ? "button" : undefined}
          aria-label={d.act ? `${d.code} ${d.label}, ${fmt(d.n)} entries` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (pz.wasJustDragged()) return;
            activate();
          }}
          onKeyDown={(e) => {
            if (!d.act) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activate();
            }
          }}
        >
          <rect x={x} y={y - h / 2} width={w} height={h} rx={9} fill={withAlpha(d.color, 0.16)} stroke={withAlpha(d.color, 0.55)} strokeWidth={1.5} />
          {!isActivity && (
            <text x={x + 9} y={y} dominantBaseline="central" fontSize={10} fontWeight={800} fill={ink}>
              {d.code}
            </text>
          )}
          {lines.length === 1 ? (
            <text x={tx} y={y} dominantBaseline="central" fontSize={10} fontWeight={600} fill={ink}>
              {lines[0]}
              {trunc ? "…" : ""}
            </text>
          ) : (
            <>
              <text x={tx} y={y - 5} dominantBaseline="central" fontSize={10} fontWeight={600} fill={ink}>
                {lines[0]}
              </text>
              <text x={tx} y={y + 5.5} dominantBaseline="central" fontSize={10} fontWeight={600} fill={ink}>
                {lines[1]}
                {trunc ? "…" : ""}
              </text>
            </>
          )}
          <text x={x + w - 8} y={y} textAnchor="end" dominantBaseline="central" fontSize={10} fontWeight={700} fill={ink}>
            {fmt(d.n)}
          </text>
        </g>
      );
    };

    const links = v.links.map((k) => {
      const y1 = lY[k.l];
      const y2 = rY[k.r];
      if (y1 == null || y2 == null) return null;
      const x1 = LX + LW;
      const x2 = RX;
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      const activateLink = () => {
        if (k.act === "edge") changeView({ type: "edge", t: k.t ?? k.l, b: k.b ?? k.r });
      };
      return (
        <g
          key={`${k.l}-${k.r}`}
          className={k.act ? "viz-node" : undefined}
          style={k.act ? { cursor: "pointer" } : undefined}
          tabIndex={k.act ? 0 : undefined}
          role={k.act ? "button" : undefined}
          aria-label={k.act ? `Link, ${fmt(k.n)} entries – view detail` : undefined}
          onClick={(e) => {
            e.stopPropagation();
            if (pz.wasJustDragged()) return;
            activateLink();
          }}
          onKeyDown={(e) => {
            if (!k.act) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              activateLink();
            }
          }}
        >
          <path d={`M${x1} ${y1} C ${x1 + 80} ${y1}, ${x2 - 80} ${y2}, ${x2} ${y2}`} fill="none" stroke={k.color} strokeWidth={(0.7 + k.n * 0.3).toFixed(1)} opacity={0.4} />
          {/* Mention-count label: only in a drill-down view (clicked into a
              connection) – the overview has too many crossing links for the
              numbers to read cleanly, so they're suppressed there. */}
          {view.type !== "overview" && (
            <text x={mx} y={my - 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#22201a" stroke="#ffffff" strokeWidth={2.5} paintOrder="stroke">
              {fmt(k.n)}
            </text>
          )}
        </g>
      );
    });

    return (
      <>
        <text x={LX + LW / 2} y={30} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#1a1a17">
          {v.headL}
        </text>
        <text x={RX + RW / 2} y={30} textAnchor="middle" fontSize={12.5} fontWeight={800} fill="#1a1a17">
          {v.headR}
        </text>
        <line x1={LX} y1={40} x2={LX + LW} y2={40} stroke="#D6D6CA" strokeWidth={1} />
        <line x1={RX} y1={40} x2={RX + RW} y2={40} stroke="#D6D6CA" strokeWidth={1} />
        {links}
        {v.left.map((d, i) => renderBox(d, LX, LW, TOP + lH * i + lH / 2, lBox))}
        {v.right.map((d, i) => renderBox(d, RX, RW, TOP + rH * i + rH / 2, rBox))}
      </>
    );
  }, [v]);

  const legendItems = useMemo(() => {
    const tiersShown = [...new Set(v.left.map((d) => tierOf(d.c) || d.c))].sort();
    const bensShown = [...new Set(v.right.map((d) => hm2BenOf(d.c)))].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
    const codesL: Record<string, string[]> = {};
    const codesR: Record<string, string[]> = {};
    v.left.forEach((d) => {
      const k = tierOf(d.c) || d.c;
      (codesL[k] = codesL[k] || []).push(d.c);
    });
    v.right.forEach((d) => {
      const k = hm2BenOf(d.c);
      (codesR[k] = codesR[k] || []).push(d.c);
    });
    const items: { key: string; color: string; label: string; sub: string; description?: string; lines?: string[] }[] = [];
    tiersShown.forEach((t) => {
      const sub = (codesL[t] || []).filter((c) => c !== t);
      const tierCodes = (harmTaxonomy?.tiers[tierKeyOf(t)]?.codeIds ?? []).filter((c) => harmTaxonomy?.codes[c]);
      items.push({
        key: "t-" + t,
        color: TIER_COLORS[t],
        label: `${t} – ${HM2_TIER_SHORT[t]}`,
        sub: sub.join(", "),
        description: HARM_TIER_DESC[tierKeyOf(t)],
        lines: tierCodes.map((c) => harmTaxonomy?.codes[c]?.label).filter((x): x is string => !!x),
      });
    });
    bensShown.forEach((b) => {
      const sub = (codesR[b] || []).filter((c) => c !== b);
      const groupCodes = (benefitTaxonomy?.groups[b]?.codeIds ?? []).filter((c) => benefitTaxonomy?.codes[c]);
      items.push({
        key: "b-" + b,
        color: HM2_BEN_COLOR[b],
        // Client request (2026-09-14): the legend drops the benefit IDs
        // (B1/B2…); harm-tier IDs (T1/T2…) are kept on the tiers side because
        // they're needed to read the tiered system.
        label: blabel(b),
        sub: sub.join(", "),
        description: benefitTaxonomy?.codes[b]?.description,
        lines: groupCodes.map((c) => benefitTaxonomy?.codes[c]?.label ?? benefitTaxonomy?.codes[c]?.name).filter((x): x is string => !!x),
      });
    });
    return items;
  }, [v, harmTaxonomy, benefitTaxonomy]);

  return (
    <VizPanelCard
      id="viz-bipartite-morph-map"
      title={TITLE}
      highlights={["pro-democracy activities", "harm mechanisms"]}
      note={FOOTNOTE}
      actions={
        view.type !== "overview" && (
          <button
            onClick={() => changeView({ type: "overview" })}
            style={{
              flexShrink: 0,
              borderRadius: 999,
              border: "1px solid #D6D6CA",
              background: "#fff",
              color: "#1a1a17",
              fontSize: 12,
              fontWeight: 700,
              padding: "6px 13px",
              cursor: "pointer",
            }}
          >
            ‹ Back to overview
          </button>
        )
      }
    >
      <div className="mt-2 overflow-x-auto">
        <div className="relative" style={{ minHeight: VIEW_H }}>
          <svg
            width="100%"
            height={VIEW_H}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            style={{ display: "block", minWidth: VIEW_W, cursor: pz.isDragging ? "grabbing" : "grab", touchAction: "none" }}
            onWheel={pz.onWheel}
            onMouseDown={pz.onMouseDown}
            onMouseMove={pz.onMouseMove}
            onMouseUp={pz.onMouseUp}
            onMouseLeave={pz.onMouseUp}
            role="img"
            aria-label="Which pro-democracy activities are frequently linked to which harm mechanisms? Bipartite diagram; click a box or link to unfold the detail."
          >
            <g transform={`translate(${pz.panZoom.x}, ${pz.panZoom.y}) scale(${pz.panZoom.scale})`}>{svgBody}</g>
          </svg>

          <VizZoomControls
            onZoomIn={() => pz.zoomBy(1.25)}
            onZoomOut={() => pz.zoomBy(0.8)}
            onReset={() => {
              pz.reset();
              setView({ type: "overview" });
            }}
          />
        </div>

        {note && <div style={{ marginTop: 14, fontSize: 12.5, color: "#5C5C52", lineHeight: 1.55 }}>{note}</div>}
      </div>

      {view.type === "tier" && onFilterTable && (() => {
        const target: VizFilter = { key: "harm", codes: [view.t], label: HM2_TIER_SHORT[view.t] ?? view.t };
        return <SelectAsFilter target={target} onApply={onFilterTable} onDismiss={() => setView({ type: "overview" })} />;
      })()}
      {view.type === "ben" && onFilterTable && (() => {
        const target: VizFilter = { key: "benefit", codes: [view.b], label: blabel(view.b) };
        return <SelectAsFilter target={target} onApply={onFilterTable} onDismiss={() => setView({ type: "overview" })} />;
      })()}
      {view.type === "edge" && onFilterTable && (() => {
        const harmTarget: VizFilter = { key: "harm", codes: [view.t], label: HM2_TIER_SHORT[view.t] ?? view.t };
        const benefitTarget: VizFilter = { key: "benefit", codes: [view.b], label: blabel(view.b) };
        return (
          <div className="flex flex-wrap gap-2">
            <SelectAsFilter target={harmTarget} onApply={onFilterTable} onDismiss={() => setView({ type: "overview" })} />
            <SelectAsFilter target={benefitTarget} onApply={onFilterTable} onDismiss={() => setView({ type: "overview" })} />
          </div>
        );
      })()}

      <p
        style={{
          fontSize: 12.5,
          color: "#5C5C52",
          lineHeight: 1.55,
          margin: "16px 0 0",
        }}
      >
        Pathways are recurring sequences of harm mechanisms that our sources describe together,
        running from an enabling condition or capability, through what is done with it, to a
        downstream effect on democracy. The visualisation shows each pathway as a chain across the
        eight tiers, with the number of sources describing each step and the aspects of democracy it
        affects.
      </p>

      {(() => {
        // Split into two labeled sections (harm tiers / pro-democracy
        // activities) instead of one flat wrapped row, so the reader can see
        // where one group ends and the other begins – matches the
        // "Democracy aspects" header pattern used by the Pathways panel.
        const tierItems = legendItems.filter((i) => i.key.startsWith("t-"));
        const benItems = legendItems.filter((i) => i.key.startsWith("b-"));

        const renderLegendItem = (item: (typeof legendItems)[number]) => {
          // The active drill-down view (tier / benefit / edge) tints its
          // matching legend row so the reader sees what's filterable.
          const isActive =
            (view.type === "tier" && item.key === `t-${view.t}`) ||
            (view.type === "ben" && item.key === `b-${view.b}`) ||
            (view.type === "edge" && (item.key === `t-${view.t}` || item.key === `b-${view.b}`));
          const actionable = !!item.description || (item.lines ?? []).length > 0;
          return (
            <div
              key={item.key}
              tabIndex={actionable ? 0 : undefined}
              role={actionable ? "button" : undefined}
              aria-label={
                actionable
                  ? `${item.label} – ${item.description ?? "Sub-codes"}`
                  : undefined
              }
              onMouseEnter={
                actionable
                  ? (e) =>
                      open(
                        { title: item.label, description: item.description, lines: item.lines },
                        e.currentTarget.getBoundingClientRect()
                      )
                  : undefined
              }
              onFocus={
                actionable
                  ? (e) =>
                      open(
                        { title: item.label, description: item.description, lines: item.lines },
                        e.currentTarget.getBoundingClientRect()
                      )
                  : undefined
              }
              onBlur={actionable ? close : undefined}
              style={{
                fontSize: 10.5,
                color: "#5C5C52",
                maxWidth: 190,
                lineHeight: 1.5,
                borderRadius: 8,
                padding: "4px 8px",
                margin: "-4px -8px",
                cursor: actionable ? "help" : "default",
                background: isActive ? withAlpha(item.color, 0.16) : "transparent",
                outline: isActive ? `1px solid ${withAlpha(item.color, 0.5)}` : "none",
                outlineOffset: "-1px",
                transition: "background 140ms ease, outline-color 140ms ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 5, fontWeight: 700, color: "#1a1a17", marginBottom: 2 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: item.color, flexShrink: 0, marginTop: 3 }} />
                <span>{item.label}</span>
              </div>
              {item.sub && <div>{item.sub}</div>}
            </div>
          );
        };

        const sectionHeader = (label: string) => (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 800,
              color: "#1a1a17",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {label}
          </span>
        );

        return (
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #D6D6CA" }}>
            {sectionHeader("Harm tiers")}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 20px", marginTop: 6 }}>
              {tierItems.map(renderLegendItem)}
            </div>
            <div style={{ marginTop: 14 }}>
              {sectionHeader("Pro-democracy activities")}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "14px 20px", marginTop: 6 }}>
                {benItems.map(renderLegendItem)}
              </div>
            </div>
          </div>
        );
      })()}
      {tipNode}
    </VizPanelCard>
  );
};