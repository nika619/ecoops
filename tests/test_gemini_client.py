"""
ECOOPS — Gemini Client Unit Tests

Tests for the Gemini API client, verifying:
- Quota error detection and QuotaExhaustedError raising
- Markdown fence stripping in generate_optimized_yaml
- Prompt construction for analyze_waste
"""

import unittest
from unittest.mock import patch, MagicMock
from backend.services.gemini_client import GeminiClient, QuotaExhaustedError


class TestGeminiClientGenerate(unittest.TestCase):
    """Tests for the _generate method."""

    @patch.object(GeminiClient, "_generate")
    def test_generate_returns_text(self, mock_gen):
        mock_gen.return_value = "Hello from Gemini"
        client = GeminiClient("fake-key")
        result = client._generate("say hello")
        self.assertEqual(result, "Hello from Gemini")

    def test_quota_error_detection(self):
        """Should raise QuotaExhaustedError on 429/rate/quota errors."""
        client = GeminiClient("fake-key")

        # Mock the genai client
        with patch.object(client, "client") as mock_client:
            mock_client.models.generate_content.side_effect = Exception(
                "429 Resource has been exhausted (e.g. check quota)."
            )
            with self.assertRaises(QuotaExhaustedError):
                client._generate("test prompt")

    def test_non_quota_error_propagates(self):
        """Non-quota errors should propagate normally."""
        client = GeminiClient("fake-key")

        with patch.object(client, "client") as mock_client:
            mock_client.models.generate_content.side_effect = Exception(
                "Invalid API key"
            )
            with self.assertRaises(Exception) as ctx:
                client._generate("test prompt")
            self.assertNotIsInstance(ctx.exception, QuotaExhaustedError)
            self.assertIn("Invalid API key", str(ctx.exception))


class TestGenerateOptimizedYaml(unittest.TestCase):
    """Tests for generate_optimized_yaml response processing."""

    def test_strips_markdown_fences(self):
        """Should strip ```yaml and ``` fences from response."""
        client = GeminiClient("fake-key")

        fenced_yaml = "```yaml\nstages:\n  - test\njob:\n  script: echo hi\n```"
        expected = "stages:\n  - test\njob:\n  script: echo hi"

        with patch.object(client, "_generate", return_value=fenced_yaml):
            result = client.generate_optimized_yaml("original", "analysis")
            self.assertEqual(result, expected)

    def test_no_fences_passes_through(self):
        """Plain YAML should pass through unchanged."""
        client = GeminiClient("fake-key")

        plain_yaml = "stages:\n  - test"

        with patch.object(client, "_generate", return_value=plain_yaml):
            result = client.generate_optimized_yaml("original", "analysis")
            self.assertEqual(result, plain_yaml)


class TestAnalyzeWaste(unittest.TestCase):
    """Tests for analyze_waste prompt construction."""

    def test_prompt_includes_ci_yaml(self):
        """The prompt sent to Gemini should include the CI YAML."""
        client = GeminiClient("fake-key")

        with patch.object(client, "_generate", return_value="analysis") as mock_gen:
            client.analyze_waste("stages:\n  - build", "commit data", "tree data")
            prompt = mock_gen.call_args[0][0]
            self.assertIn("stages:\n  - build", prompt)
            self.assertIn("commit data", prompt)
            self.assertIn("tree data", prompt)
            self.assertIn("Pipeline Waste Analysis", prompt)


if __name__ == "__main__":
    unittest.main()
