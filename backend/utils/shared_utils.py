"""
ECOOPS — Shared Utilities

Common functions used by both the CLI (ecoops.py) and the web
dashboard (web_app.py).  Centralised here to avoid duplication.
"""

import re
from typing import List


def format_commits_data(gitlab, commits: list) -> str:
    """Format commit data with diffs for Gemini analysis.

    Args:
        gitlab: GitLabClient instance (used for get_commit_diff).
        commits: List of commit dicts from GitLab API.

    Returns:
        Multi-line string summarising commits and changed files.
    """
    result = []
    for i, commit in enumerate(commits):
        sha = commit["id"]
        title = commit.get("title", "")
        date = commit.get("created_at", "")[:10]

        try:
            diff = gitlab.get_commit_diff(sha)
            changed_files = [d.get("new_path", d.get("old_path", ""))
                             for d in diff]
        except Exception:
            changed_files = ["(could not fetch diff)"]

        files_str = ", ".join(changed_files) if changed_files else "(none)"
        result.append(
            f"Commit {i + 1} [{date}] {sha[:8]}: {title}\n"
            f"  Changed: {files_str}"
        )

    return "\n".join(result)


def format_repo_tree(tree: list) -> str:
    """Format repository tree for Gemini analysis.

    Args:
        tree: List of tree-item dicts from GitLab API.

    Returns:
        Multi-line string with emoji-prefixed file/dir paths.
    """
    lines = []
    for item in tree:
        prefix = "📁 " if item["type"] == "tree" else "📄 "
        lines.append(f"{prefix}{item['path']}")
    return "\n".join(lines)


def count_optimized_jobs(waste_analysis: str) -> int:
    """Count the number of wasted jobs found in analysis.

    Args:
        waste_analysis: Raw Gemini analysis text.

    Returns:
        Number of jobs listed (minimum 1).
    """
    count = len(re.findall(r"\*\*Job Name\*\*:", waste_analysis))
    return max(count, 1)


def parse_monthly_minutes(waste_analysis: str) -> float:
    """Extract estimated monthly waste minutes from analysis.

    Searches for 'monthly waste' or 'total wasted ci minutes' lines
    in the analysis text.

    Args:
        waste_analysis: Raw Gemini analysis text.

    Returns:
        Estimated monthly wasted minutes (0 if not found).
    """
    for line in waste_analysis.split("\n"):
        if "monthly waste" in line.lower():
            nums = re.findall(r"[\d,]+\.?\d*", line)
            if nums:
                return float(nums[-1].replace(",", ""))
    # Fallback: look for total wasted minutes
    for line in waste_analysis.split("\n"):
        if "total wasted ci minutes" in line.lower():
            nums = re.findall(r"[\d,]+\.?\d*", line)
            if nums:
                return float(nums[-1].replace(",", ""))
    return 0
