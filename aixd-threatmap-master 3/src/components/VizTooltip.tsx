"use client";

// Shared tooltip for all viz panels (AspectBubbleMap, HarmMechanismMap,
// PathwayBandsMap). Field order is fixed and never reversed: title →
// description → count. Two variants:
//  - "ecru" (default): editorial, warm-ink, per the visualization style guide.
//  - "dark": matches the client's mock tooltip (black field, white type).
// The eyebrow line carries the node's container (pillar / tier / group) label.

type VizTooltipProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  count?: string;
  left: number;
  top: number;
  variant?: "ecru" | "dark";
};

export const VizTooltip = ({
  eyebrow,
  title,
  description,
  count,
  left,
  top,
  variant = "ecru",
}: VizTooltipProps) => {
  const dark = variant === "dark";
  return (
    <div
      role="tooltip"
      style={{
        position: "absolute",
        left,
        top,
        maxWidth: dark ? 220 : 264,
        pointerEvents: "none",
        zIndex: 40,
        background: dark ? "#1a1a17" : "#F4F4EA",
        color: dark ? "#fff" : "#1a1a17",
        border: dark ? "none" : "0.5px solid rgba(26, 26, 23, 0.6)",
        borderRadius: dark ? 8 : 2,
        boxShadow: dark ? "0 8px 24px rgba(26, 26, 23, 0.3)" : "0 2px 14px rgba(26, 26, 23, 0.08)",
        padding: dark ? "8px 12px" : "10px 12px",
        fontSize: dark ? 12 : undefined,
        textAlign: "left",
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: dark ? "rgba(255,255,255,0.65)" : "rgba(26, 26, 23, 0.55)",
            marginBottom: 4,
          }}
        >
          {eyebrow}
        </div>
      )}
      <div style={{ fontSize: dark ? 12 : 13, fontWeight: 700, lineHeight: 1.35 }}>{title}</div>
      {description && (
        <div
          style={{
            fontSize: 12,
            lineHeight: dark ? 1.45 : 1.45,
            marginTop: 6,
            color: dark ? "rgba(255,255,255,0.85)" : "rgba(26, 26, 23, 0.85)",
          }}
        >
          {description}
        </div>
      )}
      {count && (
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginTop: 8,
            color: dark ? "rgba(255,255,255,0.75)" : "rgba(26, 26, 23, 0.75)",
          }}
        >
          {count}
        </div>
      )}
    </div>
  );
};