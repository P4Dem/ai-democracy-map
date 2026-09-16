#!/usr/bin/env python3
"""DEPRECATED — no-op kept so `bun run codes` still resolves.

Harm-tier and pro-dem mechanism codes now live in the dataset workbook itself
(docs/20260828_Updated data + new labels + new descriptions.xlsx, sheet
"DATASET V 10.3") and are emitted directly by `bun run preprocess`. There is no
longer a separate merge step from the mock JSX.
"""


def main() -> None:
    print(
        "extract_codes.py is a no-op: harm/benefit codes are produced by "
        "`bun run preprocess` from the dataset workbook."
    )


if __name__ == "__main__":
    main()
