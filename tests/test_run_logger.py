"""
ECOOPS — Run Logger Unit Tests

Tests for the run logger module:
- Log file creation with correct directory
- Log content contains expected sections
- Handles minimal and full run data gracefully
"""

import os
import tempfile
import unittest
from unittest.mock import patch
from backend.utils.run_logger import save_run_log, LOGS_DIR


class TestSaveRunLog(unittest.TestCase):
    """Tests for save_run_log()."""

    def setUp(self):
        """Use a temp directory for logs."""
        self.temp_dir = tempfile.mkdtemp()

    def tearDown(self):
        """Clean up temp log files."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_creates_log_file(self, mock_logs_dir):
        mock_logs_dir.__str__ = lambda s: self.temp_dir
        # Patch LOGS_DIR used inside ensured function
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({
                "project": "test/project",
                "commits_analyzed": 10,
                "jobs_optimized": 2,
            })
            self.assertTrue(os.path.exists(path))
            self.assertTrue(path.endswith(".log"))

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_log_contains_header(self, mock_logs_dir):
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({
                "project": "user/my-app",
                "commits_analyzed": 50,
                "jobs_optimized": 3,
                "dry_run": True,
            })
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("ECOOPS", content)
            self.assertIn("user/my-app", content)
            self.assertIn("50", content)
            self.assertIn("Dry Run", content)

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_log_contains_metrics(self, mock_logs_dir):
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({
                "project": "test",
                "metrics": {
                    "total_wasted_minutes": 120,
                    "total_wasted_runs": 40,
                    "waste_percentage": 65,
                    "days_analyzed": 15,
                    "commits_analyzed": 50,
                },
                "savings": {
                    "monthly": {
                        "minutes_saved": 240,
                        "cost_saved": 1.92,
                        "energy_saved_kwh": 2.0,
                        "co2_avoided_kg": 0.77,
                        "trees_equivalent": 0.04,
                    },
                    "annual": {
                        "hours_saved": 48.0,
                        "cost_saved": 23.04,
                        "co2_avoided_kg": 9.24,
                        "trees_equivalent": 0.44,
                    },
                },
            })
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("Wasted Minutes", content)
            self.assertIn("120", content)
            self.assertIn("Monthly Savings", content)
            self.assertIn("240", content)

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_log_with_yaml_content(self, mock_logs_dir):
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({
                "project": "test",
                "original_yaml": "stages:\n  - test",
                "optimized_yaml": "stages:\n  - test\njob:\n  rules:\n    - changes:",
                "waste_analysis": "Found 2 wasted jobs",
            })
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("Original .gitlab-ci.yml", content)
            self.assertIn("Optimized .gitlab-ci.yml", content)
            self.assertIn("Waste Analysis", content)
            self.assertIn("Found 2 wasted jobs", content)

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_log_with_mr_url(self, mock_logs_dir):
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({
                "project": "test",
                "dry_run": False,
                "mr_url": "https://gitlab.com/user/project/-/merge_requests/1",
            })
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()

            self.assertIn("Live (MR created)", content)
            self.assertIn("merge_requests/1", content)

    @patch("backend.utils.run_logger.LOGS_DIR")
    def test_minimal_data(self, mock_logs_dir):
        """Should not crash with minimal input."""
        with patch("backend.utils.run_logger.LOGS_DIR", self.temp_dir):
            path = save_run_log({})
            self.assertTrue(os.path.exists(path))


if __name__ == "__main__":
    unittest.main()
