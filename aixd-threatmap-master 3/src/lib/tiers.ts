"use client";

// Tier colour map and ordered list, verbatim from the client mock (and the
// live site's codebook hierarchy). Keyed by the short T0–T7 form used by the
// two colleague-authored maps (PathwayBandsMap, BipartiteMorphMap).
export const TIER_COLORS: Record<string, string> = {
  T0: "#963735",
  T1: "#4A5FA6",
  T2: "#7BA8D9",
  T3: "#2E9CA8",
  T4: "#1E93A8",
  T5: "#F97C2B",
  T6: "#C6402F",
  T7: "#4E5A63",
};

export const TIER_ORDER = ["T0", "T1", "T2", "T3", "T4", "T5", "T6", "T7"];