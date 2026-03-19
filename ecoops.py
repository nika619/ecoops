"""
ECOOPS — Emission Cost Optimizer — Operations Pipeline System

Main CLI entrypoint that orchestrates the full pipeline:
  1. Fetch pipeline & commit data from GitLab
  2. Analyze waste patterns using Gemini AI
  3. Generate optimized .gitlab-ci.yml
  4. Validate with GitLab CI Linter
  5. Create branch + commit with optimized YAML
  6. Create Merge Request with Green Impact Report

Usage:
  python ecoops.py
  python ecoops.py --project-id 12345
  python ecoops.py --dry-run
"""

import os
import sys
import json
import argparse
import re
from datetime import datetime

from dotenv import load_dotenv

from gitlab_client import GitLabClient
from gemini_client import GeminiClient
from reporter import generate_impact_report


def print_banner():
    """Print the ECOOPS banner."""
    print("""
╔══════════════════════════════════════════════════╗
║  🌱 ECOOPS                                      ║
║  Emission Cost Optimizer                         ║
║  Operations Pipeline System                      ║
╚══════════════════════════════════════════════════╝
    """)


def format_commits_data(gitlab: GitLabClient, commits: list) -> str:
    """Format commit data with diffs for Gemini analysis."""
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
    """Format repository tree for Gemini analysis."""
    lines = []
    for item in tree:
        prefix = "📁 " if item["type"] == "tree" else "📄 "
        lines.append(f"{prefix}{item['path']}")
    return "\n".join(lines)


def count_optimized_jobs(waste_analysis: str) -> int:
    """Count the number of wasted jobs found in analysis."""
    count = len(re.findall(r"\*\*Job Name\*\*:", waste_analysis))
    return max(count, 1)


def main():
    """Main ECOOPS pipeline."""
    print_banner()

    # ── Parse Arguments ─────────────────────────────────────
    parser = argparse.ArgumentParser(
        description="ECOOPS — CI/CD Pipeline Optimizer")
    parser.add_argument("--project-id", type=int,
                        help="GitLab project ID")
    parser.add_argument("--dry-run", action="store_true",
                        help="Analyze only, don't create MR")
    parser.add_argument("--branch", default="ecoops/optimize-pipeline",
                        help="Branch name for optimized YAML")
    parser.add_argument("--json", dest="json_output", action="store_true",
                        help="Output results as JSON (for CI integration)")
    parser.add_argument("--verbose", action="store_true",
                        help="Show detailed debug output")
    args = parser.parse_args()

    # ── Load Environment ────────────────────────────────────
    load_dotenv()

    gitlab_token = os.getenv("GITLAB_TOKEN")
    gemini_key = os.getenv("GEMINI_API_KEY")
    project_id = args.project_id or int(
        os.getenv("GITLAB_PROJECT_ID", "0"))
    base_url = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")

    if not gitlab_token:
        print("❌ GITLAB_TOKEN not set. Add it to .env file.")
        sys.exit(1)
    if not gemini_key:
        print("❌ GEMINI_API_KEY not set. Add it to .env file.")
        sys.exit(1)
    if not project_id:
        print("❌ Project ID not set. Use --project-id or .env.")
        sys.exit(1)

    # ── Initialize Clients ──────────────────────────────────
    gitlab = GitLabClient(gitlab_token, project_id, base_url)
    gemini = GeminiClient(gemini_key)

    print(f"📋 Project ID: {project_id}")
    print(f"🌿 Branch: {args.branch}")
    print()

    # ── Step 1: Fetch Data ──────────────────────────────────
    print("═" * 50)
    print("📡 Step 1: Fetching pipeline and commit data...")
    print("═" * 50)

    try:
        project = gitlab.get_project()
        print(f"   Project: {project['name_with_namespace']}")
        default_branch = project.get("default_branch", "main")
    except Exception as e:
        print(f"❌ Failed to fetch project: {e}")
        sys.exit(1)

    try:
        commits = gitlab.fetch_commits(per_page=50,
                                       ref_name=default_branch)
        print(f"   ✅ Fetched {len(commits)} commits")
    except Exception as e:
        print(f"❌ Failed to fetch commits: {e}")
        sys.exit(1)

    try:
        ci_yaml = gitlab.get_file_content(".gitlab-ci.yml",
                                          ref=default_branch)
        print(f"   ✅ Read .gitlab-ci.yml ({len(ci_yaml)} bytes)")
    except Exception as e:
        print(f"❌ Failed to read .gitlab-ci.yml: {e}")
        sys.exit(1)

    try:
        tree = gitlab.list_repository_tree(ref=default_branch)
        print(f"   ✅ Mapped repo structure ({len(tree)} items)")
    except Exception as e:
        print(f"⚠️  Could not fetch repo tree: {e}")
        tree = []

    commits_data = format_commits_data(gitlab, commits)
    repo_tree = format_repo_tree(tree) if tree else "(unavailable)"

    # ── Step 2: Analyze Waste ───────────────────────────────
    print()
    print("═" * 50)
    print("🔍 Step 2: Analyzing pipeline waste with Gemini...")
    print("═" * 50)

    try:
        waste_analysis = gemini.analyze_waste(ci_yaml, commits_data,
                                              repo_tree)
        print("   ✅ Waste analysis complete")
        print()
        print(waste_analysis)
        print()
    except Exception as e:
        print(f"❌ Gemini analysis failed: {e}")
        sys.exit(1)

    # ── Step 3: Generate Optimized YAML ─────────────────────
    print("═" * 50)
    print("⚙️  Step 3: Generating optimized CI configuration...")
    print("═" * 50)

    try:
        optimized_yaml = gemini.generate_optimized_yaml(ci_yaml,
                                                        waste_analysis)
        print(f"   ✅ Optimized YAML generated ({len(optimized_yaml)}"
              f" bytes)")
    except Exception as e:
        print(f"❌ YAML optimization failed: {e}")
        sys.exit(1)

    # ── Step 4: Validate YAML ───────────────────────────────
    print()
    print("═" * 50)
    print("🔧 Step 4: Validating with GitLab CI Linter...")
    print("═" * 50)

    try:
        lint_result = gitlab.validate_ci_yaml(optimized_yaml)
        if lint_result.get("valid"):
            print("   ✅ CI Linter: YAML is valid!")
        else:
            errors = lint_result.get("errors", [])
            print(f"   ⚠️  CI Linter found issues: {errors}")
            print("   Proceeding anyway (may need manual review)")
    except Exception as e:
        print(f"   ⚠️  Could not validate: {e}")

    if args.dry_run:
        print()
        print("═" * 50)
        print("🏁 DRY RUN — Skipping branch/MR creation")
        print("═" * 50)
        print()
        print("Optimized YAML preview:")
        print("─" * 40)
        print(optimized_yaml)
        print("─" * 40)

        # Still generate and print the report
        jobs_count = count_optimized_jobs(waste_analysis)
        report = generate_impact_report(waste_analysis, jobs_count)
        print()
        print(report)
        return

    # ── Step 5: Create Branch + Commit ──────────────────────
    print()
    print("═" * 50)
    print("📤 Step 5: Creating branch and committing...")
    print("═" * 50)

    try:
        gitlab.create_branch(args.branch, ref=default_branch)
        print(f"   ✅ Created branch: {args.branch}")
    except Exception as e:
        if "already exists" in str(e).lower() or "400" in str(e):
            print(f"   ℹ️  Branch {args.branch} already exists, reusing")
        else:
            print(f"❌ Failed to create branch: {e}")
            sys.exit(1)

    try:
        gitlab.create_commit(
            branch=args.branch,
            message="🌱 ECOOPS: Optimize pipeline with rules:changes",
            actions=[{
                "action": "update",
                "file_path": ".gitlab-ci.yml",
                "content": optimized_yaml,
            }]
        )
        print("   ✅ Committed optimized .gitlab-ci.yml")
    except Exception as e:
        print(f"❌ Failed to commit: {e}")
        sys.exit(1)

    # ── Step 6: Create MR + Report ──────────────────────────
    print()
    print("═" * 50)
    print("📊 Step 6: Creating Merge Request + Impact Report...")
    print("═" * 50)

    jobs_count = count_optimized_jobs(waste_analysis)
    report = generate_impact_report(waste_analysis, jobs_count)

    try:
        monthly_minutes = parse_monthly_minutes(waste_analysis)
        title_minutes = int(monthly_minutes) if monthly_minutes else "N"
        mr = gitlab.create_merge_request(
            source_branch=args.branch,
            target_branch=default_branch,
            title=(f"🌱 ECOOPS: Optimize pipeline to save "
                   f"{title_minutes} "
                   f"CI minutes/month"),
            description=(
                "This MR optimizes `.gitlab-ci.yml` by adding "
                "`rules:changes:` blocks to reduce wasted CI compute.\n\n"
                "Generated by **ECOOPS** 🌱 — Emission Cost Optimizer"
            ),
        )
        mr_iid = mr["iid"]
        mr_url = mr.get("web_url", "")
        print(f"   ✅ Created MR !{mr_iid}: {mr_url}")
    except Exception as e:
        print(f"❌ Failed to create MR: {e}")
        sys.exit(1)

    try:
        gitlab.post_mr_note(mr_iid, report)
        print("   ✅ Posted Green Impact Report as MR comment")
    except Exception as e:
        print(f"⚠️  Could not post report: {e}")

    # ── Done ────────────────────────────────────────────────
    print()
    print("═" * 50)
    print("🎉 ECOOPS optimization complete!")
    print("═" * 50)
    print()
    print(f"   🔗 Merge Request: {mr_url}")
    print(f"   🌿 Branch: {args.branch}")
    print(f"   📊 Jobs optimized: {jobs_count}")
    print()
    print(report)

    # JSON output for CI integration
    if args.json_output:
        from reporter import parse_waste_metrics, calculate_savings
        metrics = parse_waste_metrics(waste_analysis)
        savings = calculate_savings(metrics)
        output = {
            "mr_url": mr_url,
            "mr_iid": mr_iid,
            "branch": args.branch,
            "jobs_optimized": jobs_count,
            "metrics": metrics,
            "savings": savings,
        }
        print("\n--- JSON OUTPUT ---")
        print(json.dumps(output, indent=2))


def parse_monthly_minutes(waste_analysis: str) -> float:
    """Extract estimated monthly waste minutes from analysis."""
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


if __name__ == "__main__":
    main()
