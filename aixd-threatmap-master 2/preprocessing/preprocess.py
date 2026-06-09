#!/usr/bin/env python3
"""Preprocess the AI x Democracy mapping CSV into data.json."""

import csv
import json
import os
import re
import sys
import tempfile
from pathlib import Path
from typing import Optional

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_CSV = PROJECT_ROOT / "data" / "raw" / "mapping.csv"
OUTPUT_JSON = PROJECT_ROOT / "public" / "data" / "data.json"
ASPECTS_JSON = PROJECT_ROOT / "public" / "data" / "aspects.json"

EMPTY_MARKER = "///"

# P4Dem column names after stripping (the raw CSV has inconsistent spacing)
P4DEM_COLUMNS = [
    "P4Dem Category 1",
    "P4Dem Category 2",
    "P4Dem Category 3",
    "P4Dem Category 4",
    "P4Dem Category 5",
    "P4Dem Category 6",
]

KNOWN_ABBREVIATIONS: dict[str, str] = {
    "National Institute of Standards and Technology": "NIST",
}

ASPECT_CODE_RE = re.compile(r"^(\d+\.\d+)")
URL_RE = re.compile(r"https?://\S+")
YEAR_PAREN_RE = re.compile(r"\((\d{4}(?:/\d{4})?)\)")


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
    has_opportunity = not is_empty(row.get("Independent Opportunity (paraphrased)", ""))
    has_solution = not is_empty(row.get("Solution (paraphrased)", ""))

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


def extract_aspects(row: dict) -> list[str]:
    """Collect deduplicated aspect codes from P4Dem Category 1-6 columns."""
    seen: set[str] = set()
    result: list[str] = []

    for col in P4DEM_COLUMNS:
        value = row.get(col, "")
        if is_empty(value):
            continue

        code = extract_aspect_code(value)
        if code is None:
            continue
        if code in seen:
            continue

        seen.add(code)
        result.append(code)

    return result


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
        description = clean_value(row.get("Independent Opportunity (paraphrased)", ""))
        description_verbatim = clean_value(
            row.get("Independent Opportunity (verbatim)", "")
        )

    source = row.get("Source", "").strip()
    aspects = extract_aspects(row)

    return {
        "id": item_id,
        "type": item_type,
        "description": description or "",
        "descriptionVerbatim": description_verbatim or "",
        "solution": clean_value(row.get("Solution (paraphrased)", "")),
        "solutionVerbatim": clean_value(row.get("Solution (verbatim)", "")),
        "source": source,
        "sourceShort": derive_source_short(source),
        "sourceUrl": extract_source_url(source),
        "originalCategory": clean_value(row.get("Democracy Category (original)", ""))
        or "",
        "aspects": aspects,
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


def preprocess(
    input_path: Path = INPUT_CSV,
    output_path: Path = OUTPUT_JSON,
) -> list[dict]:
    """Read CSV, transform rows, write JSON, validate aspects. Returns the items."""
    rows = read_csv(input_path)
    print(f"Read {len(rows)} data rows from {input_path}")

    items: list[dict] = []
    skipped = 0

    for row in rows:
        item = transform_row(row)
        if item is None:
            skipped += 1
            continue
        items.append(item)

    print(f"Transformed {len(items)} items ({skipped} rows skipped)")

    threat_solutions = sum(1 for i in items if i["type"] == "threat-solution")
    threats = sum(1 for i in items if i["type"] == "threat")
    opportunities = sum(1 for i in items if i["type"] == "independent-opportunity")
    print(f"  Threat+Solution: {threat_solutions}, Threat: {threats}, Opportunity: {opportunities}")

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
    preprocess(INPUT_CSV, OUTPUT_JSON)
