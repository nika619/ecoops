"""
ECOOPS — Centralized Configuration

All environment variables, AI model settings, and carbon conversion
constants in one place.  Import from here instead of scattering
os.getenv() calls across modules.
"""

import os
from dotenv import load_dotenv

load_dotenv(override=True)

# ── API Credentials ─────────────────────────────────────────
GITLAB_TOKEN: str = os.getenv("GITLAB_TOKEN", "")
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GITLAB_PROJECT_ID: int = int(os.getenv("GITLAB_PROJECT_ID", "0"))
GITLAB_BASE_URL: str = os.getenv("GITLAB_BASE_URL", "https://gitlab.com")

# ── AI Model ────────────────────────────────────────────────
GEMINI_MODEL: str = "gemini-2.5-flash"

# ── Carbon / Cost Conversion Constants ──────────────────────
# (sourced from docs/green-impact-methodology.md)
RUNNER_COST_PER_MINUTE: float = 0.008       # $ per CI minute (GitLab SaaS medium)
SERVER_POWER_KWH: float = 0.5               # kWh per hour of compute
CARBON_INTENSITY: float = 0.385             # kg CO₂ per kWh (IEA 2024 global avg)
TREE_ABSORPTION_MONTHLY: float = 21.77      # kg CO₂ per tree per month (EPA)
TREE_ABSORPTION_ANNUAL: float = 261.27      # kg CO₂ per tree per year

# ── Pipeline Defaults ───────────────────────────────────────
DEFAULT_BRANCH_NAME: str = "ecoops/optimize-pipeline"
DEFAULT_COMMITS_TO_FETCH: int = 50
