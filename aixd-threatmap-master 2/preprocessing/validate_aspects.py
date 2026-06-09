#!/usr/bin/env python3
"""Validate aspects.json against the JSON schema and cross-check with data.json."""

import json
import sys
from pathlib import Path

try:
    import jsonschema
except ImportError:
    print("Install jsonschema: pip install jsonschema")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ASPECTS_JSON = PROJECT_ROOT / "public" / "data" / "aspects.json"
SCHEMA_JSON = Path(__file__).resolve().parent / "aspects-schema.json"
DATA_JSON = PROJECT_ROOT / "public" / "data" / "data.json"


def validate():
    with open(SCHEMA_JSON) as f:
        schema = json.load(f)
    with open(ASPECTS_JSON) as f:
        aspects = json.load(f)

    # Schema validation
    try:
        jsonschema.validate(aspects, schema)
        print(f"OK: Schema validation passed ({len(aspects)} aspects)")
    except jsonschema.ValidationError as e:
        print(f"FAIL: Schema validation error: {e.message}")
        print(f"  Path: {'.'.join(str(p) for p in e.path)}")
        return False

    # Internal consistency: code matches key, pillarCode matches code prefix
    for key, aspect in aspects.items():
        if aspect["code"] != key:
            print(f"FAIL: Key '{key}' has code '{aspect['code']}' — must match")
            return False
        expected_pillar = key.split(".")[0]
        if aspect["pillarCode"] != expected_pillar:
            print(f"FAIL: Aspect '{key}' has pillarCode '{aspect['pillarCode']}' but code implies '{expected_pillar}'")
            return False

    # Check pillar name consistency within each pillar
    pillars: dict[str, str] = {}
    for key, aspect in aspects.items():
        pc = aspect["pillarCode"]
        if pc in pillars:
            if pillars[pc] != aspect["pillar"]:
                print(f"FAIL: Pillar {pc} has inconsistent names: '{pillars[pc]}' vs '{aspect['pillar']}'")
                return False
        else:
            pillars[pc] = aspect["pillar"]

    print(f"OK: {len(pillars)} pillars: {', '.join(f'{k}={v}' for k, v in sorted(pillars.items()))}")

    # Cross-check with data.json if it exists
    if DATA_JSON.exists():
        with open(DATA_JSON) as f:
            items = json.load(f)
        used_codes = set()
        for item in items:
            for code in item.get("aspects", []):
                used_codes.add(code)
        unknown = used_codes - set(aspects.keys())
        unused = set(aspects.keys()) - used_codes
        if unknown:
            print(f"WARNING: {len(unknown)} codes in data.json not in aspects.json: {sorted(unknown)}")
        if unused:
            print(f"INFO: {len(unused)} codes in aspects.json not used by any data item: {sorted(unused)}")
        print(f"OK: Cross-check — {len(used_codes)} codes in data, {len(unknown)} unknown, {len(unused)} unused")

    return True


if __name__ == "__main__":
    success = validate()
    sys.exit(0 if success else 1)
