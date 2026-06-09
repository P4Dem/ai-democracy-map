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
  search: string;
};
