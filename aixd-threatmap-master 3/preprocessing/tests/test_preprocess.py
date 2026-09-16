"""Tests for the preprocessing pipeline."""

import sys
from pathlib import Path

# Ensure the preprocessing module is importable
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from preprocessing.preprocess import (
    is_empty,
    clean_value,
    determine_type,
    extract_aspect_code,
    extract_aspects,
    extract_source_url,
    derive_source_short,
    transform_row,
    mark_duplicates,
    read_csv,
)


class TestIsEmpty:
    def test_empty_string(self):
        assert is_empty("") is True

    def test_triple_slash(self):
        assert is_empty("///") is True

    def test_whitespace_triple_slash(self):
        assert is_empty("  ///  ") is True

    def test_actual_value(self):
        assert is_empty("AI-generated disinformation") is False


class TestDetermineType:
    def test_threat_with_solution(self):
        row = {
            "Threat (paraphrased)": "AI deepfakes",
            "Pro-dem Mitigation (paraphrased)": "Content authentication",
            "Pro-dem Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) == "threat-solution"

    def test_threat_without_solution(self):
        row = {
            "Threat (paraphrased)": "AI deepfakes",
            "Pro-dem Mitigation (paraphrased)": "///",
            "Pro-dem Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) == "threat"

    def test_threat_missing_solution_key(self):
        # No solution key at all — treated as absent
        row = {"Threat (paraphrased)": "AI deepfakes", "Pro-dem Opportunity (paraphrased)": "///"}
        assert determine_type(row) == "threat"

    def test_independent_opportunity(self):
        row = {
            "Threat (paraphrased)": "///",
            "Pro-dem Mitigation (paraphrased)": "///",
            "Pro-dem Opportunity (paraphrased)": "AI for citizen input",
        }
        assert determine_type(row) == "independent-opportunity"

    def test_skip_row(self):
        row = {
            "Threat (paraphrased)": "///",
            "Pro-dem Mitigation (paraphrased)": "///",
            "Pro-dem Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) is None

    def test_empty_values(self):
        row = {"Threat (paraphrased)": "", "Pro-dem Opportunity (paraphrased)": ""}
        assert determine_type(row) is None


class TestExtractAspectCode:
    def test_standard_format(self):
        assert extract_aspect_code("2.1 Free and Fair Elections") == "2.1"

    def test_leading_whitespace(self):
        assert extract_aspect_code(" 1.3 Civil and Political Rights") == "1.3"

    def test_primary_suffix(self):
        assert extract_aspect_code("3.2 Opinion Formation and Political Participation (primary)") == "3.2"

    def test_secondary_suffix(self):
        assert extract_aspect_code("1.1 Nationhood and Citizenship (secondary)") == "1.1"

    def test_empty_string(self):
        assert extract_aspect_code("") is None

    def test_no_code(self):
        assert extract_aspect_code("No code here") is None


class TestExtractAspects:
    def test_multiple_aspects(self):
        row = {
            "Democracy Aspect 1": "2.1 Free and Fair Elections",
            "Democracy Aspect 2": "3.1 The Media in a Democratic Society",
            "Democracy Aspect 3": "///",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        assert extract_aspects(row) == ["2.1", "3.1"]

    def test_empty_aspects(self):
        row = {
            "Democracy Aspect 1": "///",
            "Democracy Aspect 2": "",
            "Democracy Aspect 3": "",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        assert extract_aspects(row) == []

    def test_deduplication(self):
        row = {
            "Democracy Aspect 1": "2.1 Free and Fair Elections",
            "Democracy Aspect 2": "2.1 Free and Fair Elections",
            "Democracy Aspect 3": "",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        assert extract_aspects(row) == ["2.1"]


class TestExtractSourceUrl:
    def test_url_in_citation(self):
        citation = "George, R. (2026). AI and Democracy. Available at: https://example.org/paper"
        assert extract_source_url(citation) == "https://example.org/paper"

    def test_url_with_trailing_comma(self):
        citation = "Something https://example.org/paper, more text"
        assert extract_source_url(citation) == "https://example.org/paper"

    def test_no_url(self):
        assert extract_source_url("No URL in this citation") is None

    def test_empty(self):
        assert extract_source_url("") is None


class TestDeriveSourceShort:
    def test_two_authors(self):
        citation = "George, R. and Klaus, I. (2026). AI and Democracy."
        assert derive_source_short(citation) == "George & Klaus (2026)"

    def test_single_author(self):
        citation = "Jungherr, A. (2023). Artificial Intelligence and Democracy."
        assert derive_source_short(citation) == "Jungherr (2023)"

    def test_institutional_author(self):
        citation = "European Parliament (2020). Artificial Intelligence: Threats."
        assert derive_source_short(citation) == "European Parliament (2020)"

    def test_nist_abbreviation(self):
        citation = "National Institute of Standards and Technology (2023). AI Risk."
        assert derive_source_short(citation) == "NIST (2023)"

    def test_many_authors_et_al(self):
        citation = "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Generative AI."
        result = derive_source_short(citation)
        assert "(2024)" in result
        assert "Tsai" in result

    def test_already_et_al(self):
        citation = "Guzman Piedrahita, D., Banerjee, D., Blin, K., et al. (2026). Sociopolitical Risks."
        result = derive_source_short(citation)
        assert "(2026)" in result
        assert "Guzman Piedrahita" in result


class TestTransformRow:
    def test_threat_row(self):
        row = {
            "Stable ID": "1",
            "Democracy Category (original)": "Elections",
            "Threat (paraphrased)": "AI deepfakes undermine elections",
            "Threat (verbatim)": "deepfakes threaten...",
            "Pro-dem Mitigation (paraphrased)": "Content authentication",
            "Pro-dem Mitigation (verbatim)": "watermarking...",
            "Pro-dem Opportunity (paraphrased)": "///",
            "Pro-dem Opportunity (verbatim)": "///",
            "Source": "George, R. and Klaus, I. (2026). Test. Available at: https://example.org",
            "Democracy Aspect 1": "2.1 Free and Fair Elections",
            "Democracy Aspect 2": "///",
            "Democracy Aspect 3": "",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        result = transform_row(row)
        assert result is not None
        assert result["id"] == 1
        assert result["type"] == "threat-solution"
        assert result["description"] == "AI deepfakes undermine elections"
        assert result["solution"] == "Content authentication"
        assert result["aspects"] == ["2.1"]
        assert result["sourceUrl"] == "https://example.org"

    def test_opportunity_row(self):
        row = {
            "Stable ID": "5",
            "Democracy Category (original)": "Cross-cutting",
            "Threat (paraphrased)": "///",
            "Threat (verbatim)": "///",
            "Pro-dem Mitigation (paraphrased)": "///",
            "Pro-dem Mitigation (verbatim)": "///",
            "Pro-dem Opportunity (paraphrased)": "AI scales citizen input",
            "Pro-dem Opportunity (verbatim)": "AI can scale...",
            "Source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Test.",
            "Democracy Aspect 1": "3.2 Opinion Formation",
            "Democracy Aspect 2": "",
            "Democracy Aspect 3": "",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        result = transform_row(row)
        assert result is not None
        assert result["type"] == "independent-opportunity"
        assert result["description"] == "AI scales citizen input"
        assert result["solution"] is None

    def test_skip_empty_row(self):
        row = {
            "Stable ID": "99",
            "Democracy Category (original)": "///",
            "Threat (paraphrased)": "///",
            "Threat (verbatim)": "///",
            "Pro-dem Mitigation (paraphrased)": "///",
            "Pro-dem Mitigation (verbatim)": "///",
            "Pro-dem Opportunity (paraphrased)": "///",
            "Pro-dem Opportunity (verbatim)": "///",
            "Source": "///",
            "Democracy Aspect 1": "",
            "Democracy Aspect 2": "",
            "Democracy Aspect 3": "",
            "Democracy Aspect 4": "",
            "Democracy Aspect 5": "",
            "Democracy Aspect 6": "",
        }
        assert transform_row(row) is None


class TestMarkDuplicates:
    def _items(self):
        return [
            {"id": 1, "descriptionVerbatim": '"Deepfakes in elections"'},
            {"id": 2, "descriptionVerbatim": '"DEEPFAKES IN ELECTIONS"'},
            {"id": 3, "descriptionVerbatim": '"AI slop in forums"'},
            {"id": 4, "descriptionVerbatim": '"deepfakes   in   elections"'},
            {"id": 5, "descriptionVerbatim": "///"},
            {"id": 6, "descriptionVerbatim": ""},
        ]

    def test_first_kept_subsequent_flagged(self):
        items = self._items()
        n = mark_duplicates(items)
        assert n == 1
        assert items[0].get("isDuplicate") is not True
        assert items[1]["isDuplicate"] is True
        assert "isDuplicate" not in items[2]
        assert "isDuplicate" not in items[3]
        assert "isDuplicate" not in items[4]
        assert "isDuplicate" not in items[5]

    def test_verbatim_match_is_case_insensitive_not_inner_whitespace(self):
        items = self._items()
        mark_duplicates(items)
        assert items[1]["isDuplicate"] is True
        assert "isDuplicate" not in items[3]

    def test_empty_and_marker_never_grouped(self):
        items = self._items()
        n = mark_duplicates(items)
        assert n == 1
        assert "isDuplicate" not in items[4]
        assert "isDuplicate" not in items[5]


from preprocess import INPUT_XLSX, read_source

WORKBOOK = INPUT_XLSX


class TestDuplicateCensus:
    """Locks the dedup census on the committed source workbook (DATASET V 10.3)."""

    def test_duplicate_verbatim_groups_and_count(self):
        from collections import Counter

        items = []
        for row in read_source(WORKBOOK):
            item = transform_row(row)
            if item is not None:
                items.append(item)

        groups = Counter(
            row["descriptionVerbatim"].strip().lower()
            for row in items
            if row["descriptionVerbatim"].strip()
        )
        dup_groups = {k: v for k, v in groups.items() if v >= 2}
        entries_in_groups = sum(dup_groups.values())
        duplicate_entries = sum(v - 1 for v in dup_groups.values())

        assert len(dup_groups) == 17, f"expected 17 duplicate-verbatim groups, got {len(dup_groups)}"
        assert entries_in_groups == 45, f"expected 45 entries across groups, got {entries_in_groups}"
        assert duplicate_entries == 28, f"expected 28 flagged duplicates (45 - 17), got {duplicate_entries}"
        assert len(items) == 204
