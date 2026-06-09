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
            "Solution (paraphrased)": "Content authentication",
            "Independent Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) == "threat-solution"

    def test_threat_without_solution(self):
        row = {
            "Threat (paraphrased)": "AI deepfakes",
            "Solution (paraphrased)": "///",
            "Independent Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) == "threat"

    def test_threat_missing_solution_key(self):
        # No solution key at all — treated as absent
        row = {"Threat (paraphrased)": "AI deepfakes", "Independent Opportunity (paraphrased)": "///"}
        assert determine_type(row) == "threat"

    def test_independent_opportunity(self):
        row = {
            "Threat (paraphrased)": "///",
            "Solution (paraphrased)": "///",
            "Independent Opportunity (paraphrased)": "AI for citizen input",
        }
        assert determine_type(row) == "independent-opportunity"

    def test_skip_row(self):
        row = {
            "Threat (paraphrased)": "///",
            "Solution (paraphrased)": "///",
            "Independent Opportunity (paraphrased)": "///",
        }
        assert determine_type(row) is None

    def test_empty_values(self):
        row = {"Threat (paraphrased)": "", "Independent Opportunity (paraphrased)": ""}
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
            "P4Dem Category 1": "2.1 Free and Fair Elections",
            "P4Dem Category 2": "3.1 The Media in a Democratic Society",
            "P4Dem Category 3": "///",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
        }
        assert extract_aspects(row) == ["2.1", "3.1"]

    def test_empty_aspects(self):
        row = {
            "P4Dem Category 1": "///",
            "P4Dem Category 2": "",
            "P4Dem Category 3": "",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
        }
        assert extract_aspects(row) == []

    def test_deduplication(self):
        row = {
            "P4Dem Category 1": "2.1 Free and Fair Elections",
            "P4Dem Category 2": "2.1 Free and Fair Elections",
            "P4Dem Category 3": "",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
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
            "Solution (paraphrased)": "Content authentication",
            "Solution (verbatim)": "watermarking...",
            "Independent Opportunity (paraphrased)": "///",
            "Independent Opportunity (verbatim)": "///",
            "Source": "George, R. and Klaus, I. (2026). Test. Available at: https://example.org",
            "P4Dem Category 1": "2.1 Free and Fair Elections",
            "P4Dem Category 2": "///",
            "P4Dem Category 3": "",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
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
            "Solution (paraphrased)": "///",
            "Solution (verbatim)": "///",
            "Independent Opportunity (paraphrased)": "AI scales citizen input",
            "Independent Opportunity (verbatim)": "AI can scale...",
            "Source": "Tsai, L.L., Pentland, A., Braley, A., Chen, N., Enríquez, J.R. and Reuel, A. (2024). Test.",
            "P4Dem Category 1": "3.2 Opinion Formation",
            "P4Dem Category 2": "",
            "P4Dem Category 3": "",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
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
            "Solution (paraphrased)": "///",
            "Solution (verbatim)": "///",
            "Independent Opportunity (paraphrased)": "///",
            "Independent Opportunity (verbatim)": "///",
            "Source": "///",
            "P4Dem Category 1": "",
            "P4Dem Category 2": "",
            "P4Dem Category 3": "",
            "P4Dem Category 4": "",
            "P4Dem Category 5": "",
            "P4Dem Category 6": "",
        }
        assert transform_row(row) is None
