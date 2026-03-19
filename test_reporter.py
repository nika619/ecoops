"""
ECOOPS — Reporter Unit Tests

Tests for the Green Impact Report generation logic:
- parse_waste_metrics() parsing from various Gemini output formats
- calculate_savings() with known inputs
- generate_impact_report() output format
"""

import unittest
from reporter import parse_waste_metrics, calculate_savings, generate_impact_report


# Sample Gemini waste analysis output (realistic format)
SAMPLE_WASTE_ANALYSIS = """### Pipeline Waste Analysis

**Commits Analyzed**: 50
**Date Range**: 2026-02-18 to 2026-03-20

#### Wasted Jobs Found:

- **Job Name**: lint
- **Stage**: lint
- **Relevant Paths**: src/**/*.py, tests/**/*.py, .flake8
- **Total Runs**: 50
- **Wasted Runs**: 35
- **Waste Percentage**: 70%
- **Avg Duration**: 60s
- **Total Wasted Minutes**: 35.0

- **Job Name**: build
- **Stage**: build
- **Relevant Paths**: src/**/*.py, requirements.txt, setup.py
- **Total Runs**: 50
- **Wasted Runs**: 25
- **Waste Percentage**: 50%
- **Avg Duration**: 180s
- **Total Wasted Minutes**: 75.0

#### Summary:
- Total Wasted CI Minutes: 110.0
- Total Wasted Runs: 60
- Overall Waste Percentage: 60
- Estimated Monthly Waste: 110 minutes
- Days Analyzed: 30
"""

EMPTY_ANALYSIS = "No waste detected."


class TestParseWasteMetrics(unittest.TestCase):
    """Tests for parse_waste_metrics()."""

    def test_parses_standard_output(self):
        metrics = parse_waste_metrics(SAMPLE_WASTE_ANALYSIS)
        self.assertEqual(metrics["total_wasted_minutes"], 110.0)
        self.assertEqual(metrics["total_wasted_runs"], 60)
        self.assertEqual(metrics["waste_percentage"], 60.0)
        self.assertEqual(metrics["days_analyzed"], 30)
        self.assertEqual(metrics["commits_analyzed"], 50)

    def test_empty_analysis_returns_defaults(self):
        metrics = parse_waste_metrics(EMPTY_ANALYSIS)
        self.assertEqual(metrics["total_wasted_minutes"], 0)
        self.assertEqual(metrics["total_wasted_runs"], 0)
        self.assertEqual(metrics["waste_percentage"], 0)
        self.assertEqual(metrics["days_analyzed"], 1)
        self.assertEqual(metrics["commits_analyzed"], 0)

    def test_partial_analysis(self):
        partial = "- Total Wasted CI Minutes: 42.5\n- Commits Analyzed: 20"
        metrics = parse_waste_metrics(partial)
        self.assertEqual(metrics["total_wasted_minutes"], 42.5)
        self.assertEqual(metrics["commits_analyzed"], 20)
        # Other fields default
        self.assertEqual(metrics["total_wasted_runs"], 0)


class TestCalculateSavings(unittest.TestCase):
    """Tests for calculate_savings()."""

    def test_known_inputs(self):
        metrics = {
            "total_wasted_minutes": 420,
            "total_wasted_runs": 120,
            "waste_percentage": 60,
            "days_analyzed": 15,
            "commits_analyzed": 50,
        }
        savings = calculate_savings(metrics)

        # Monthly: 420 * (30/15) = 840 minutes
        self.assertEqual(savings["monthly"]["minutes_saved"], 840)
        # Cost: 840 * 0.008 = 6.72
        self.assertAlmostEqual(savings["monthly"]["cost_saved"], 6.72)
        # Energy: (840/60) * 0.5 = 7.0 kWh
        self.assertAlmostEqual(savings["monthly"]["energy_saved_kwh"], 7.0)
        # CO2: 7.0 * 0.385 = 2.695
        self.assertAlmostEqual(savings["monthly"]["co2_avoided_kg"], 2.70,
                               places=1)

    def test_zero_waste(self):
        metrics = {
            "total_wasted_minutes": 0,
            "total_wasted_runs": 0,
            "waste_percentage": 0,
            "days_analyzed": 30,
            "commits_analyzed": 50,
        }
        savings = calculate_savings(metrics)
        self.assertEqual(savings["monthly"]["minutes_saved"], 0)
        self.assertEqual(savings["monthly"]["cost_saved"], 0)
        self.assertEqual(savings["annual"]["hours_saved"], 0)

    def test_single_day_projection(self):
        metrics = {
            "total_wasted_minutes": 10,
            "total_wasted_runs": 5,
            "waste_percentage": 50,
            "days_analyzed": 1,
            "commits_analyzed": 10,
        }
        savings = calculate_savings(metrics)
        # 10 * (30/1) = 300 minutes
        self.assertEqual(savings["monthly"]["minutes_saved"], 300)


class TestGenerateImpactReport(unittest.TestCase):
    """Tests for generate_impact_report()."""

    def test_report_contains_key_sections(self):
        report = generate_impact_report(SAMPLE_WASTE_ANALYSIS, 2)
        self.assertIn("ECOOPS Green Impact Report", report)
        self.assertIn("Executive Summary", report)
        self.assertIn("Monthly Savings", report)
        self.assertIn("Annual Projection", report)
        self.assertIn("Methodology", report)
        self.assertIn("What Changed", report)
        self.assertIn("Before vs After", report)

    def test_report_contains_metrics(self):
        report = generate_impact_report(SAMPLE_WASTE_ANALYSIS, 2)
        self.assertIn("50 commits", report)
        self.assertIn("2 jobs", report)
        self.assertIn("$", report)
        self.assertIn("kWh", report)
        self.assertIn("CO₂", report)

    def test_report_with_zero_waste(self):
        report = generate_impact_report(EMPTY_ANALYSIS, 0)
        # Should still produce a valid report
        self.assertIn("ECOOPS Green Impact Report", report)
        self.assertIn("0 minutes", report)


if __name__ == "__main__":
    unittest.main()
