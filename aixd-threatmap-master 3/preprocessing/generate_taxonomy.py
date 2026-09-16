#!/usr/bin/env python3
"""Generate harm/benefit taxonomy JSON from the client's codebook workbook.

Source: docs/20260828_Updated data + new labels + new descriptions.xlsx,
sheet "CODEBOOKS V0.53-ED".

Sheet layout (0-based columns):
  0  Code ID           e.g. "T0a.1", "B1", "B3A"  (empty on header rows)
  1  Cluster           "Context" / "Properties and capabilities" / "AI model use"
                       / "Downstream social dynamics"  (harm rows only)
  2  Mechanism / Tier  "Tier N – ..." headers, the "Pro-democracy mechanisms"
                       section header, and pro-dem PARENT names ("Civic & AI ...")
  3  Tier sub-headers  "Tier Na – ..."  (skipped)
  4  Sub-cluster       the code's short mechanism name
  5  Description        long description
  6  Definition        compressed one-line statement (the tooltip text)
  7  Accessible label   lay-public display title

Output (unchanged shape — consumed by the React app + covered by tests):
  public/data/harm_taxonomy.json
    { "tiers": { "tier0": {label, order, codeIds}, ... },
      "codes": { "T0a.1": {label, description, cluster, subCluster, tier, order}, ... } }
  public/data/benefit_taxonomy.json
    { "groups": { "B3": {name, order, codeIds}, ... },
      "codes": { "B3A": {label, description, name, subCluster, parent, order}, ... } }
"""

import json
import re
from pathlib import Path
from typing import Optional

import openpyxl

PROJECT_ROOT = Path(__file__).resolve().parent.parent
INPUT_XLSX = PROJECT_ROOT / "docs" / "20260828_Updated data + new labels + new descriptions.xlsx"
CODEBOOK_SHEET = "CODEBOOKS V0.53-ED"
HARM_OUTPUT = PROJECT_ROOT / "public" / "data" / "harm_taxonomy.json"
BENEFIT_OUTPUT = PROJECT_ROOT / "public" / "data" / "benefit_taxonomy.json"

CODE_RE = re.compile(r"^[TB][0-9]+[A-Za-z]?(?:\.[A-Za-z]?[0-9]+)?$")
TIER_RE = re.compile(r"^Tier\s+(\d+)\b", re.IGNORECASE)
BENEFIT_PARENT_RE = re.compile(r"^B[0-9]+$")
BENEFIT_CHILD_RE = re.compile(r"^B[0-9]+[A-Za-z]$")

CODE_COL = 0
CLUSTER_COL = 1
MECHANISM_COL = 2      # tier headers / section header / pro-dem parent name
SUB_TIER_COL = 3
SUB_CLUSTER_COL = 4
DESCRIPTION_COL = 5
DEFINITION_COL = 6     # one-line tooltip text
LABEL_COL = 7          # accessible display label


def clean(value: Optional[object]) -> str:
    return "" if value is None else str(value).strip()


def col(row: list[str], index: int) -> str:
    return clean(row[index]) if len(row) > index else ""


def load_rows() -> list[list[str]]:
    wb = openpyxl.load_workbook(INPUT_XLSX, data_only=True, read_only=True)
    ws = wb[CODEBOOK_SHEET]
    rows = [[clean(c) for c in row] for row in ws.iter_rows(values_only=True)]
    wb.close()
    return rows


def build_harm_taxonomy(rows: list[list[str]]) -> dict:
    tiers: dict[str, dict] = {}
    codes: dict[str, dict] = {}
    seen: set[str] = set()
    current_tier: Optional[str] = None

    for row in rows:
        code = col(row, CODE_COL)
        mechanism = col(row, MECHANISM_COL)

        if not code:
            tier_match = TIER_RE.match(mechanism)
            if tier_match:
                current_tier = f"tier{int(tier_match.group(1))}"
                tiers.setdefault(current_tier, {"label": mechanism, "codeIds": []})
            continue

        if not CODE_RE.match(code) or not code.upper().startswith("T"):
            continue
        if code in seen:
            raise ValueError(f"Duplicate harm code in workbook: {code}")
        seen.add(code)

        sub_cluster = col(row, SUB_CLUSTER_COL)
        label = col(row, LABEL_COL) or sub_cluster or code
        description = col(row, DEFINITION_COL) or col(row, DESCRIPTION_COL)

        codes[code] = {
            "label": label,
            "description": description,
            "cluster": col(row, CLUSTER_COL),
            "subCluster": sub_cluster,
            "tier": current_tier,
            "order": len(codes),
        }
        if current_tier:
            tiers[current_tier]["codeIds"].append(code)

    for tier in tiers.values():
        first = next(
            (codes[c]["order"] for c in tier["codeIds"] if c in codes), None
        )
        tier["order"] = first if first is not None else -1

    return {"tiers": tiers, "codes": codes}


def build_benefit_taxonomy(rows: list[list[str]]) -> dict:
    groups: dict[str, dict] = {}
    codes: dict[str, dict] = {}
    seen: set[str] = set()
    parent_code: Optional[str] = None
    parent_name: Optional[str] = None
    order_index = 0

    for row in rows:
        code = col(row, CODE_COL)
        if not code or not code.startswith("B"):
            continue
        if not (BENEFIT_PARENT_RE.match(code) or BENEFIT_CHILD_RE.match(code)):
            continue
        if code in seen:
            raise ValueError(f"Duplicate benefit code in workbook: {code}")
        seen.add(code)

        mechanism = col(row, MECHANISM_COL)
        sub_cluster = col(row, SUB_CLUSTER_COL)
        description = col(row, DEFINITION_COL) or col(row, DESCRIPTION_COL)
        is_parent = bool(BENEFIT_PARENT_RE.match(code))

        if is_parent:
            parent_code = code
            parent_name = mechanism or code

        name = parent_name or mechanism or code
        label = col(row, LABEL_COL) or sub_cluster or name or code

        codes[code] = {
            "label": label,
            "description": description,
            "name": name,
            "subCluster": "" if is_parent else sub_cluster,
            "parent": None if is_parent else parent_code,
            "order": order_index,
        }
        order_index += 1

        if is_parent:
            groups[code] = {"name": name, "order": codes[code]["order"], "codeIds": []}
        elif parent_code:
            groups.setdefault(
                parent_code, {"name": parent_name or "", "order": -1, "codeIds": []}
            )
            groups[parent_code]["codeIds"].append(code)

    return {"groups": groups, "codes": codes}


def main() -> None:
    rows = load_rows()
    harm = build_harm_taxonomy(rows)
    benefit = build_benefit_taxonomy(rows)

    HARM_OUTPUT.write_text(
        json.dumps(harm, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    BENEFIT_OUTPUT.write_text(
        json.dumps(benefit, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )

    print(f"harm_taxonomy.json    -> {len(harm['codes'])} harm codes, {len(harm['tiers'])} tiers")
    print(f"benefit_taxonomy.json -> {len(benefit['codes'])} benefit codes, {len(benefit['groups'])} groups")


if __name__ == "__main__":
    main()
