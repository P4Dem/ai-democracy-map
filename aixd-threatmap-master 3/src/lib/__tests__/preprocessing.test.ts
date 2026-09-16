import { describe, test, expect } from "bun:test";
import {
  isEmpty,
  cleanValue,
  determineType,
  extractAspectCode,
  extractAspects,
  extractSourceUrl,
  parsePersonalAuthors,
  deriveSourceShort,
  parseCsvRows,
  preprocess,
} from "../preprocessing";
import type { AspectMap } from "../types";

const MOCK_ASPECTS: AspectMap = {
  "1.1": { code: "1.1", name: "Nationhood", definition: "", description: "", pillar: "Citizenship", pillarCode: "1" },
  "2.1": { code: "2.1", name: "Free and Fair Elections", definition: "", description: "", pillar: "Representative Government", pillarCode: "2" },
  "3.1": { code: "3.1", name: "The Media", definition: "", description: "", pillar: "Civil Society", pillarCode: "3" },
};

describe("isEmpty", () => {
  test("empty string → true", () => expect(isEmpty("")).toBe(true));
  test("/// marker → true", () => expect(isEmpty("///")).toBe(true));
  test("whitespace only → true", () => expect(isEmpty("   ")).toBe(true));
  test("/// with spaces → true", () => expect(isEmpty("  ///  ")).toBe(true));
  test("valid value → false", () => expect(isEmpty("hello")).toBe(false));
});

describe("cleanValue", () => {
  test("empty → null", () => expect(cleanValue("")).toBeNull());
  test("/// → null", () => expect(cleanValue("///")).toBeNull());
  test("value → trimmed string", () => expect(cleanValue("  hello  ")).toBe("hello"));
});

describe("determineType", () => {
  test("threat + solution → threat-solution", () =>
    expect(determineType({ "Threat (paraphrased)": "T", "Solution (paraphrased)": "S", "Independent Opportunity (paraphrased)": "" }))
      .toBe("threat-solution"));
  test("threat only → threat", () =>
    expect(determineType({ "Threat (paraphrased)": "T", "Solution (paraphrased)": "///", "Independent Opportunity (paraphrased)": "" }))
      .toBe("threat"));
  test("opportunity only → independent-opportunity", () =>
    expect(determineType({ "Threat (paraphrased)": "", "Solution (paraphrased)": "", "Independent Opportunity (paraphrased)": "O" }))
      .toBe("independent-opportunity"));
  test("all empty → null", () =>
    expect(determineType({ "Threat (paraphrased)": "", "Solution (paraphrased)": "", "Independent Opportunity (paraphrased)": "" }))
      .toBeNull());
});

describe("extractAspectCode", () => {
  test("standard format", () => expect(extractAspectCode("2.1 Free and Fair Elections")).toBe("2.1"));
  test("leading whitespace", () => expect(extractAspectCode(" 1.3 Civil Rights")).toBe("1.3"));
  test("(primary) suffix", () => expect(extractAspectCode("3.2 Opinion Formation (primary)")).toBe("3.2"));
  test("(secondary) suffix", () => expect(extractAspectCode("1.2 Rule of Law (secondary)")).toBe("1.2"));
  test("empty string → null", () => expect(extractAspectCode("")).toBeNull());
  test("no code → null", () => expect(extractAspectCode("Free and Fair Elections")).toBeNull());
});

describe("extractAspects", () => {
  test("multiple aspects deduplicated", () => {
    const row = {
      "P4Dem Category 1": "2.1 Free and Fair Elections",
      "P4Dem Category 2": "3.1 The Media",
      "P4Dem Category 3": "2.1 Free and Fair Elections",
      "P4Dem Category 4": "",
      "P4Dem Category 5": "",
      "P4Dem Category 6": "",
    };
    expect(extractAspects(row)).toEqual(["2.1", "3.1"]);
  });
  test("all empty → empty array", () => {
    const row = Object.fromEntries(
      ["1", "2", "3", "4", "5", "6"].map((n) => [`P4Dem Category ${n}`, ""])
    );
    expect(extractAspects(row)).toEqual([]);
  });
});

describe("extractSourceUrl", () => {
  test("extracts URL", () =>
    expect(extractSourceUrl("George, R. (2026) https://example.com/paper"))
      .toBe("https://example.com/paper"));
  test("strips trailing punctuation", () =>
    expect(extractSourceUrl("See https://example.com/paper."))
      .toBe("https://example.com/paper"));
  test("no URL → null", () => expect(extractSourceUrl("No URL here")).toBeNull());
  test("empty → null", () => expect(extractSourceUrl("")).toBeNull());
});

describe("parsePersonalAuthors", () => {
  test("two authors", () =>
    expect(parsePersonalAuthors("George, R. and Klaus, I."))
      .toEqual(["George", "Klaus"]));
  test("single author", () =>
    expect(parsePersonalAuthors("Jungherr, A."))
      .toEqual(["Jungherr"]));
  test("et al.", () =>
    expect(parsePersonalAuthors("George, R., Klaus, I., et al."))
      .toEqual(["George", "et al."]));
});

describe("deriveSourceShort", () => {
  test("two personal authors", () =>
    expect(deriveSourceShort("George, R. and Klaus, I. (2026) Carnegie Endowment"))
      .toBe("George & Klaus (2026)"));
  test("single author", () =>
    expect(deriveSourceShort("Jungherr, A. (2023) Some Journal"))
      .toBe("Jungherr (2023)"));
  test("institutional author", () =>
    expect(deriveSourceShort("European Parliament (2024) Report on AI"))
      .toBe("European Parliament (2024)"));
  test("known abbreviation", () =>
    expect(deriveSourceShort("National Institute of Standards and Technology (2023) AI RMF"))
      .toBe("NIST (2023)"));
  test("no year → truncate", () =>
    expect(deriveSourceShort("Some very long citation without a year in parentheses whatsoever for real"))
      .toMatch(/\.\.\.$/));
});

// ---- CSV parsing and end-to-end ----

const SAMPLE_CSV = `AI x Democracy Mapping
,

Stable ID,Threat (paraphrased),Threat (verbatim),Solution (paraphrased),Solution (verbatim),Independent Opportunity (paraphrased),Independent Opportunity (verbatim),Source,Democracy Category (original),P4Dem Category 1,P4Dem Category 2,P4Dem Category 3,P4Dem Category 4,P4Dem Category 5,P4Dem Category 6
1,AI deepfakes undermine elections,Verbatim threat text,Authenticate content,Verbatim solution text,///,///,George R. and Klaus I. (2026) https://example.com,Elections,2.1 Free and Fair Elections,3.1 The Media,,,,
2,AI surveillance chills dissent,Verbatim surveillance,///,///,///,///,George R. and Klaus I. (2026) https://example.com,Rights,1.1 Nationhood,,,,,
3,///,///,///,///,AI enables inclusive access,Verbatim opportunity,George R. and Klaus I. (2026) https://example.com,Opportunity,2.1 Free and Fair Elections,,,,,
`;

describe("parseCsvRows", () => {
  test("returns correct number of data rows", () => {
    const rows = parseCsvRows(SAMPLE_CSV);
    expect(rows.length).toBe(3);
  });
  test("headers are normalized (no extra spaces)", () => {
    const rows = parseCsvRows(SAMPLE_CSV);
    expect(rows[0]).toHaveProperty("Stable ID");
    expect(rows[0]).toHaveProperty("Threat (paraphrased)");
  });
});

describe("preprocess (end-to-end)", () => {
  test("produces correct item count and types", () => {
    const result = preprocess(SAMPLE_CSV, MOCK_ASPECTS);
    expect(result.stats.total).toBe(3);
    expect(result.stats.threatSolutions).toBe(1);
    expect(result.stats.threats).toBe(1);
    expect(result.stats.opportunities).toBe(1);
    expect(result.stats.skipped).toBe(0);
  });
  test("threat-solution item has description and solution", () => {
    const result = preprocess(SAMPLE_CSV, MOCK_ASPECTS);
    const item = result.items.find((i) => i.type === "threat-solution");
    expect(item?.description).toBe("AI deepfakes undermine elections");
    expect(item?.solution).toBe("Authenticate content");
  });
  test("opportunity item puts text in description field", () => {
    const result = preprocess(SAMPLE_CSV, MOCK_ASPECTS);
    const item = result.items.find((i) => i.type === "independent-opportunity");
    expect(item?.description).toBe("AI enables inclusive access");
    expect(item?.solution).toBeNull();
  });
  test("no warnings for valid aspect codes", () => {
    const result = preprocess(SAMPLE_CSV, MOCK_ASPECTS);
    expect(result.warnings).toEqual([]);
  });
  test("warning for unknown aspect code", () => {
    const result = preprocess(SAMPLE_CSV, {}); // empty aspects map
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toMatch(/Unknown aspect code/);
  });
});
