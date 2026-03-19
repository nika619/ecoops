"""
ECOOPS — GitLab API Client

Handles all interactions with the GitLab REST API v4:
- Fetching pipelines, jobs, commits, and diffs
- Reading repository files
- Validating CI YAML via the CI Linter
- Creating branches, commits, and merge requests
- Posting merge request notes
"""

import time
import requests
from typing import Any, Dict, List, Optional


class GitLabClient:
    """Client for interacting with GitLab REST API v4."""

    def __init__(self, token: str, project_id: int,
                 base_url: str = "https://gitlab.com"):
        self.token = token
        self.project_id = project_id
        self.base_url = base_url.rstrip("/")
        self.api_url = f"{self.base_url}/api/v4"
        self.headers = {"PRIVATE-TOKEN": self.token}

    def _request(self, method: str, endpoint: str,
                 params: Optional[Dict] = None,
                 json_data: Optional[Dict] = None,
                 max_retries: int = 3) -> Any:
        """Make an HTTP request with automatic retry on 429."""
        url = f"{self.api_url}{endpoint}"
        for attempt in range(max_retries):
            response = getattr(requests, method)(
                url, headers=self.headers,
                params=params or {}, json=json_data, timeout=30
            )
            if response.status_code == 429:
                wait = int(response.headers.get("Retry-After",
                                                (attempt + 1) * 5))
                print(f"   ⏳ GitLab rate limit, retrying in {wait}s...")
                time.sleep(wait)
                continue
            response.raise_for_status()
            return response
        response.raise_for_status()  # final attempt error
        return response

    def _get(self, endpoint: str,
             params: Optional[Dict] = None) -> Any:
        """Make a GET request to the GitLab API."""
        return self._request("get", endpoint, params=params).json()

    def _post(self, endpoint: str, json_data: Dict) -> Any:
        """Make a POST request to the GitLab API."""
        return self._request("post", endpoint,
                             json_data=json_data).json()

    def _put(self, endpoint: str, json_data: Dict) -> Any:
        """Make a PUT request to the GitLab API."""
        return self._request("put", endpoint,
                             json_data=json_data).json()

    def _get_all_pages(self, endpoint: str,
                       params: Optional[Dict] = None,
                       max_pages: int = 10) -> List[Dict]:
        """Paginate through all results for a GET endpoint."""
        params = dict(params or {})
        params.setdefault("per_page", 100)
        results: List[Dict] = []
        for page in range(1, max_pages + 1):
            params["page"] = page
            resp = self._request("get", endpoint, params=params)
            data = resp.json()
            if not data:
                break
            results.extend(data)
            # Stop if fewer results than per_page (last page)
            if len(data) < params["per_page"]:
                break
        return results

    # ── Project Info ────────────────────────────────────────────

    def get_project(self) -> Dict:
        """Get project details."""
        return self._get(f"/projects/{self.project_id}")

    # ── Pipelines ───────────────────────────────────────────────

    def fetch_pipelines(self, per_page: int = 100,
                        status: str = "success") -> List[Dict]:
        """Fetch recent pipelines."""
        return self._get(
            f"/projects/{self.project_id}/pipelines",
            params={"per_page": per_page, "status": status,
                     "order_by": "id", "sort": "desc"}
        )

    def fetch_pipeline_jobs(self, pipeline_id: int) -> List[Dict]:
        """Fetch jobs for a specific pipeline."""
        return self._get(
            f"/projects/{self.project_id}/pipelines/{pipeline_id}/jobs",
            params={"per_page": 100}
        )

    # ── Commits ─────────────────────────────────────────────────

    def fetch_commits(self, per_page: int = 100,
                      ref_name: str = "main") -> List[Dict]:
        """Fetch recent commits."""
        return self._get(
            f"/projects/{self.project_id}/repository/commits",
            params={"per_page": per_page, "ref_name": ref_name}
        )

    def get_commit(self, sha: str) -> Dict:
        """Get a single commit's details."""
        return self._get(
            f"/projects/{self.project_id}/repository/commits/{sha}"
        )

    def get_commit_diff(self, sha: str) -> List[Dict]:
        """Get the diff of a commit (list of changed files)."""
        return self._get(
            f"/projects/{self.project_id}/repository/commits/{sha}/diff",
            params={"per_page": 100}
        )

    # ── Repository ──────────────────────────────────────────────

    def get_file_content(self, file_path: str,
                         ref: str = "main") -> str:
        """Get the decoded content of a file from the repository."""
        import base64
        data = self._get(
            f"/projects/{self.project_id}/repository/files/"
            f"{requests.utils.quote(file_path, safe='')}",
            params={"ref": ref}
        )
        return base64.b64decode(data["content"]).decode("utf-8")

    def list_repository_tree(self, path: str = "",
                             ref: str = "main",
                             recursive: bool = True) -> List[Dict]:
        """List files and directories in the repository."""
        return self._get_all_pages(
            f"/projects/{self.project_id}/repository/tree",
            params={"path": path, "ref": ref,
                     "recursive": str(recursive).lower()}
        )

    # ── CI Linter ───────────────────────────────────────────────

    def validate_ci_yaml(self, yaml_content: str) -> Dict:
        """Validate CI/CD YAML using the project CI linter."""
        return self._post(
            f"/projects/{self.project_id}/ci/lint",
            json_data={"content": yaml_content}
        )

    # ── Branches & Commits ──────────────────────────────────────

    def create_branch(self, branch_name: str,
                      ref: str = "main") -> Dict:
        """Create a new branch."""
        return self._post(
            f"/projects/{self.project_id}/repository/branches",
            json_data={"branch": branch_name, "ref": ref}
        )

    def create_commit(self, branch: str, message: str,
                      actions: List[Dict]) -> Dict:
        """Create a commit with file actions."""
        return self._post(
            f"/projects/{self.project_id}/repository/commits",
            json_data={
                "branch": branch,
                "commit_message": message,
                "actions": actions,
            }
        )

    # ── Merge Requests ──────────────────────────────────────────

    def create_merge_request(self, source_branch: str,
                             target_branch: str, title: str,
                             description: str = "") -> Dict:
        """Create a merge request."""
        return self._post(
            f"/projects/{self.project_id}/merge_requests",
            json_data={
                "source_branch": source_branch,
                "target_branch": target_branch,
                "title": title,
                "description": description,
            }
        )

    def post_mr_note(self, mr_iid: int, body: str) -> Dict:
        """Post a note/comment on a merge request."""
        return self._post(
            f"/projects/{self.project_id}/merge_requests/{mr_iid}/notes",
            json_data={"body": body}
        )

    # ── Job Logs ────────────────────────────────────────────────

    def get_job_log(self, job_id: int) -> str:
        """Get the trace/log of a job."""
        url = (f"{self.api_url}/projects/{self.project_id}"
               f"/jobs/{job_id}/trace")
        response = requests.get(url, headers=self.headers, timeout=30)
        response.raise_for_status()
        return response.text
