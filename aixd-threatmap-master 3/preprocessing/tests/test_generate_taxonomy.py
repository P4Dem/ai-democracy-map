import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from generate_taxonomy import build_benefit_taxonomy, build_harm_taxonomy, CODE_RE, load_rows
from preprocess import INPUT_XLSX, extract_benefit_codes, extract_harm_codes, read_source

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_JSON = PROJECT_ROOT / "public" / "data" / "data.json"
HARM_TAX_JSON = PROJECT_ROOT / "public" / "data" / "harm_taxonomy.json"
BENEFIT_TAX_JSON = PROJECT_ROOT / "public" / "data" / "benefit_taxonomy.json"


def references_from_dataset() -> set[str]:
    """Every harm/benefit code referenced by the source dataset workbook."""
    refs: set[str] = set()
    for row in read_source(INPUT_XLSX):
        refs.update(extract_harm_codes(row))
        refs.update(extract_benefit_codes(row))
    return refs


def test_harm_taxonomy_structure():
    rows = load_rows()
    harm = build_harm_taxonomy(rows)

    assert len(harm["codes"]) > 0
    assert len(harm["tiers"]) > 0
    for code, entry in harm["codes"].items():
        assert entry["label"], code
        assert "cluster" in entry
        assert "description" in entry
        assert entry["tier"] in harm["tiers"] or entry["tier"] is None
    tier_ids = {c for tier in harm["tiers"].values() for c in tier["codeIds"]}
    assert tier_ids == set(harm["codes"].keys())


def test_benefit_taxonomy_structure():
    rows = load_rows()
    benefit = build_benefit_taxonomy(rows)

    assert len(benefit["codes"]) > 0
    assert len(benefit["groups"]) > 0
    for code, entry in benefit["codes"].items():
        assert entry["label"], code
        assert entry["name"], code
        assert "description" in entry
    group_ids = set(benefit["groups"].keys())
    assert group_ids <= set(benefit["codes"].keys())
    for group in benefit["groups"].values():
        assert set(group["codeIds"]) <= set(benefit["codes"].keys())


def test_all_dataset_references_resolve():
    refs = references_from_dataset()
    assert refs, "no code references found in the dataset workbook"

    rows = load_rows()
    harm_codes = set(build_harm_taxonomy(rows)["codes"].keys())
    benefit_codes = set(build_benefit_taxonomy(rows)["codes"].keys())

    missing_harm = sorted(c for c in refs if c.startswith("T") and c not in harm_codes)
    missing_benefit = sorted(c for c in refs if c.startswith("B") and c not in benefit_codes)
    assert not missing_harm, f"harm codes in dataset missing from taxonomy: {missing_harm}"
    assert not missing_benefit, f"benefit codes in dataset missing from taxonomy: {missing_benefit}"


def test_build_artifacts_are_reference_complete():
    """Every code referenced by the shipped data.json must have a taxonomy entry."""
    import json

    items = json.loads(DATA_JSON.read_text(encoding="utf-8"))
    harm_tax = json.loads(HARM_TAX_JSON.read_text(encoding="utf-8"))["codes"]
    benefit_tax = json.loads(BENEFIT_TAX_JSON.read_text(encoding="utf-8"))["codes"]

    used_harm = {c for item in items for c in item.get("harmCodes", [])}
    used_benefit = {c for item in items for c in item.get("benefitCodes", [])}

    assert used_harm, "no harm codes present in data.json"
    assert used_benefit, "no benefit codes present in data.json"

    missing_harm = sorted(c for c in used_harm if c not in harm_tax)
    missing_benefit = sorted(c for c in used_benefit if c not in benefit_tax)
    assert not missing_harm, f"data.json codes missing from harm_taxonomy.json: {missing_harm}"
    assert not missing_benefit, f"data.json codes missing from benefit_taxonomy.json: {missing_benefit}"

    for code in sorted(used_harm):
        assert harm_tax[code]["label"], f"harm code {code} has no label"
    for code in sorted(used_benefit):
        assert benefit_tax[code]["label"], f"benefit code {code} has no label"