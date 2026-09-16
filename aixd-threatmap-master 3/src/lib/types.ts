export type ItemType = "threat-solution" | "threat" | "independent-opportunity";

export type Item = {
  id: number;
  type: ItemType;
  description: string;
  descriptionVerbatim: string;
  solution: string | null;
  solutionVerbatim: string | null;
  source: string;
  sourceShort: string;
  sourceUrl: string | null;
  originalCategory: string;
  aspects: string[];
  harmCodes: string[];
  benefitCodes: string[];
  isDuplicate?: boolean;
};

export type HarmTaxonomyEntry = {
  label: string;
  description: string;
  cluster: string;
  subCluster: string;
  tier: string;
  source?: "xlsx" | "mock";
  order: number;
};

export type BenefitTaxonomyEntry = {
  label: string;
  description: string;
  name: string;
  subCluster: string;
  parent: string | null;
  order: number;
};

export type HarmTaxonomy = {
  tiers: Record<string, { label: string | null; codeIds: string[]; order: number }>;
  codes: Record<string, HarmTaxonomyEntry>;
};

export type BenefitTaxonomy = {
  groups: Record<string, { label: string | null; codeIds: string[]; order: number }>;
  codes: Record<string, BenefitTaxonomyEntry>;
};

export type Aspect = {
  code: string;
  name: string;
  definition: string;
  description: string;
  pillar: string;
  pillarCode: string;
};

export type AspectMap = Record<string, Aspect>;

export type FilterState = {
  type: ItemType[];
  aspect: string[];
  source: string[];
  harm: string[];
  benefit: string[];
  search: string;
};

export type VizFilter = {
  key: "aspect" | "harm" | "benefit";
  codes: string[];
  label: string;
};
