"use client";

import type { BenefitTaxonomy, HarmTaxonomy } from "@/lib/types";

const tierOf = (code: string) => {
  const m = /^T(\d+)/.exec(code);
  return m ? "T" + m[1] : null;
};

const benefitClusterOf = (code: string, taxonomy?: BenefitTaxonomy) => {
  const meta = taxonomy?.codes?.[code];
  return meta?.parent || code;
};

const harmNameOf = (code: string, taxonomy?: HarmTaxonomy) =>
  taxonomy?.codes?.[code]?.label ?? code;

const benefitNameOf = (code: string, taxonomy?: BenefitTaxonomy) =>
  taxonomy?.codes?.[code]?.label ?? taxonomy?.codes?.[code]?.name ?? code;

// Canonical public-facing label from the taxonomy codebooks ("accessible label"
// column 7 of CODEBOOKS), i.e. the readable name used in the table, expanded
// rows and filters. The legacy mock label maps (HM2_L / HM2_BEN_NAME) hold a
// mix of old sub-cluster names and new accessible ones – all map panels must
// resolve through this first so nothing stale leaks out.
const accessibleLabelOf = (
  code: string,
  harmTaxonomy?: HarmTaxonomy,
  benefitTaxonomy?: BenefitTaxonomy
): string | undefined =>
  harmTaxonomy?.codes?.[code]?.label ?? benefitTaxonomy?.codes?.[code]?.label;

// Brand tokens (globals.css) where one fits the cluster; the remaining slots
// use a hand-picked categorical scale (brand only defines ~4 semantic hues).
const BENEFIT_CLUSTER_COLORS: Record<string, string> = {
  B1: "#D9E021", // p4d lime
  B2: "#FFB3E6", // p4d rose
  B3: "#92C2FF", // p4d blue
  B4: "#00B140", // p4d grassroot
  B5: "#4E5A63",
  B6: "#963735", // p4d brick
  B7: "#FF8E32", // p4d orange
  B9: "#1E93A8",
  B10: "#4A5FA6",
  B11: "#7B4B8A",
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const withAlpha = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const mixInk = (hex: string, amount: number) => {
  const [r, g, b] = hexToRgb(hex);
  const t = amount;
  const m = (v: number) => Math.round(v + (0 - v) * t).toString(16).padStart(2, "0");
  return `#${m(r)}${m(g)}${m(b)}`;
};

export {
  tierOf,
  benefitClusterOf,
  benefitNameOf,
  harmNameOf,
  accessibleLabelOf,
  BENEFIT_CLUSTER_COLORS,
  withAlpha,
  mixInk,
};