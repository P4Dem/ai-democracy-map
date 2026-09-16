#!/usr/bin/env python3
"""Preprocess the AI x Democracy dataset workbook into data.json.

Source of truth: docs/20260828_Updated data + new labels + new descriptions.xlsx,
sheet "DATASET V 10.3" — a single self-contained sheet carrying, per record, the
threat/mitigation/opportunity text, the source citation, the democracy-aspect
codes AND the harm-tier / pro-dem mechanism codes. (Earlier revisions split these
across data/raw/latest.csv + the mock JSX; that two-step merge is gone.)

The legacy CSV reader (`read_csv`) is kept so the older fixtures still import.
"""

import csv
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Optional

import openpyxl

PROJECT_ROOT = Path(__file__).resolve().parent.parent
# 2026-09-14: client sent the V10.4 dataset refresh (citations homogenised, the
# Ovadya link corrected, and entries 147/148 retired) as a standalone workbook
# with just the DATASET sheet. The codebook taxonomy is untouched and still
# comes from the original workbook (see generate_taxonomy.py's INPUT_XLSX).
INPUT_XLSX = PROJECT_ROOT / "docs" / "20260914_Updated data (V10.4).xlsx"
DATASET_SHEET = "V 10.4 (->MechLeg V0.52)"
INPUT_CSV = PROJECT_ROOT / "data" / "raw" / "latest.csv"
OUTPUT_JSON = PROJECT_ROOT / "public" / "data" / "data.json"
ASPECTS_JSON = PROJECT_ROOT / "public" / "data" / "aspects.json"

EMPTY_MARKER = "///"

# Democracy Aspect column names after stripping (the raw source has inconsistent spacing)
ASPECT_COLUMNS = [
    "Democracy Aspect 1",
    "Democracy Aspect 2",
    "Democracy Aspect 3",
    "Democracy Aspect 4",
    "Democracy Aspect 5",
    "Democracy Aspect 6",
]

HARM_ID_COLUMNS = [f"HarmTierMech ID {i}" for i in range(1, 8)]
BENEFIT_ID_COLUMNS = ["Pro-dem Mech ID", "Pro-Dem Mech ID Additional"]

# Leading code token of a "T5a.1 Some accessible label" / "T7a.3 - Chilling ..." cell.
CODE_TOKEN_RE = re.compile(r"^([A-Za-z]+[0-9][A-Za-z0-9.]*)")
# Benefit ids in the dataset sheet are zero-padded (B03A); the taxonomy and the
# app use the unpadded form (B3A).
BENEFIT_PAD_RE = re.compile(r"^B0*(\d+)([A-Za-z]?)$")

KNOWN_ABBREVIATIONS: dict[str, str] = {
    "National Institute of Standards and Technology": "NIST",
}

ASPECT_CODE_RE = re.compile(r"^(\d+\.\d+)")
URL_RE = re.compile(r"https?://\S+")
YEAR_PAREN_RE = re.compile(r"\((\d{4}(?:/\d{4})?)\)")


def normalise_dashes(value: str) -> str:
    """Client editorial rule (2026-09-14): UK style — em-dashes are treated as
    a telltale of AI copy, so all em-dashes give way to en-dashes."""
    if not value:
        return value
    return value.replace("\u2014", "\u2013")


def is_empty(value: str) -> bool:
    """Check whether a CSV cell value is effectively empty."""
    if not value:
        return True
    stripped = value.strip()
    return stripped == "" or stripped == EMPTY_MARKER


def clean_value(value: str) -> Optional[str]:
    """Return a cleaned string, or None if effectively empty."""
    if is_empty(value):
        return None
    return value.strip()


def determine_type(row: dict) -> Optional[str]:
    """Determine the 3-way item type or None to skip the row.

    threat-solution       — threat present AND solution present
    threat                — threat present, no solution
    independent-opportunity — only an independent opportunity present
    """
    has_threat = not is_empty(row.get("Threat (paraphrased)", ""))
    has_opportunity = not is_empty(row.get("Pro-dem Opportunity (paraphrased)", ""))
    has_solution = not is_empty(row.get("Pro-dem Mitigation (paraphrased)", ""))

    if has_threat and has_solution:
        return "threat-solution"
    if has_threat:
        return "threat"
    if has_opportunity:
        return "independent-opportunity"
    return None


def extract_aspect_code(raw: str) -> Optional[str]:
    """Extract the numeric aspect code (e.g. '2.1') from a P4Dem cell value.

    Handles formats like:
      '2.1 Free and Fair Elections'
      ' 1.3 Civil and Political Rights'
      '3.2 Opinion Formation and Political Participation (primary)'
      '1.2 PRIMARY Rule of Law...'
      '2.3 SECONDARY Effective & Accountable Government ...'
      '1.2 SECONDARY Rule of Law & Access to Justice -- long description'
    """
    stripped = raw.strip()
    if not stripped:
        return None

    # Strip "(primary)" or "(secondary)" suffixes
    stripped = re.sub(r"\s*\(primary\)\s*$", "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"\s*\(secondary\)\s*$", "", stripped, flags=re.IGNORECASE)
    stripped = stripped.strip()

    match = ASPECT_CODE_RE.match(stripped)
    if not match:
        return None
    return match.group(1)


def _extract_aspect_entry(raw: str) -> Optional[tuple[str, int]]:
    """Return (code, rank) where rank=0 for primary, 1 for secondary.

    Handles both the parenthesised suffix ("3.2 Opinion Formation (secondary)")
    and the v10.3 inline keyword ("3.1 SECONDARY Independent ... Media").
    """
    stripped = raw.strip()
    if not stripped:
        return None

    is_secondary = bool(re.search(r"\s*\(secondary\)\s*$", stripped, re.IGNORECASE))
    is_secondary = is_secondary or bool(
        re.match(r"^\s*\d+\.\d+\s+SECONDARY\b", stripped, re.IGNORECASE)
    )
    stripped = re.sub(r"\s*\(primary\)\s*$", "", stripped, flags=re.IGNORECASE)
    stripped = re.sub(r"\s*\(secondary\)\s*$", "", stripped, flags=re.IGNORECASE)
    stripped = stripped.strip()

    match = ASPECT_CODE_RE.match(stripped)
    if not match:
        return None
    return (match.group(1), 1 if is_secondary else 0)


def _code_token(raw: str) -> Optional[str]:
    """Leading code id from a taxonomy cell ('T5a.1 Some label' -> 'T5a.1')."""
    if is_empty(raw):
        return None
    match = CODE_TOKEN_RE.match(str(raw).strip())
    return match.group(1) if match else None


def _normalise_benefit(code: str) -> str:
    """B03A -> B3A, B09 -> B9, B10 -> B10 (unpad to the taxonomy/app form)."""
    match = BENEFIT_PAD_RE.match(code)
    if not match:
        return code
    return f"B{int(match.group(1))}{match.group(2).upper()}"


def extract_harm_codes(row: dict) -> list[str]:
    """Ordered, de-duplicated harm-tier codes from HarmTierMech ID 1-7."""
    seen: list[str] = []
    for col in HARM_ID_COLUMNS:
        token = _code_token(row.get(col, ""))
        if token and token.upper().startswith("T") and token not in seen:
            seen.append(token)
    return seen


def extract_benefit_codes(row: dict) -> list[str]:
    """Ordered, de-duplicated pro-dem mechanism codes, unpadded (B03A -> B3A)."""
    seen: list[str] = []
    for col in BENEFIT_ID_COLUMNS:
        token = _code_token(row.get(col, ""))
        if not token or not token.upper().startswith("B"):
            continue
        code = _normalise_benefit(token)
        if code not in seen:
            seen.append(code)
    return seen


def extract_aspects(row: dict) -> list[str]:
    """Collect deduplicated aspect codes from P4Dem Category 1-6 columns.

    Primary aspects first (ordered by pillar then code), then secondary.
    """
    seen: dict[str, int] = {}

    for col in ASPECT_COLUMNS:
        value = row.get(col, "")
        if is_empty(value):
            continue

        entry = _extract_aspect_entry(value)
        if entry is None:
            continue
        code, rank = entry
        if code in seen:
            continue

        seen[code] = rank

    # Sort: primary first (rank=0) then secondary (rank=1); within same rank by pillar then code
    def sort_key(item: tuple[str, int]) -> tuple:
        code, rank = item
        pillar = int(code.split(".")[0]) if "." in code else 0
        return (rank, pillar, code)

    sorted_entries = sorted(seen.items(), key=sort_key)
    return [code for code, _ in sorted_entries]


def extract_source_url(citation: str) -> Optional[str]:
    """Extract the first URL from a citation string, stripping trailing punctuation."""
    if not citation:
        return None

    match = URL_RE.search(citation)
    if not match:
        return None

    url = match.group(0)
    url = url.rstrip(".,;:)")
    return url


def _parse_personal_authors(author_block: str) -> list[str]:
    """Parse personal author surnames from the author block before the year.

    Handles:
      'George, R. and Klaus, I.'        -> ['George', 'Klaus']
      'Jungherr, A.'                    -> ['Jungherr']
      'Tsai, L.L., Pentland, A., ...'   -> ['Tsai', 'Pentland', ...]
      'Guzman Piedrahita, D., ..., et al.' -> ['Guzman Piedrahita', ...]
    """
    block = author_block.strip().rstrip(".")

    has_et_al = False
    if re.search(r",?\s*et\s+al\.?\s*$", block):
        has_et_al = True
        block = re.sub(r",?\s*et\s+al\.?\s*$", "", block).strip().rstrip(",")

    # Split on ' and ' to handle the last author separator
    parts = re.split(r"\s+and\s+", block)

    surnames: list[str] = []
    for part in parts:
        # Each part may contain comma-separated "Surname, Initials" pairs
        # Split on ", " but be careful: "Guzman Piedrahita, D." has a comma
        # between surname and initials. We need to distinguish that from
        # author separators.
        #
        # Pattern: Surname might contain spaces, followed by ", " and initials
        # (one or more uppercase letters with dots).
        # Author separator is also ", " but followed by another surname.
        #
        # Strategy: find all "Surname, Initials" patterns
        author_matches = re.findall(
            r"([A-Z][A-Za-zÀ-ÿ\-\s]+?),\s*([A-Z](?:\.[A-Z])*\.?)",
            part,
        )
        if author_matches:
            for surname, _initials in author_matches:
                surnames.append(surname.strip())
        elif part.strip():
            # Fallback: take the first word as surname
            surnames.append(part.strip().split(",")[0].strip())

    if has_et_al and surnames:
        return [surnames[0], "et al."]

    return surnames


def derive_source_short(citation: str) -> str:
    """Derive a short citation like 'George & Klaus (2026)' from a full citation."""
    if not citation or not citation.strip():
        return ""

    citation = citation.strip()

    # Find the year in parentheses
    year_match = YEAR_PAREN_RE.search(citation)
    if not year_match:
        return citation[:50] + "..." if len(citation) > 50 else citation

    year = year_match.group(1)
    author_block = citation[: year_match.start()].strip()

    # Check for known institutional authors
    for full_name, abbreviation in KNOWN_ABBREVIATIONS.items():
        if author_block.startswith(full_name):
            return f"{abbreviation} ({year})"

    # Check if this looks like an institutional author (no comma-initial pattern)
    # Institutional authors: "European Parliament", "KELA Cyber Intelligence"
    has_personal_pattern = re.search(r"[A-Z][a-zÀ-ÿ]+,\s*[A-Z]\.", author_block)

    if not has_personal_pattern:
        # Institutional author -- use as-is (strip trailing punctuation)
        org_name = author_block.rstrip(".,; ")
        return f"{org_name} ({year})"

    # Handle "(Chair)" annotations
    author_block = re.sub(r"\s*\(Chair\)\s*", " ", author_block).strip()

    surnames = _parse_personal_authors(author_block)

    if not surnames:
        return citation[:50] + "..." if len(citation) > 50 else citation

    if "et al." in surnames:
        first = surnames[0]
        return f"{first} et al. ({year})"

    if len(surnames) == 1:
        return f"{surnames[0]} ({year})"
    if len(surnames) == 2:
        return f"{surnames[0]} & {surnames[1]} ({year})"

    return f"{surnames[0]} et al. ({year})"


def transform_row(row: dict) -> Optional[dict]:
    """Transform a single CSV row into an output item, or None to skip."""
    stable_id = row.get("Stable ID", "").strip()
    if not stable_id:
        return None

    try:
        item_id = int(stable_id)
    except ValueError:
        return None

    item_type = determine_type(row)
    if item_type is None:
        return None

    if item_type in ("threat", "threat-solution"):
        description = clean_value(row.get("Threat (paraphrased)", ""))
        description_verbatim = clean_value(row.get("Threat (verbatim)", ""))
    else:
        # independent-opportunity
        description = clean_value(row.get("Pro-dem Opportunity (paraphrased)", ""))
        description_verbatim = clean_value(
            row.get("Pro-dem Opportunity (verbatim)", "")
        )

    source = row.get("Source", "").strip()

    return {
        "id": item_id,
        "type": item_type,
        "description": description or "",
        "descriptionVerbatim": description_verbatim or "",
        "solution": clean_value(row.get("Pro-dem Mitigation (paraphrased)", "")),
        "solutionVerbatim": clean_value(row.get("Pro-dem Mitigation (verbatim)", "")),
        "source": source,
        "sourceShort": derive_source_short(source),
        "sourceUrl": extract_source_url(source),
        "originalCategory": clean_value(row.get("Democracy Category (original)", ""))
        or "",
        "aspects": extract_aspects(row),
        "harmCodes": extract_harm_codes(row),
        "benefitCodes": extract_benefit_codes(row),
    }


def _normalize_header(name: str) -> str:
    """Normalize a CSV header by collapsing multiple spaces into one and stripping."""
    return re.sub(r"\s+", " ", name).strip()


def read_csv(path: Path) -> list[dict]:
    """Read the mapping CSV, skipping the title/empty rows, returning dicts per data row.

    Auto-detects delimiter (comma or semicolon) from the header row.
    """
    # Try UTF-8 first (with BOM handling), fall back to Windows-1252
    # (common when CSVs are exported from Excel on Windows)
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            with open(path, newline="", encoding=encoding) as f:
                f.read(1024)
            break
        except (UnicodeDecodeError, ValueError):
            continue

    with open(path, newline="", encoding=encoding) as f:
        # Read enough to detect delimiter
        sample = f.read(4096)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
        except csv.Error:
            dialect = csv.excel  # fallback to comma
        f.seek(0)

        reader = csv.reader(f, dialect)

        # Row 1: title row -- skip
        next(reader)
        # Row 2: empty -- skip
        next(reader)
        # Row 3: header
        raw_headers = next(reader)
        headers = [_normalize_header(h) for h in raw_headers]

        rows: list[dict] = []
        for values in reader:
            row = dict(zip(headers, values))
            rows.append(row)

    return rows


def read_xlsx(path: Path, sheet: str = DATASET_SHEET) -> list[dict]:
    """Read the dataset sheet into row dicts keyed by normalised header.

    The sheet has a title row + a blank row before the "Stable ID" header;
    everything from the first row whose first cell is "Stable ID" is data.
    """
    wb = openpyxl.load_workbook(path, data_only=True, read_only=True)
    ws = wb[sheet]
    grid = [
        ["" if c is None else str(c).strip() for c in row]
        for row in ws.iter_rows(values_only=True)
    ]
    wb.close()

    header_idx = next(
        (i for i, r in enumerate(grid) if r and r[0] == "Stable ID"), None
    )
    if header_idx is None:
        raise ValueError(f"No 'Stable ID' header row found in sheet {sheet!r}")

    headers = [_normalize_header(h) for h in grid[header_idx]]
    rows: list[dict] = []
    for values in grid[header_idx + 1 :]:
        if not values or not values[0].strip():
            continue
        rows.append(dict(zip(headers, values)))
    return rows


def validate_aspects(items: list[dict], aspects_path: Path) -> None:
    """Check that all aspect codes found in items exist in aspects.json."""
    if not aspects_path.exists():
        print(f"WARNING: Aspects file not found at {aspects_path}, skipping validation")
        return

    with open(aspects_path, encoding="utf-8") as f:
        aspects_data = json.load(f)

    valid_codes = set(aspects_data.keys())
    found_codes: set[str] = set()

    for item in items:
        for code in item["aspects"]:
            found_codes.add(code)

    unknown = found_codes - valid_codes
    if unknown:
        for code in sorted(unknown):
            print(f"WARNING: Aspect code '{code}' found in data but not in aspects.json")
    else:
        print(f"OK: All {len(found_codes)} aspect codes are valid")


def mark_duplicates(items: list[dict]) -> int:
    """Mark all-but-first items sharing a descriptionVerbatim as isDuplicate.

    GROUP by stripped-lowercased verbatim (Step 5 of PLAN.html). Empty/absent
    verbatims are never grouped. Returns the number of duplicates flagged.
    """
    seen: dict[str, int] = {}
    duplicates = 0
    for item in items:
        verbatim = str(item.get("descriptionVerbatim") or "").strip()
        if not verbatim:
            continue
        key = verbatim.lower()
        if key in seen:
            item["isDuplicate"] = True
            duplicates += 1
        else:
            seen[key] = item["id"]
    return duplicates


def read_source(input_path: Path) -> list[dict]:
    """Dispatch to the xlsx or csv reader based on the file suffix."""
    if input_path.suffix.lower() in (".xlsx", ".xlsm"):
        return read_xlsx(input_path)
    return read_csv(input_path)


def preprocess(
    input_path: Path = INPUT_XLSX,
    output_path: Path = OUTPUT_JSON,
) -> list[dict]:
    """Read the dataset, transform rows, write JSON, validate aspects. Returns the items."""
    rows = read_source(input_path)
    print(f"Read {len(rows)} data rows from {input_path.name}")

    items: list[dict] = []
    skipped = 0

    for row in rows:
        item = transform_row(row)
        if item is None:
            skipped += 1
            continue
        for key, value in item.items():
            if isinstance(value, str):
                item[key] = normalise_dashes(value)
        items.append(item)

    print(f"Transformed {len(items)} items ({skipped} rows skipped)")

    threat_solutions = sum(1 for i in items if i["type"] == "threat-solution")
    threats = sum(1 for i in items if i["type"] == "threat")
    opportunities = sum(1 for i in items if i["type"] == "independent-opportunity")
    print(f"  Threat+Solution: {threat_solutions}, Threat: {threats}, Opportunity: {opportunities}")

    with_harm = sum(1 for i in items if i["harmCodes"])
    with_benefit = sum(1 for i in items if i["benefitCodes"])
    print(f"  Harm-coded: {with_harm}, Benefit-coded: {with_benefit}")

    duplicates = mark_duplicates(items)
    print(f"  Marked {duplicates} duplicate entries (isDuplicate) across verbatim groups")

    # Atomic write: write to temp file in same directory, then rename
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp_path = tempfile.mkstemp(
        dir=output_path.parent,
        suffix=".json.tmp",
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
            f.write("\n")
        os.replace(tmp_path, output_path)
    except Exception:
        os.unlink(tmp_path)
        raise

    print(f"Wrote {output_path}")

    validate_aspects(items, ASPECTS_JSON)

    return items


if __name__ == "__main__":
    preprocess(INPUT_XLSX, OUTPUT_JSON)
