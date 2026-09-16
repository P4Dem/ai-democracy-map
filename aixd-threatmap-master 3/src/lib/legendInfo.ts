"use client";

// Short descriptions for the carousel legend hover boxes. Text is verbatim
// from the client codebook workbook "3_UPDATED_SHORT LABELS&DESCR_harms and
// pro-dem mechanisms.xlsx", Sheet1 – column J ("Short description"), with the
// column-K fallback where a J cell was empty.

// Harm tiers, keyed by the harm-taxonomy tier ids (tier0–tier7).
export const HARM_TIER_DESC: Record<string, string> = {
  tier0:
    "Conditions and choices that shape how AI systems are built, released, and used",
  tier1:
    "Architectural and design features of AI systems themselves, carrying harm potential prior to any specific output or deployment context.",
  tier2:
    "Mechanisms at the level of what individual AI outputs do: the qualities of the artefacts a model produces, realised once an output is generated.",
  tier3:
    "Mechanisms that reify with the decision to put AI into use, holding for whoever adopts a system by virtue of the adoption itself.",
  tier4:
    "The elementary operations an AI model can perform, taken independently of the purposes they serve and the effects they produce.",
  tier5:
    "Purposive, real-world application of the elementary operations aimed at an effect on the social world.",
  tier6:
    "Mechanisms by which sustained interaction with AI reshapes how individual humans think, decide, and act.",
  tier7:
    "Society-level reshaping of the information environment, public discourse, economic structures, and political-corporate power positions, emerging from many AI uses rather than single events.",
};

// Harm tier key from a short T-code ("T0" → "tier0").
export const tierKeyOf = (tier: string): string =>
  tier.startsWith("T") ? "tier" + tier.slice(1) : tier;

// Pathway map clusters, keyed by cluster name (HM2_CLUSTERS). Tier-level
// "one-line" definitions from the same codebook sheet.
export const PATHWAY_CLUSTER_DESC: Record<string, string> = {
  Context:
    "Conditions and choices that shape how AI systems are built, released, and used",
  "Properties and capabilities":
    "Architectural and design features of AI systems themselves, carrying harm potential prior to any specific output or deployment context.",
  "AI model use":
    "Mechanisms that reify with the decision to put AI into use, holding for whoever adopts a system by virtue of the adoption itself.",
  "Downstream social dynamics":
    "Mechanisms by which sustained interaction with AI reshapes how individual humans think, decide, and act.",
};

// Democracy-aspect pillars (keyed 1–4), from the framework codebook
// docs/code_descriptions.md (pillar-level definitions).
export const ASPECT_PILLAR_DESC: Record<string, string> = {
  "1":
    "Concerns the rights of citizens and the state's ability to guarantee equal rights through constitutional and legal processes – including civil, political, economic and social rights.",
  "2":
    "Concerns the institutions and processes of representative and accountable government: electoral processes and political parties; the effectiveness, transparency, and integrity of public administration, legislature and judiciary; civilian control of security forces; and the absence of illegitimate influence on policy-making.",
  "3":
    "Concerns the conditions for an alert and active citizen body: the independence and viability of professional journalism; and the formation, exchange, and contestation of political opinion.",
  "4":
    "Concerns the international dimensions of democracy: external influences on a country's democracy, and the country's democratic impact abroad.",
};