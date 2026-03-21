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
import logging
import argparse

from dotenv import load_dotenv

from backend.utils.gitlab_client import GitLabClient
from backend.services.gemini_client import GeminiClient
from backend.services.reporter import generate_impact_report, parse_waste_metrics, calculate_savings
from backend.utils.run_logger import save_run_log
from backend.utils.shared_utils import (format_commits_data, format_repo_tree,
                                        count_optimized_jobs, parse_monthly_minutes)


def print_banner() -> None:
    """Print the ECOOPS banner."""
    print("""
╔══════════════════════════════════════════════════╗
║  🌱 ECOOPS                                      ║
║  Emission Cost Optimizer                         ║
║  Operations Pipeline System                      ║
╚══════════════════════════════════════════════════╝
    """)


logger = logging.getLogger("ecoops")


# format_commits_data, format_repo_tree, count_optimized_jobs,
# and parse_monthly_minutes are imported from shared_utils.py


def main() -> None:
    """Main ECOOPS pipeline."""
    # Ensure UTF-8 output on Windows (cp1252 can't encode emojis / box-drawing)
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")

    logging.basicConfig(
        level=logging.INFO,
        format="%(message)s",
    )
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
        logger.error("❌ GITLAB_TOKEN not set. Add it to .env file.")
        sys.exit(1)
    if not gemini_key:
        logger.error("❌ GEMINI_API_KEY not set. Add it to .env file.")
        sys.exit(1)
    if not project_id:
        logger.error("❌ Project ID not set. Use --project-id or .env.")
        sys.exit(1)

    # ── Initialize Clients ──────────────────────────────────
    gitlab = GitLabClient(gitlab_token, project_id, base_url)
    gemini = GeminiClient(gemini_key)

    logger.info(f"📋 Project ID: {project_id}")
    logger.info(f"🌿 Branch: {args.branch}")
    logger.info("")

    # ── Step 1: Fetch Data ──────────────────────────────────
    logger.info("═" * 50)
    logger.info("📡 Step 1: Fetching pipeline and commit data...")
    logger.info("═" * 50)

    try:
        project = gitlab.get_project()
        logger.info(f"   Project: {project['name_with_namespace']}")
        default_branch = project.get("default_branch", "main")
    except Exception as e:
        logger.error(f"❌ Failed to fetch project: {e}")
        sys.exit(1)

    try:
        commits = gitlab.fetch_commits(per_page=50,
                                       ref_name=default_branch)
        logger.info(f"   ✅ Fetched {len(commits)} commits")
    except Exception as e:
        logger.error(f"❌ Failed to fetch commits: {e}")
        sys.exit(1)

    try:
        ci_yaml = gitlab.get_file_content(".gitlab-ci.yml",
                                          ref=default_branch)
        logger.info(f"   ✅ Read .gitlab-ci.yml ({len(ci_yaml)} bytes)")
    except Exception as e:
        logger.error(f"❌ Failed to read .gitlab-ci.yml: {e}")
        sys.exit(1)

    try:
        tree = gitlab.list_repository_tree(ref=default_branch)
        logger.info(f"   ✅ Mapped repo structure ({len(tree)} items)")
    except Exception as e:
        logger.warning(f"⚠️  Could not fetch repo tree: {e}")
        tree = []

    commits_data = format_commits_data(gitlab, commits)
    repo_tree = format_repo_tree(tree) if tree else "(unavailable)"

    # ── Step 2: Analyze Waste ───────────────────────────────
    logger.info("")
    logger.info("═" * 50)
    logger.info("🔍 Step 2: Analyzing pipeline waste with Gemini...")
    logger.info("═" * 50)

    try:
        waste_analysis = gemini.analyze_waste(ci_yaml, commits_data,
                                              repo_tree)
        logger.info("   ✅ Waste analysis complete")
        logger.info("")
        logger.info(waste_analysis)
        logger.info("")
    except Exception as e:
        logger.error(f"❌ Gemini analysis failed: {e}")
        sys.exit(1)

    # ── Step 3: Generate Optimized YAML ─────────────────────
    logger.info("═" * 50)
    logger.info("⚙️  Step 3: Generating optimized CI configuration...")
    logger.info("═" * 50)

    try:
        optimized_yaml = gemini.generate_optimized_yaml(ci_yaml,
                                                        waste_analysis)
        logger.info(f"   ✅ Optimized YAML generated ({len(optimized_yaml)}"
                    f" bytes)")
    except Exception as e:
        logger.error(f"❌ YAML optimization failed: {e}")
        sys.exit(1)

    # ── Step 4: Validate YAML ───────────────────────────────
    logger.info("")
    logger.info("═" * 50)
    logger.info("🔧 Step 4: Validating with GitLab CI Linter...")
    logger.info("═" * 50)

    lint_valid = False
    try:
        lint_result = gitlab.validate_ci_yaml(optimized_yaml)
        if lint_result.get("valid"):
            logger.info("   ✅ CI Linter: YAML is valid!")
            lint_valid = True
        else:
            errors = lint_result.get("errors", [])
            logger.warning(f"   ⚠️  CI Linter found issues: {errors}")
            logger.info("   Proceeding anyway (may need manual review)")
    except Exception as e:
        logger.warning(f"   ⚠️  Could not validate: {e}")

    if args.dry_run:
        logger.info("")
        logger.info("═" * 50)
        logger.info("🏁 DRY RUN — Skipping branch/MR creation")
        logger.info("═" * 50)
        logger.info("")
        logger.info("Optimized YAML preview:")
        logger.info("─" * 40)
        logger.info(optimized_yaml)
        logger.info("─" * 40)

        # Still generate and print the report
        jobs_count = count_optimized_jobs(waste_analysis)
        report = generate_impact_report(waste_analysis, jobs_count)
        logger.info("")
        logger.info(report)
        return

    # ── Step 5: Create Branch + Commit ──────────────────────
    logger.info("")
    logger.info("═" * 50)
    logger.info("📤 Step 5: Creating branch and committing...")
    logger.info("═" * 50)

    try:
        gitlab.create_branch(args.branch, ref=default_branch)
        logger.info(f"   ✅ Created branch: {args.branch}")
    except Exception as e:
        if "already exists" in str(e).lower() or "400" in str(e):
            logger.info(f"   ℹ️  Branch {args.branch} already exists, reusing")
        else:
            logger.error(f"❌ Failed to create branch: {e}")
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
        logger.info("   ✅ Committed optimized .gitlab-ci.yml")
    except Exception as e:
        logger.error(f"❌ Failed to commit: {e}")
        sys.exit(1)

    # ── Step 6: Create MR + Report ──────────────────────────
    logger.info("")
    logger.info("═" * 50)
    logger.info("📊 Step 6: Creating Merge Request + Impact Report...")
    logger.info("═" * 50)

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
        logger.info(f"   ✅ Created MR !{mr_iid}: {mr_url}")
    except Exception as e:
        logger.error(f"❌ Failed to create MR: {e}")
        sys.exit(1)

    try:
        gitlab.post_mr_note(mr_iid, report)
        logger.info("   ✅ Posted Green Impact Report as MR comment")
    except Exception as e:
        logger.warning(f"⚠️  Could not post report: {e}")

    # ── Done ────────────────────────────────────────────────
    logger.info("")
    logger.info("═" * 50)
    logger.info("🎉 ECOOPS optimization complete!")
    logger.info("═" * 50)
    logger.info("")
    logger.info(f"   🔗 Merge Request: {mr_url}")
    logger.info(f"   🌿 Branch: {args.branch}")
    logger.info(f"   📊 Jobs optimized: {jobs_count}")
    logger.info("")
    logger.info(report)

    # JSON output for CI integration
    _metrics = parse_waste_metrics(waste_analysis)
    _savings = calculate_savings(_metrics)

    if args.json_output:
        output = {
            "mr_url": mr_url,
            "mr_iid": mr_iid,
            "branch": args.branch,
            "jobs_optimized": jobs_count,
            "metrics": _metrics,
            "savings": _savings,
        }
        print("\n--- JSON OUTPUT ---")
        print(json.dumps(output, indent=2))

    # Save run log
    log_path = save_run_log({
        "project": project.get("name_with_namespace", "unknown"),
        "commits_analyzed": len(commits),
        "jobs_optimized": jobs_count,
        "metrics": _metrics,
        "savings": _savings,
        "waste_analysis": waste_analysis,
        "original_yaml": ci_yaml,
        "optimized_yaml": optimized_yaml,
        "lint_valid": lint_valid,
        "mr_url": mr_url if not args.dry_run else None,
        "dry_run": args.dry_run,
    })
    logger.info(f"   📝 Run log saved: {log_path}")


# parse_monthly_minutes is now in shared_utils.py


if __name__ == "__main__":
    main()
