"""
ECOOPS — Web Dashboard

Flask-based web UI for the ECOOPS pipeline optimizer.
Provides a visual dashboard with live analysis progress,
interactive charts, and Green Impact Report rendering.

Usage:
  flask --app backend.web_app run --port 5001
  Then visit http://localhost:5001
"""

import os
import json
import threading
import queue

from flask import Flask, render_template, request, jsonify, Response
from dotenv import load_dotenv

from backend.utils.gitlab_client import GitLabClient
from backend.services.gemini_client import GeminiClient, QuotaExhaustedError
from backend.services.reporter import (parse_waste_metrics, calculate_savings,
                      generate_impact_report)
from backend.utils.run_logger import save_run_log
from backend.utils.shared_utils import (format_commits_data, format_repo_tree,
                          count_optimized_jobs)

load_dotenv()

# Resolve paths relative to repo root (one level up from backend/)
_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

app = Flask(__name__,
            template_folder=os.path.join(_ROOT, "templates", "web"),
            static_folder=os.path.join(_ROOT, "static"))
app.secret_key = os.urandom(24)

# ── Global state for SSE progress ───────────────────────────
progress_queues = {}


def get_queue(session_id: str) -> queue.Queue:
    """Get or create a queue for SSE progress updates."""
    if session_id not in progress_queues:
        progress_queues[session_id] = queue.Queue()
    return progress_queues[session_id]


def emit(session_id: str, event: str, data: dict) -> None:
    """Emit a progress event to the client."""
    q = get_queue(session_id)
    q.put({"event": event, "data": data})


# ── Routes ──────────────────────────────────────────────────

@app.route("/")
def index():
    """Serve the main dashboard."""
    return render_template("dashboard.html")


@app.route("/api/config", methods=["GET"])
def get_config():
    """Return current config (without sensitive data)."""
    return jsonify({
        "project_id": os.getenv("GITLAB_PROJECT_ID", ""),
        "base_url": os.getenv("GITLAB_BASE_URL", "https://gitlab.com"),
        "has_gitlab_token": bool(os.getenv("GITLAB_TOKEN")),
        "has_gemini_key": bool(os.getenv("GEMINI_API_KEY")),
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Start pipeline analysis (runs in background thread)."""
    data = request.get_json() or {}
    project_id = data.get("project_id") or os.getenv("GITLAB_PROJECT_ID")
    dry_run = data.get("dry_run", True)
    session_id = data.get("session_id", "default")

    if not project_id:
        return jsonify({"error": "Project ID is required"}), 400

    gitlab_token = os.getenv("GITLAB_TOKEN")
    gemini_key = os.getenv("GEMINI_API_KEY")

    if not gitlab_token:
        return jsonify({"error": "GITLAB_TOKEN not configured in .env"}), 400
    if not gemini_key:
        return jsonify({"error": "GEMINI_API_KEY not configured in .env"}), 400

    # Run analysis in background thread
    thread = threading.Thread(
        target=run_analysis,
        args=(session_id, int(project_id), gitlab_token, gemini_key, dry_run),
        daemon=True
    )
    thread.start()

    return jsonify({"status": "started", "session_id": session_id})


@app.route("/api/progress/<session_id>")
def progress(session_id):
    """SSE endpoint for live progress updates."""
    def generate():
        q = get_queue(session_id)
        while True:
            try:
                msg = q.get(timeout=300)
                event = msg["event"]
                data = json.dumps(msg["data"])
                yield f"event: {event}\ndata: {data}\n\n"
                if event in ("complete", "error"):
                    break
            except queue.Empty:
                yield f"event: ping\ndata: {{}}\n\n"

    return Response(generate(), mimetype="text/event-stream",
                    headers={
                        "Cache-Control": "no-cache",
                        "X-Accel-Buffering": "no",
                    })


# ── Analysis Pipeline ───────────────────────────────────────

# format_commits_data, format_repo_tree, and count_optimized_jobs
# are imported from shared_utils.py


def run_analysis(session_id: str, project_id: int, gitlab_token: str,
                 gemini_key: str, dry_run: bool) -> None:
    """Run the full ECOOPS analysis pipeline with progress events."""
    base_url = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")
    gitlab = GitLabClient(gitlab_token, project_id, base_url)
    gemini = GeminiClient(gemini_key)

    try:
        # ── Step 1: Fetch Data ─────────────────────────────
        emit(session_id, "step", {
            "step": 1, "title": "Fetching Pipeline Data",
            "description": "Connecting to GitLab API...",
            "icon": "📡", "status": "running"
        })

        project = gitlab.get_project()
        project_name = project["name_with_namespace"]
        default_branch = project.get("default_branch", "main")

        emit(session_id, "log", {
            "message": f"Project: {project_name}"
        })

        commits = gitlab.fetch_commits(per_page=50, ref_name=default_branch)
        emit(session_id, "log", {
            "message": f"Fetched {len(commits)} commits"
        })

        ci_yaml = gitlab.get_file_content(".gitlab-ci.yml",
                                          ref=default_branch)
        emit(session_id, "log", {
            "message": f"Read .gitlab-ci.yml ({len(ci_yaml)} bytes)"
        })

        tree = []
        try:
            tree = gitlab.list_repository_tree(ref=default_branch)
            emit(session_id, "log", {
                "message": f"Mapped {len(tree)} repo items"
            })
        except Exception:
            pass

        commits_data = format_commits_data(gitlab, commits)
        repo_tree = format_repo_tree(tree) if tree else "(unavailable)"

        emit(session_id, "step", {
            "step": 1, "title": "Fetching Pipeline Data",
            "icon": "📡", "status": "done",
            "detail": {
                "project": project_name,
                "commits": len(commits),
                "ci_size": len(ci_yaml),
                "tree_items": len(tree),
            }
        })

        # ── Step 2: Analyze Waste ──────────────────────────
        emit(session_id, "step", {
            "step": 2, "title": "Analyzing Waste Patterns",
            "description": "Gemini AI is analyzing your pipeline...",
            "icon": "🔍", "status": "running"
        })

        waste_analysis = gemini.analyze_waste(ci_yaml, commits_data,
                                              repo_tree)

        metrics = parse_waste_metrics(waste_analysis)
        savings = calculate_savings(metrics)
        jobs_count = count_optimized_jobs(waste_analysis)

        emit(session_id, "step", {
            "step": 2, "title": "Analyzing Waste Patterns",
            "icon": "🔍", "status": "done",
            "detail": {
                "waste_analysis": waste_analysis,
                "metrics": metrics,
                "savings": savings,
                "jobs_count": jobs_count,
            }
        })

        # ── Step 3: Generate Optimized YAML ────────────────
        emit(session_id, "step", {
            "step": 3, "title": "Generating Optimized YAML",
            "description": "Creating optimized CI configuration...",
            "icon": "⚙️", "status": "running"
        })

        optimized_yaml = gemini.generate_optimized_yaml(ci_yaml,
                                                         waste_analysis)

        emit(session_id, "step", {
            "step": 3, "title": "Generating Optimized YAML",
            "icon": "⚙️", "status": "done",
            "detail": {
                "original_yaml": ci_yaml,
                "optimized_yaml": optimized_yaml,
            }
        })

        # ── Step 4: Validate YAML ──────────────────────────
        emit(session_id, "step", {
            "step": 4, "title": "Validating Configuration",
            "description": "Running GitLab CI Linter...",
            "icon": "🔧", "status": "running"
        })

        lint_valid = False
        try:
            lint_result = gitlab.validate_ci_yaml(optimized_yaml)
            lint_valid = lint_result.get("valid", False)
        except Exception:
            pass

        emit(session_id, "step", {
            "step": 4, "title": "Validating Configuration",
            "icon": "🔧", "status": "done",
            "detail": {"valid": lint_valid}
        })

        # ── Step 5 & 6: Create MR (if not dry run) ────────
        mr_url = None
        if not dry_run:
            emit(session_id, "step", {
                "step": 5, "title": "Creating Merge Request",
                "description": "Pushing optimized YAML and creating MR...",
                "icon": "📤", "status": "running"
            })

            branch = "ecoops/optimize-pipeline"
            try:
                gitlab.create_branch(branch, ref=default_branch)
            except Exception:
                pass  # Branch may already exist

            try:
                gitlab.create_commit(
                    branch=branch,
                    message="🌱 ECOOPS: Optimize pipeline with rules:changes",
                    actions=[{
                        "action": "update",
                        "file_path": ".gitlab-ci.yml",
                        "content": optimized_yaml,
                    }]
                )
            except Exception as e:
                emit(session_id, "log", {
                    "message": f"Commit note: {str(e)[:100]}"
                })

            report = generate_impact_report(waste_analysis, jobs_count)

            try:
                mr = gitlab.create_merge_request(
                    source_branch=branch,
                    target_branch=default_branch,
                    title=f"🌱 ECOOPS: Optimize pipeline to save "
                          f"{int(savings['monthly']['minutes_saved'])} "
                          f"CI minutes/month",
                    description=(
                        "This MR optimizes `.gitlab-ci.yml` by adding "
                        "`rules:changes:` blocks.\n\n"
                        "Generated by **ECOOPS** 🌱"
                    ),
                )
                mr_url = mr.get("web_url", "")
                mr_iid = mr["iid"]

                gitlab.post_mr_note(mr_iid, report)

            except Exception as e:
                emit(session_id, "log", {
                    "message": f"MR note: {str(e)[:100]}"
                })

            emit(session_id, "step", {
                "step": 5, "title": "Creating Merge Request",
                "icon": "📤", "status": "done",
                "detail": {"mr_url": mr_url}
            })

        # ── Complete ───────────────────────────────────────
        result_data = {
            "project": project_name,
            "commits_analyzed": len(commits),
            "jobs_optimized": jobs_count,
            "metrics": metrics,
            "savings": savings,
            "waste_analysis": waste_analysis,
            "original_yaml": ci_yaml,
            "optimized_yaml": optimized_yaml,
            "lint_valid": lint_valid,
            "mr_url": mr_url,
            "dry_run": dry_run,
        }

        # Save run log
        try:
            log_path = save_run_log(result_data)
            emit(session_id, "log", {
                "message": f"Run log saved: {os.path.basename(log_path)}"
            })
        except Exception:
            pass

        emit(session_id, "complete", result_data)

    except QuotaExhaustedError as e:
        emit(session_id, "error", {
            "message": "Gemini API quota exhausted. Please use a different API key or wait and retry."
        })
    except Exception as e:
        emit(session_id, "error", {
            "message": str(e)[:500]
        })


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    print("\n🌱 ECOOPS Web Dashboard")
    print("   http://localhost:5001\n")
    app.run(debug=True, host="0.0.0.0", port=5001)
