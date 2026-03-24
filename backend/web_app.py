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
import time
import logging

from flask import Flask, render_template, request, jsonify, Response, send_from_directory
from dotenv import load_dotenv

from backend.utils.gitlab_client import GitLabClient
from backend.services.gemini_client import GeminiClient, QuotaExhaustedError
from backend.services.reporter import (
    parse_waste_metrics, calculate_savings, generate_impact_report)
from backend.utils.run_logger import save_run_log
from backend.utils.shared_utils import (
    format_repo_tree, count_optimized_jobs)
from backend.config import (
    GEMINI_API_KEY, GITLAB_TOKEN, GITLAB_PROJECT_ID, GITLAB_BASE_URL)

load_dotenv(override=True)

logger = logging.getLogger("ecoops.web")

# Resolve paths relative to repo root (one level up from backend/)
_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")

app = Flask(__name__,
            template_folder=os.path.join(_ROOT, "templates", "web"),
            static_folder=os.path.join(_ROOT, "static"))
app.secret_key = os.getenv("FLASK_SECRET_KEY", os.urandom(24).hex())

# Allowed frontend origins for CORS
_ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5001,https://ecoops-ei3qr7hppq-uc.a.run.app"
).split(",")

# NOTE: SPA serving is handled by serve_vite() below.
# The /api/gemini-key endpoint is defined as get_gemini_key() below.


# ── AudioWorklet: serve pcm-worklet.js with correct MIME type ──
_PCM_WORKLET_JS = """\
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(1024);
    this._pos = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const channelData = input[0];
    for (let i = 0; i < channelData.length; i++) {
      this._buffer[this._pos++] = channelData[i];
      if (this._pos >= this._buffer.length) {
        this.port.postMessage({ pcmChunk: this._buffer.slice() });
        this._pos = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-processor', PCMProcessor);
"""

@app.route("/pcm-worklet.js")
def serve_pcm_worklet():
    """Serve the PCM AudioWorklet processor for voice capture."""
    return Response(_PCM_WORKLET_JS, mimetype="application/javascript")


@app.after_request
def add_cors_headers(response):
    """Allow cross-origin requests from known frontend origins."""
    origin = request.headers.get("Origin", "")
    if any(origin.startswith(o.strip()) for o in _ALLOWED_ORIGINS):
        response.headers["Access-Control-Allow-Origin"] = origin
    else:
        # Fallback for dev
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:5173"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return response


# ── Thread-safe SSE progress with cleanup ────────────────────
_queue_lock = threading.Lock()
progress_queues: dict[str, queue.Queue] = {}


def get_queue(session_id: str) -> queue.Queue:
    """Get or create a queue for SSE progress updates (thread-safe)."""
    with _queue_lock:
        if session_id not in progress_queues:
            progress_queues[session_id] = queue.Queue()
        return progress_queues[session_id]


def cleanup_queue(session_id: str) -> None:
    """Remove a session's queue to prevent memory leaks."""
    with _queue_lock:
        progress_queues.pop(session_id, None)


def emit(session_id: str, event: str, data: dict) -> None:
    """Emit a progress event to the client."""
    q = get_queue(session_id)
    q.put({"event": event, "data": data})


# ── Routes ──────────────────────────────────────────────────

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_vite(path):
    """Serve the Vite React frontend or fallback to the old dashboard."""
    dist_dir = os.path.join(_ROOT, "frontend", "dist")

    # Don't intercept actual API routes
    if path and path.startswith("api/"):
        return jsonify({"error": "Not found"}), 404

    # Serve static files from the Vite build
    if path != "" and os.path.exists(os.path.join(dist_dir, path)):
        return send_from_directory(dist_dir, path)

    # Serve the Vite index.html for root and client-side routes
    if os.path.exists(os.path.join(dist_dir, "index.html")):
        return send_from_directory(dist_dir, "index.html")

    # Fallback for dev mode
    return render_template("dashboard.html")


@app.route("/api/config", methods=["GET"])
def get_config():
    """Return current config (without sensitive data)."""
    return jsonify({
        "project_id": str(GITLAB_PROJECT_ID) if GITLAB_PROJECT_ID else "",
        "base_url": GITLAB_BASE_URL,
        "has_gitlab_token": bool(GITLAB_TOKEN),
        "has_gemini_key": bool(GEMINI_API_KEY),
    })


@app.route("/api/gemini-key", methods=["GET"])
def get_gemini_key():
    """Return Gemini API key for frontend Live API WebSocket connection."""
    if not GEMINI_API_KEY:
        return jsonify({"error": "GEMINI_API_KEY not configured"}), 400
    return jsonify({"key": GEMINI_API_KEY})


@app.route("/api/analyze", methods=["POST"])
def analyze():
    """Start pipeline analysis (runs in background thread)."""
    data = request.get_json() or {}
    project_id = data.get("project_id") or os.getenv("GITLAB_PROJECT_ID")
    dry_run = data.get("dry_run", True)
    session_id = data.get("session_id", "default")

    # Validate project ID
    if not project_id:
        project_id = os.getenv("GITLAB_PROJECT_ID", "")
    try:
        project_id_int = int(project_id)
        if project_id_int <= 0:
            raise ValueError("Must be positive")
    except (ValueError, TypeError):
        return jsonify({"error": f"Invalid Project ID: '{project_id}'"}), 400

    gitlab_token = GITLAB_TOKEN
    gemini_key = GEMINI_API_KEY

    if not gitlab_token:
        return jsonify({"error": "GITLAB_TOKEN not configured in .env"}), 400
    if not gemini_key:
        return jsonify({"error": "GEMINI_API_KEY not configured in .env"}), 400

    # Run analysis in background thread
    thread = threading.Thread(
        target=run_analysis,
        args=(session_id, project_id_int, gitlab_token, gemini_key, dry_run),
        daemon=True
    )
    thread.start()

    return jsonify({"status": "started", "session_id": session_id})


@app.route("/api/progress/<session_id>")
def progress(session_id):
    """SSE endpoint for live progress updates.

    Uses a short heartbeat interval (15s) to keep the connection alive
    on Cloud Run, which drops idle QUIC/HTTP2 streams.
    """
    def generate():
        q = get_queue(session_id)
        try:
            while True:
                try:
                    # Short timeout → frequent heartbeats keep Cloud Run happy
                    msg = q.get(timeout=15)
                    event = msg["event"]
                    data = json.dumps(msg["data"])
                    yield f"event: {event}\ndata: {data}\n\n"
                    if event in ("complete", "error"):
                        break
                except queue.Empty:
                    # Heartbeat ping to prevent Cloud Run from killing the stream
                    yield ": keepalive\n\n"
        finally:
            # Clean up the queue to prevent memory leaks
            cleanup_queue(session_id)

    return Response(
        generate(), mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        })


# ── Analysis Pipeline ───────────────────────────────────────

def _format_commits_with_progress(gitlab, commits: list, session_id: str, emit_fn) -> str:
    """Format commit diffs while streaming progress log events.

    Replaces the shared format_commits_data for web use, adding per-commit
    SSE log events so the frontend HUD shows live progress during the slow
    50-API-call diff fetch.
    """
    result = []
    total = len(commits)
    for i, commit in enumerate(commits, 1):
        sha = commit["id"]
        title = commit.get("title", "")
        date = commit.get("created_at", "")[:10]

        try:
            diff = gitlab.get_commit_diff(sha)
            changed_files = [d.get("new_path", d.get("old_path", "")) for d in diff]
        except Exception:
            changed_files = ["(could not fetch diff)"]

        files_str = ", ".join(changed_files) if changed_files else "(none)"
        result.append(
            f"Commit {i} [{date}] {sha[:8]}: {title}\n"
            f"  Changed: {files_str}"
        )
        # Emit progress every 5 commits so logs don't spam
        if i % 5 == 0 or i == total:
            emit_fn(session_id, "log", {
                "message": f"Fetched diffs {i}/{total} commits..."
            })

    return "\n".join(result)


def run_analysis(session_id: str, project_id: int, gitlab_token: str,
                 gemini_key: str, dry_run: bool) -> None:
    """Run the full ECOOPS analysis pipeline with progress events.

    Emits exactly 6 steps for frontend alignment:
      Step 1: GitLab API — Fetch commits, diffs, .gitlab-ci.yml
      Step 2: Gemini AI — Analyze waste patterns
      Step 3: Gemini AI — Generate optimized YAML
      Step 4: GitLab CI Linter — Validate YAML
      Step 5: GitLab API — Create branch + commit
      Step 6: GitLab API — Open MR with Green Impact Report
    """
    base_url = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")
    gitlab = GitLabClient(gitlab_token, project_id, base_url)
    gemini = GeminiClient(gemini_key)

    try:
        # ── Step 1: Fetch Data ─────────────────────────────
        emit(session_id, "step", {
            "step": 1, "title": "GitLab API — Fetching Pipeline Data",
            "description": "Connecting to GitLab API, fetching commits & diffs...",
            "icon": "📡", "status": "running"
        })

        project = gitlab.get_project()
        project_name = project["name_with_namespace"]
        default_branch = project.get("default_branch", "main")

        emit(session_id, "log", {"message": f"Project: {project_name}"})

        # Cap at 25 commits for speed — still statistically significant
        commits = gitlab.fetch_commits(per_page=25, ref_name=default_branch)
        emit(session_id, "log", {"message": f"Fetched {len(commits)} commits — fetching diffs..."})

        ci_yaml = gitlab.get_file_content(".gitlab-ci.yml", ref=default_branch)
        emit(session_id, "log", {"message": f"Read .gitlab-ci.yml ({len(ci_yaml)} bytes)"})

        tree = []
        try:
            tree = gitlab.list_repository_tree(ref=default_branch)
            emit(session_id, "log", {"message": f"Mapped {len(tree)} repo items"})
        except Exception:
            pass

        # Fetch diffs with per-commit progress logs
        commits_data = _format_commits_with_progress(gitlab, commits, session_id, emit)
        repo_tree = format_repo_tree(tree) if tree else "(unavailable)"

        emit(session_id, "step", {
            "step": 1, "title": "GitLab API — Fetching Pipeline Data",
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
            "step": 2, "title": "Gemini AI — Analyzing Waste Patterns",
            "description": "Gemini is cross-referencing jobs with commit file changes...",
            "icon": "🤖", "status": "running"
        })

        # Heartbeat thread: keeps the frontend alive during slow Gemini calls
        import threading as _threading
        import concurrent.futures as _cf
        _stop_heartbeat = _threading.Event()

        def _heartbeat():
            msgs = [
                "Gemini is reading the CI config...",
                "Cross-referencing jobs with commit diffs...",
                "Identifying wasteful runs...",
                "Computing waste percentages...",
                "Finalizing waste analysis...",
            ]
            idx = 0
            while not _stop_heartbeat.wait(5.0):
                emit(session_id, "log", {"message": msgs[idx % len(msgs)]})
                idx += 1

        _hb = _threading.Thread(target=_heartbeat, daemon=True)
        _hb.start()

        try:
            with _cf.ThreadPoolExecutor(max_workers=1) as _pool:
                _future = _pool.submit(
                    gemini.analyze_waste, ci_yaml, commits_data, repo_tree
                )
                try:
                    waste_analysis = _future.result(timeout=90)
                except _cf.TimeoutError:
                    raise RuntimeError(
                        "Gemini API timed out after 90s. "
                        "The prompt may be too large — try again or check your API quota."
                    )
        finally:
            _stop_heartbeat.set()

        metrics = parse_waste_metrics(waste_analysis)
        savings = calculate_savings(metrics)
        jobs_count = count_optimized_jobs(waste_analysis)

        emit(session_id, "step", {
            "step": 2, "title": "Gemini AI — Analyzing Waste Patterns",
            "icon": "🤖", "status": "done",
            "detail": {
                "waste_analysis": waste_analysis,
                "metrics": metrics,
                "savings": savings,
                "jobs_count": jobs_count,
            }
        })

        # ── Step 3: Generate Optimized YAML ────────────────
        emit(session_id, "step", {
            "step": 3, "title": "Gemini AI — Generating Optimized YAML",
            "description": "Injecting rules:changes: blocks into wasteful jobs...",
            "icon": "⚙️", "status": "running"
        })

        optimized_yaml = gemini.generate_optimized_yaml(ci_yaml, waste_analysis)

        emit(session_id, "step", {
            "step": 3, "title": "Gemini AI — Generating Optimized YAML",
            "icon": "⚙️", "status": "done",
            "detail": {
                "original_yaml": ci_yaml,
                "optimized_yaml": optimized_yaml,
            }
        })

        # ── Step 4: Validate YAML ──────────────────────────
        emit(session_id, "step", {
            "step": 4, "title": "GitLab CI Linter — Validating YAML",
            "description": "Running GitLab CI Linter API on optimized config...",
            "icon": "🔧", "status": "running"
        })

        lint_valid = False
        try:
            lint_result = gitlab.validate_ci_yaml(optimized_yaml)
            lint_valid = lint_result.get("valid", False)
            emit(session_id, "log", {
                "message": f"CI Linter: {'✓ VALID' if lint_valid else '⚠ issues found'}"
            })
        except Exception as e:
            emit(session_id, "log", {"message": f"CI Linter skipped: {str(e)[:80]}"})

        emit(session_id, "step", {
            "step": 4, "title": "GitLab CI Linter — Validating YAML",
            "icon": "🔧", "status": "done",
            "detail": {"valid": lint_valid}
        })

        # ── Step 5: Create Branch + Commit ─────────────────
        mr_url = None
        if not dry_run:
            emit(session_id, "step", {
                "step": 5, "title": "GitLab API — Creating Branch + Commit",
                "description": "Pushing optimized YAML to ecoops/optimize-pipeline...",
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
                emit(session_id, "log", {"message": "✓ Committed optimized .gitlab-ci.yml"})
            except Exception as e:
                emit(session_id, "log", {"message": f"Commit note: {str(e)[:100]}"})

            emit(session_id, "step", {
                "step": 5, "title": "GitLab API — Creating Branch + Commit",
                "icon": "📤", "status": "done",
            })

            # ── Step 6: Create MR + Green Impact ──────────
            emit(session_id, "step", {
                "step": 6, "title": "GitLab API — Opening MR + Green Impact Report",
                "description": "Creating Merge Request with sustainability report...",
                "icon": "🌱", "status": "running"
            })

            report = generate_impact_report(waste_analysis, jobs_count)

            try:
                mr = gitlab.create_merge_request(
                    source_branch=branch,
                    target_branch=default_branch,
                    title=(
                        f"🌱 ECOOPS: Optimize pipeline to save "
                        f"{int(savings['monthly']['minutes_saved'])} CI minutes/month"
                    ),
                    description=(
                        "This MR optimizes `.gitlab-ci.yml` by adding "
                        "`rules:changes:` blocks.\n\n"
                        "Generated by **ECOOPS** 🌱"
                    ),
                )
                mr_url = mr.get("web_url", "")
                mr_iid = mr["iid"]
                gitlab.post_mr_note(mr_iid, report)
                emit(session_id, "log", {"message": f"✓ MR created: {mr_url}"})
            except Exception as e:
                emit(session_id, "log", {"message": f"MR note: {str(e)[:100]}"})

            emit(session_id, "step", {
                "step": 6, "title": "GitLab API — Opening MR + Green Impact Report",
                "icon": "🌱", "status": "done",
                "detail": {"mr_url": mr_url}
            })

        else:
            # Dry run — emit steps 5 and 6 visually so pulse reaches the end
            emit(session_id, "step", {
                "step": 5, "title": "GitLab API — Create Branch + Commit",
                "description": "Dry run — skipping actual commit...",
                "icon": "📤", "status": "running"
            })
            time.sleep(0.3)
            emit(session_id, "step", {
                "step": 5, "title": "GitLab API — Create Branch + Commit",
                "icon": "📤", "status": "done", "detail": {"dry_run": True}
            })

            emit(session_id, "step", {
                "step": 6, "title": "GitLab API — Open MR + Green Impact Report",
                "description": "Dry run — compiling impact metrics...",
                "icon": "🌱", "status": "running"
            })
            time.sleep(0.4)
            emit(session_id, "step", {
                "step": 6, "title": "GitLab API — Open MR + Green Impact Report",
                "icon": "🌱", "status": "done", "detail": {"dry_run": True}
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

        try:
            log_path = save_run_log(result_data)
            emit(session_id, "log", {
                "message": f"Run log saved: {os.path.basename(log_path)}"
            })
        except Exception:
            pass

        emit(session_id, "complete", result_data)

    except QuotaExhaustedError:
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
