import Papa from "papaparse";
import type { Item, ItemType, AspectMap } from "./types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EMPTY_MARKER = "///";

const P4DEM_COLUMNS = [
  "P4Dem Category 1",
  "P4Dem Category 2",
  "P4Dem Category 3",
  "P4Dem Category 4",
  "P4Dem Category 5",
  "P4Dem Category 6",
] as const;

const KNOWN_ABBREVIATIONS: Record<string, string> = {
  "National Institute of Standards and Technology": "NIST",
};

// Regex patterns — identical to Python originals
const ASPECT_CODE_RE = /^(\d+\.\d+)/;
const URL_RE = /https?:\/\/\S+/;
const YEAR_PAREN_RE = /\((\d{4}(?:\/\d{4})?)\)/;

// ---------------------------------------------------------------------------
// Exported interfaces
// ---------------------------------------------------------------------------

export interface PreprocessStats {
  total: number;
  threatSolutions: number;
  threats: number;
  opportunities: number;
  skipped: number;
}

export interface PreprocessResult {
  items: Item[];
  stats: PreprocessStats;
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

export const isEmpty = (value: string): boolean => {
  if (!value) return true;
  const stripped = value.trim();
  return stripped === "" || stripped === EMPTY_MARKER;
};

export const cleanValue = (value: string): string | null => {
  if (isEmpty(value)) return null;
  return value.trim();
};

export const determineType = (row: Record<string, string>): ItemType | null => {
  const hasThreat = !isEmpty(row["Threat (paraphrased)"] ?? "");
  const hasOpportunity = !isEmpty(row["Independent Opportunity (paraphrased)"] ?? "");
  const hasSolution = !isEmpty(row["Solution (paraphrased)"] ?? "");

  if (hasThreat && hasSolution) return "threat-solution";
  if (hasThreat) return "threat";
  if (hasOpportunity) return "independent-opportunity";
  return null;
};

export const extractAspectCode = (raw: string): string | null => {
  const stripped = raw.trim();
  if (!stripped) return null;

  // Strip (primary) / (secondary) suffixes, case-insensitive
  const cleaned = stripped
    .replace(/\s*\(primary\)\s*$/i, "")
    .replace(/\s*\(secondary\)\s*$/i, "")
    .trim();

  const match = ASPECT_CODE_RE.exec(cleaned);
  if (!match) return null;
  return match[1];
};

type AspectEntry = { code: string; rank: number };

const extractAspectEntry = (raw: string): AspectEntry | null => {
  const stripped = raw.trim();
  if (!stripped) return null;

  const isSecondary = /\s*\(secondary\)\s*$/i.test(stripped);
  const cleaned = stripped
    .replace(/\s*\(primary\)\s*$/i, "")
    .replace(/\s*\(secondary\)\s*$/i, "")
    .trim();

  const match = ASPECT_CODE_RE.exec(cleaned);
  if (!match) return null;

  return { code: match[1], rank: isSecondary ? 1 : 0 };
};

export const extractAspects = (row: Record<string, string>): string[] => {
  const seen = new Map<string, AspectEntry>();

  for (const col of P4DEM_COLUMNS) {
    const value = row[col] ?? "";
    if (isEmpty(value)) continue;

    const entry = extractAspectEntry(value);
    if (entry === null) continue;
    if (seen.has(entry.code)) continue;

    seen.set(entry.code, entry);
  }

  const result = [...seen.values()];
  result.sort((a, b) => {
    // Primary first, secondary second
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Within same rank, sort by pillar number then code
    const pillarA = parseInt(a.code.split(".")[0], 10);
    const pillarB = parseInt(b.code.split(".")[0], 10);
    if (pillarA !== pillarB) return pillarA - pillarB;
    return a.code.localeCompare(b.code);
  });

  return result.map((e) => e.code);
};

export const extractSourceUrl = (citation: string): string | null => {
  if (!citation) return null;

  const match = URL_RE.exec(citation);
  if (!match) return null;

  // Strip trailing punctuation
  const url = match[0].replace(/[.,;:)]+$/, "");
  return url;
};

export const parsePersonalAuthors = (authorBlock: string): string[] => {
  let block = authorBlock.trim().replace(/\.$/, "");

  let hasEtAl = false;
  if (/,?\s*et\s+al\.?\s*$/.test(block)) {
    hasEtAl = true;
    block = block.replace(/,?\s*et\s+al\.?\s*$/, "").trim().replace(/,$/, "");
  }

  // Split on ' and ' to handle last author separator
  const parts = block.split(/\s+and\s+/);

  const surnames: string[] = [];
  for (const part of parts) {
    // Find all "Surname, Initials" patterns
    const authorMatches = [
      ...part.matchAll(/([A-Z][A-Za-z\u00C0-\u00FF\-\s]+?),\s*([A-Z](?:\.[A-Z])*\.?)/g),
    ];
    if (authorMatches.length > 0) {
      for (const m of authorMatches) {
        surnames.push(m[1].trim());
      }
    } else if (part.trim()) {
      // Fallback: first word before any comma
      surnames.push(part.trim().split(",")[0].trim());
    }
  }

  if (hasEtAl && surnames.length > 0) {
    return [surnames[0], "et al."];
  }

  return surnames;
};

export const deriveSourceShort = (citation: string): string => {
  if (!citation || !citation.trim()) return "";

  const trimmed = citation.trim();

  const yearMatch = YEAR_PAREN_RE.exec(trimmed);
  if (!yearMatch) {
    return trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed;
  }

  const year = yearMatch[1];
  const authorBlock = trimmed.slice(0, yearMatch.index).trim();

  // Check known institutional abbreviations
  for (const [fullName, abbreviation] of Object.entries(KNOWN_ABBREVIATIONS)) {
    if (authorBlock.startsWith(fullName)) {
      return `${abbreviation} (${year})`;
    }
  }

  // Check whether this looks like a personal author (Surname, Initial. pattern)
  const hasPersonalPattern = /[A-Z][a-z\u00C0-\u00FF]+,\s*[A-Z]\./.test(authorBlock);

  if (!hasPersonalPattern) {
    // Institutional author — use name as-is
    const orgName = authorBlock.replace(/[.,; ]+$/, "");
    return `${orgName} (${year})`;
  }

  // Handle "(Chair)" annotations before parsing
  const cleanedBlock = authorBlock.replace(/\s*\(Chair\)\s*/g, " ").trim();

  const surnames = parsePersonalAuthors(cleanedBlock);

  if (surnames.length === 0) {
    return trimmed.length > 50 ? trimmed.slice(0, 50) + "..." : trimmed;
  }

  if (surnames.includes("et al.")) {
    return `${surnames[0]} et al. (${year})`;
  }

  if (surnames.length === 1) return `${surnames[0]} (${year})`;
  if (surnames.length === 2) return `${surnames[0]} & ${surnames[1]} (${year})`;

  return `${surnames[0]} et al. (${year})`;
};

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

const normalizeHeader = (name: string): string =>
  name.replace(/\s+/g, " ").trim();

export const parseCsvRows = (csvText: string): Record<string, string>[] => {
  // Use greedy skipEmptyLines to collapse blank/all-empty rows (matching Python's
  // behavior of skipping the title row and any blank/separator rows before headers).
  // After collapsing: row 0 = title, row 1 = headers, row 2+ = data rows.
  const result = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: "greedy",
  });

  const allRows = result.data;

  // Row 0: title row — skip
  // Row 1: header row
  // Row 2+: data rows
  if (allRows.length < 2) return [];

  const rawHeaders = allRows[1];
  const headers = rawHeaders.map(normalizeHeader);

  const dataRows = allRows.slice(2);
  return dataRows.map((values) => {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
};

// ---------------------------------------------------------------------------
// Row transformation
// ---------------------------------------------------------------------------

const transformRow = (row: Record<string, string>): Item | null => {
  const stableId = (row["Stable ID"] ?? "").trim();
  if (!stableId) return null;

  const itemId = parseInt(stableId, 10);
  if (isNaN(itemId)) return null;

  const itemType = determineType(row);
  if (itemType === null) return null;

  let description: string;
  let descriptionVerbatim: string;

  if (itemType === "threat" || itemType === "threat-solution") {
    description = cleanValue(row["Threat (paraphrased)"] ?? "") ?? "";
    descriptionVerbatim = cleanValue(row["Threat (verbatim)"] ?? "") ?? "";
  } else {
    // independent-opportunity
    description = cleanValue(row["Independent Opportunity (paraphrased)"] ?? "") ?? "";
    descriptionVerbatim = cleanValue(row["Independent Opportunity (verbatim)"] ?? "") ?? "";
  }

  const source = (row["Source"] ?? "").trim();
  const aspects = extractAspects(row);

  return {
    id: itemId,
    type: itemType,
    description,
    descriptionVerbatim,
    solution: cleanValue(row["Solution (paraphrased)"] ?? ""),
    solutionVerbatim: cleanValue(row["Solution (verbatim)"] ?? ""),
    source,
    sourceShort: deriveSourceShort(source),
    sourceUrl: extractSourceUrl(source),
    originalCategory: cleanValue(row["Democracy Category (original)"] ?? "") ?? "",
    aspects,
  };
};

// ---------------------------------------------------------------------------
// Main preprocess function
// ---------------------------------------------------------------------------

export const preprocess = (
  csvText: string,
  aspectsMap: AspectMap
): PreprocessResult => {
  const rows = parseCsvRows(csvText);

  const items: Item[] = [];
  let skipped = 0;

  for (const row of rows) {
    const item = transformRow(row);
    if (item === null) {
      skipped++;
      continue;
    }
    items.push(item);
  }

  // Validate aspect codes against the provided map
  const warnings: string[] = [];
  const validCodes = new Set(Object.keys(aspectsMap));
  const foundCodes = new Set(items.flatMap((i) => i.aspects));

  for (const code of [...foundCodes].sort()) {
    if (!validCodes.has(code)) {
      warnings.push(`Unknown aspect code '${code}' found in data but not in aspects map`);
    }
  }

  const stats: PreprocessStats = {
    total: items.length,
    threatSolutions: items.filter((i) => i.type === "threat-solution").length,
    threats: items.filter((i) => i.type === "threat").length,
    opportunities: items.filter((i) => i.type === "independent-opportunity").length,
    skipped,
  };

  return { items, stats, warnings };
};
