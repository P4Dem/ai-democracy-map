// Centralised pillar color configuration — edit here to update both chips and dialog.
// Pillars 3 (Blue) and 4 (Lime) use light P4D accents as bg; derived dark text ensures contrast.

export type PillarColorConfig = {
  // Aspect chip badge
  chipBg: string;
  chipText: string;
  // Aspect dialog header
  dialogHeaderBg: string;
  dialogAccentBar: string;   // thin decorative bar above title
  dialogBadgeBg: string;     // code pill background (e.g. "2.1")
  dialogBadgeText: string;   // code pill text
};

export const PILLAR_COLORS: Record<string, PillarColorConfig> = {
  "1": {
    // P4D Brick — Citizenship, Law and Rights
    chipBg:          "rgba(150,55,55,0.12)",
    chipText:        "#963737",
    dialogHeaderBg:  "rgba(150,55,55,0.08)",
    dialogAccentBar: "#963737",
    dialogBadgeBg:   "rgba(150,55,55,0.15)",
    dialogBadgeText: "#963737",
  },
  "2": {
    // P4D Grassroot — Representative and Accountable Government
    chipBg:          "rgba(0,177,64,0.12)",
    chipText:        "#00B140",
    dialogHeaderBg:  "rgba(0,177,64,0.08)",
    dialogAccentBar: "#00B140",
    dialogBadgeBg:   "rgba(0,177,64,0.15)",
    dialogBadgeText: "#007a2f",
  },
  "3": {
    // P4D Blue — Civil Society and Popular Participation
    chipBg:          "rgba(153,194,255,0.25)",
    chipText:        "#1a5c9a",
    dialogHeaderBg:  "rgba(153,194,255,0.18)",
    dialogAccentBar: "#99C2FF",
    dialogBadgeBg:   "rgba(153,194,255,0.35)",
    dialogBadgeText: "#1a5c9a",
  },
  "4": {
    // P4D Lime — Democratic Governance of AI
    chipBg:          "rgba(217,236,68,0.22)",
    chipText:        "#5a5a00",
    dialogHeaderBg:  "rgba(217,236,68,0.15)",
    dialogAccentBar: "#c4cb00",
    dialogBadgeBg:   "rgba(217,236,68,0.35)",
    dialogBadgeText: "#5a5a00",
  },
};

export const DEFAULT_PILLAR_COLOR: PillarColorConfig = {
  chipBg:          "rgba(0,0,0,0.06)",
  chipText:        "#374151",
  dialogHeaderBg:  "rgba(0,0,0,0.03)",
  dialogAccentBar: "#D1D5DB",
  dialogBadgeBg:   "rgba(0,0,0,0.08)",
  dialogBadgeText: "#374151",
};

export const getPillarColor = (code: string): PillarColorConfig =>
  PILLAR_COLORS[code.split(".")[0]] ?? DEFAULT_PILLAR_COLOR;
