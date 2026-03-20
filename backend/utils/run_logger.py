"""
ECOOPS — Run Logger

Saves detailed logs of each analysis run to the logs/ directory.
Each run creates a timestamped file with all analysis details:
- Project info, commits analyzed, waste analysis
- Savings metrics, optimized YAML, validation status
- MR link (if created)
"""

import os
import json
from datetime import datetime


LOGS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "..", "..", "logs"
)


def ensure_logs_dir():
    """Create logs directory if it doesn't exist."""
    os.makedirs(LOGS_DIR, exist_ok=True)


def save_run_log(run_data: dict) -> str:
    """
    Save a run log to a timestamped file.

    Args:
        run_data: dict with run details (project, metrics, yaml, etc.)

    Returns:
        Path to the saved log file.
    """
    ensure_logs_dir()

    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    project = run_data.get("project", "unknown").replace("/", "_").replace(" ", "_")
    filename = f"run_{ts}_{project}.log"
    filepath = os.path.join(LOGS_DIR, filename)

    lines = []
    lines.append("=" * 60)
    lines.append("  ECOOPS — Run Log")
    lines.append("=" * 60)
    lines.append(f"  Timestamp : {datetime.now().isoformat()}")
    lines.append(f"  Project   : {run_data.get('project', 'N/A')}")
    lines.append(f"  Mode      : {'Dry Run' if run_data.get('dry_run', True) else 'Live (MR created)'}")
    lines.append(f"  Commits   : {run_data.get('commits_analyzed', 0)}")
    lines.append(f"  Jobs Opt. : {run_data.get('jobs_optimized', 0)}")
    lines.append(f"  YAML Valid: {run_data.get('lint_valid', 'N/A')}")
    if run_data.get("mr_url"):
        lines.append(f"  MR URL    : {run_data['mr_url']}")
    lines.append("=" * 60)

    # ── Metrics ──
    metrics = run_data.get("metrics", {})
    if metrics:
        lines.append("")
        lines.append("── Waste Metrics ─────────────────────────────")
        lines.append(f"  Wasted Minutes    : {metrics.get('total_wasted_minutes', 0)}")
        lines.append(f"  Wasted Runs       : {metrics.get('total_wasted_runs', 0)}")
        lines.append(f"  Waste Percentage  : {metrics.get('waste_percentage', 0)}%")
        lines.append(f"  Days Analyzed     : {metrics.get('days_analyzed', 0)}")
        lines.append(f"  Commits Analyzed  : {metrics.get('commits_analyzed', 0)}")

    # ── Savings ──
    savings = run_data.get("savings", {})
    monthly = savings.get("monthly", {})
    annual = savings.get("annual", {})
    if monthly:
        lines.append("")
        lines.append("── Monthly Savings ───────────────────────────")
        lines.append(f"  Minutes Saved     : {monthly.get('minutes_saved', 0)}")
        lines.append(f"  Cost Saved        : ${monthly.get('cost_saved', 0)}")
        lines.append(f"  Energy (kWh)      : {monthly.get('energy_saved_kwh', 0)}")
        lines.append(f"  CO₂ Avoided (kg)  : {monthly.get('co2_avoided_kg', 0)}")
        lines.append(f"  Tree Equivalent   : {monthly.get('trees_equivalent', 0)}")
    if annual:
        lines.append("")
        lines.append("── Annual Projection ─────────────────────────")
        lines.append(f"  Hours Saved       : {annual.get('hours_saved', 0)}")
        lines.append(f"  Cost Saved        : ${annual.get('cost_saved', 0)}")
        lines.append(f"  CO₂ Avoided (kg)  : {annual.get('co2_avoided_kg', 0)}")
        lines.append(f"  Tree Equivalent   : {annual.get('trees_equivalent', 0)}")

    # ── Waste Analysis ──
    waste = run_data.get("waste_analysis", "")
    if waste:
        lines.append("")
        lines.append("── Waste Analysis (Gemini) ───────────────────")
        lines.append(waste)

    # ── Original YAML ──
    original = run_data.get("original_yaml", "")
    if original:
        lines.append("")
        lines.append("── Original .gitlab-ci.yml ───────────────────")
        lines.append(original)

    # ── Optimized YAML ──
    optimized = run_data.get("optimized_yaml", "")
    if optimized:
        lines.append("")
        lines.append("── Optimized .gitlab-ci.yml ──────────────────")
        lines.append(optimized)

    # ── JSON dump for machine parsing ──
    lines.append("")
    lines.append("── Raw JSON ─────────────────────────────────")
    try:
        json_safe = {k: v for k, v in run_data.items()
                     if k not in ("original_yaml", "optimized_yaml",
                                  "waste_analysis")}
        lines.append(json.dumps(json_safe, indent=2, default=str))
    except Exception:
        lines.append("(could not serialize)")

    lines.append("")
    lines.append("═" * 60)
    lines.append("  End of Log")
    lines.append("═" * 60)

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    return filepath
