"""
ECOOPS — GitLab Client Unit Tests

Tests for the GitLab REST API client, using mocked HTTP responses
to verify request construction, retry logic, and response parsing.
"""

import unittest
from unittest.mock import patch, MagicMock
from backend.utils.gitlab_client import GitLabClient


class TestGitLabClientInit(unittest.TestCase):
    """Tests for GitLabClient initialization."""

    def test_init_sets_attributes(self):
        client = GitLabClient("test-token", 12345, "https://gitlab.example.com")
        self.assertEqual(client.token, "test-token")
        self.assertEqual(client.project_id, 12345)
        self.assertEqual(client.base_url, "https://gitlab.example.com")
        self.assertEqual(client.api_url, "https://gitlab.example.com/api/v4")
        self.assertEqual(client.headers, {"PRIVATE-TOKEN": "test-token"})

    def test_init_strips_trailing_slash(self):
        client = GitLabClient("t", 1, "https://gitlab.com/")
        self.assertEqual(client.base_url, "https://gitlab.com")
        self.assertEqual(client.api_url, "https://gitlab.com/api/v4")


class TestGitLabClientRequests(unittest.TestCase):
    """Tests for HTTP request methods."""

    def setUp(self):
        self.client = GitLabClient("token", 999)

    @patch("gitlab_client.requests")
    def test_get_project(self, mock_requests):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "id": 999,
            "name": "test-project",
            "name_with_namespace": "user / test-project",
            "default_branch": "main",
        }
        mock_requests.get.return_value = mock_resp

        result = self.client.get_project()
        self.assertEqual(result["name"], "test-project")
        self.assertEqual(result["default_branch"], "main")

    @patch("gitlab_client.requests")
    def test_fetch_commits(self, mock_requests):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {"id": "abc123", "title": "Initial commit"},
            {"id": "def456", "title": "Add feature"},
        ]
        mock_requests.get.return_value = mock_resp

        commits = self.client.fetch_commits(per_page=5, ref_name="main")
        self.assertEqual(len(commits), 2)
        self.assertEqual(commits[0]["title"], "Initial commit")

    @patch("gitlab_client.requests")
    def test_validate_ci_yaml_valid(self, mock_requests):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"valid": True, "errors": []}
        mock_requests.post.return_value = mock_resp

        result = self.client.validate_ci_yaml("stages:\n  - test\n")
        self.assertTrue(result["valid"])
        self.assertEqual(result["errors"], [])

    @patch("gitlab_client.requests")
    def test_validate_ci_yaml_invalid(self, mock_requests):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "valid": False,
            "errors": ["jobs config should contain at least one visible job"],
        }
        mock_requests.post.return_value = mock_resp

        result = self.client.validate_ci_yaml("invalid: yaml:")
        self.assertFalse(result["valid"])
        self.assertIn("at least one visible job", result["errors"][0])

    @patch("gitlab_client.requests")
    def test_retry_on_429(self, mock_requests):
        """Should retry up to max_retries on 429 responses."""
        rate_resp = MagicMock()
        rate_resp.status_code = 429
        rate_resp.headers = {"Retry-After": "0"}

        ok_resp = MagicMock()
        ok_resp.status_code = 200
        ok_resp.json.return_value = {"id": 999}

        mock_requests.get.side_effect = [rate_resp, ok_resp]

        result = self.client._request("get", "/projects/999")
        self.assertEqual(mock_requests.get.call_count, 2)
        self.assertEqual(result.json()["id"], 999)

    @patch("gitlab_client.requests")
    def test_get_file_content(self, mock_requests):
        import base64
        content = base64.b64encode(b"stages:\n  - test\n").decode()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"content": content}
        mock_requests.get.return_value = mock_resp

        result = self.client.get_file_content(".gitlab-ci.yml")
        self.assertIn("stages:", result)

    @patch("gitlab_client.requests")
    def test_create_branch(self, mock_requests):
        mock_resp = MagicMock()
        mock_resp.status_code = 201
        mock_resp.json.return_value = {
            "name": "ecoops/optimize-pipeline",
            "commit": {"id": "abc123"},
        }
        mock_requests.post.return_value = mock_resp

        result = self.client.create_branch("ecoops/optimize-pipeline")
        self.assertEqual(result["name"], "ecoops/optimize-pipeline")


if __name__ == "__main__":
    unittest.main()
