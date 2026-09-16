"use client";

import { useEffect, useRef, useState } from "react";

export type LegendTipData = {
  title: string;
  description?: string;
  lines?: string[];
};

// Shared "hover box" for the carousel legends: on hovering a head category
// (pillar / tier / benefit cluster) a tip shows the codebook's short
// description plus the full list of the sub-code NAMES it groups (no IDs).
// Rendered position:fixed so card `overflow:hidden` never clips it.
//
// The tip is interactive (pointer-events:auto) so a long sub-code list can be
// wheel-scrolled. It stays open only while the cursor is inside the hovered
// legend box (anchor) OR the tip itself – a global pointer-follower closes it
// the moment the cursor leaves both, so it never feels sticky but always
// reachable/scrollable.
export const useLegendTip = () => {
  const [tip, setTip] = useState<LegendTipData | null>(null);
  const [pos, setPos] = useState({ left: 0, top: 0, above: true });

  // The legend box the tip was opened from (viewport coords), so the pointer
  // follower can treat it as part of the open hot-zone.
  const anchorRef = useRef<DOMRect | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const TIP_WIDTH = 240;

  // "auto" (default) drops the tip above/below the anchor, left-aligned to
  // it – right for a wide legend row, but for a narrow chip stacked among
  // siblings (e.g. a democracy-aspect pill), dropping above/below covers the
  // chip itself and the next one in the stack. "right" instead places the
  // tip beside the anchor, at its own vertical level, so it never overlaps
  // any pill in that column.
  //
  // `bounds`, when given (typically the panel card's own rect), clamps the
  // tip inside that container instead of the full viewport – otherwise a tip
  // opened near a panel's edge can spill out over neighbouring page content.
  const open = (data: LegendTipData, rect: DOMRect, placement: "auto" | "right" = "auto", bounds?: DOMRect) => {
    anchorRef.current = rect;
    setTip(data);
    const pad = 8;
    const minX = bounds ? bounds.left + pad : pad;
    const maxX = bounds ? bounds.right - pad : window.innerWidth - pad;
    const minY = bounds ? bounds.top + pad : pad;
    const maxY = bounds ? bounds.bottom - pad : window.innerHeight - pad;
    // Estimated tip height for clamping purposes – the real height is only
    // known after render, but title+description (no sub-code list) reliably
    // lands under ~110px, which is all "right" placement needs to stay tidy.
    const estH = data.lines?.length ? 220 : 110;
    if (placement === "right") {
      // These anchors are often near the right edge of their container (the
      // rightmost column of a diagram) – clamping a fixed "rect.right + gap"
      // into the visible width there just pulls the tip back over the chip
      // it's meant to clear. Flip to the LEFT of the anchor instead whenever
      // there isn't genuinely enough room on the right.
      const gap = 10;
      const roomRight = maxX - rect.right - gap;
      const left =
        roomRight >= TIP_WIDTH
          ? rect.right + gap
          : Math.max(minX, rect.left - gap - TIP_WIDTH);
      const top = Math.max(minY, Math.min(rect.top, maxY - estH));
      setPos({ left, top, above: false });
      return;
    }
    const above = rect.top > minY + 240;
    const left = Math.max(minX, Math.min(rect.left, maxX - TIP_WIDTH));
    setPos({ left, top: above ? rect.top - 10 : rect.bottom + 10, above });
  };

  const close = () => {
    setTip(null);
    setPos({ left: 0, top: 0, above: true });
    anchorRef.current = null;
  };

  // Keep the tip open while the pointer is over the tooltip or the legend box
  // it was opened from (both slightly padded so the tiny 10px gap between them
  // doesn't blink). Leaving both closes it immediately.
  useEffect(() => {
    if (!tip) return;
    const onMove = (e: PointerEvent) => {
      const el = tipRef.current;
      const anchor = anchorRef.current;
      if (!el || !anchor) return;
      const t = el.getBoundingClientRect();
      const pad = 16;
      const inside = (r: DOMRect) =>
        e.clientX >= r.left - pad &&
        e.clientX <= r.right + pad &&
        e.clientY >= r.top - pad &&
        e.clientY <= r.bottom + pad;
      if (!inside(t) && !inside(anchor)) close();
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tip]);

  const tipNode = tip ? (
    <div
      ref={tipRef}
      role="tooltip"
      style={{
        position: "fixed",
        left: pos.left,
        top: pos.top,
        transform: pos.above ? "translateY(-100%)" : undefined,
        width: TIP_WIDTH,
        pointerEvents: "auto",
        zIndex: 60,
        background: "#F4F4EA",
        color: "#1a1a17",
        border: "0.5px solid rgba(26, 26, 23, 0.6)",
        borderRadius: 10,
        boxShadow: "0 14px 34px rgba(26, 26, 23, 0.18)",
        padding: "9px 12px",
        textAlign: "left",
      }}
    >
      {/* Sized down from the original 11/12.5px – next to the diagram's own
          10-11px labels those read oversized, more like a heading than a
          tooltip. */}
      <div
        style={{
          fontSize: 9.5,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "rgba(26,26,23,0.55)",
          marginBottom: 3,
        }}
      >
        {tip.title}
      </div>
      {tip.description && (
        <div style={{ fontSize: 10.5, lineHeight: 1.45, color: "rgba(26,26,23,0.9)" }}>{tip.description}</div>
      )}
      {tip.lines && tip.lines.length > 0 && (
        <div style={{ marginTop: 7, borderTop: "0.5px solid rgba(26,26,23,0.2)", paddingTop: 6 }}>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(26,26,23,0.55)",
              marginBottom: 4,
            }}
          >
            Sub-codes
          </div>
          <ul
            style={{
              margin: 0,
              padding: 0,
              paddingRight: 4,
              listStyle: "none",
              maxHeight: 200,
              overflowY: "auto",
              overscrollBehavior: "contain",
              display: "grid",
              gridTemplateColumns: "repeat(1, 1fr)",
              gap: 3,
            }}
          >
            {tip.lines.map((l) => (
              <li key={l} style={{ fontSize: 10.5, lineHeight: 1.3, color: "rgba(26,26,23,0.85)", display: "flex", gap: 6 }}>
                <span style={{ color: "rgba(26,26,23,0.4)", flexShrink: 0 }}>•</span>
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : null;

  return { tipNode, open, close };
};