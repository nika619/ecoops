# ECOOPS 🌱

### Emission Cost Optimizer — Operations Pipeline System

> **Making CI/CD sustainable, one pipeline at a time.**

[![GitLab](https://img.shields.io/badge/GitLab-Powered-orange)](https://gitlab.com)
[![Gemini AI](https://img.shields.io/badge/Gemini%202.0-AI%20Powered-blue)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Green Agent](https://img.shields.io/badge/🌿-Green%20Agent-brightgreen)](docs/green-impact-methodology.md)

---

## 🚨 The Problem

**CI pipelines waste enormous compute running jobs on commits where they provide zero value.**

Consider a typical project:
- A **Python linter** runs on every commit — even when only `README.md` changed
- A **build job** recompiles the entire app — even when only `docs/` were updated
- A **test suite** executes every test — even when only infrastructure configs changed

This waste translates directly to:
- 💰 **Wasted money** on CI runner minutes
- ⚡ **Wasted energy** powering unnecessary compute
- 🌍 **Unnecessary CO₂ emissions** contributing to climate change

> The average engineering team wastes **30–40% of CI minutes** on jobs that could have been skipped.

---

## 💡 The Solution

**ECOOPS** is an AI-powered tool that uses **Google Gemini 2.0** and the **GitLab REST API** to:

1. **Analyze** your pipeline history and commit diffs to find wasted compute
2. **Optimize** your `.gitlab-ci.yml` with smart `rules:changes:` blocks
3. **Report** the environmental and cost savings in a Green Impact Report
4. **Create** a Merge Request with the optimized config + full impact analysis

It comes with two interfaces:
- **🌐 3D Web Dashboard** — An immersive React/Three.js experience with step-by-step pipeline analysis
- **⌨️ CLI** — Single-command analysis for CI integration

---

## 🏗️ Architecture

```mermaid
graph LR
    A["👤 User runs<br/>ECOOPS"] --> B["📡 GitLab REST API<br/>Fetch pipelines, commits, diffs"]
    B --> C["🤖 Gemini 2.0 Flash<br/>Analyze waste patterns"]
    C --> D["⚙️ Gemini 2.0 Flash<br/>Generate optimized YAML"]
    D --> E["🔧 GitLab CI Linter<br/>Validate YAML"]
    E --> F["📤 GitLab REST API<br/>Create branch + commit"]
    F --> G["🌱 Merge Request<br/>with Green Impact Report"]

    style A fill:#667eea,stroke:#5a67d8,color:#fff
    style B fill:#f6ad55,stroke:#ed8936,color:#fff
    style C fill:#48bb78,stroke:#38a169,color:#fff
    style D fill:#48bb78,stroke:#38a169,color:#fff
    style E fill:#4299e1,stroke:#3182ce,color:#fff
    style F fill:#4299e1,stroke:#3182ce,color:#fff
    style G fill:#68d391,stroke:#48bb78,color:#fff
```

### How It Works

| Step | Component | Action |
|------|-----------|--------|
| **1** | GitLab API | Fetch 50+ commits with diffs, read `.gitlab-ci.yml`, map repo structure |
| **2** | Gemini AI | Analyze which jobs depend on which files, identify wasted runs |
| **3** | Gemini AI | Generate optimized YAML with `rules:changes:` blocks |
| **4** | GitLab API | Validate optimized YAML with CI Linter |
| **5** | GitLab API | Create branch `ecoops/optimize-pipeline`, commit changes |
| **6** | GitLab API | Open MR with Green Impact Report (CO₂, cost, energy savings) |

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+ (for 3D dashboard)
- A GitLab project with CI/CD history (10+ commits recommended)
- GitLab Personal Access Token (with `api` scope)
- Google Gemini API key ([get one free](https://aistudio.google.com/apikey))

### Setup

```bash
# Clone the repository
git clone https://gitlab.com/sungodnikaa69-group/ecoops.git
cd ecoops

# Install Python dependencies
pip install -r requirements.txt

# Configure API keys
cp .env.example .env
# Edit .env with your GITLAB_TOKEN, GEMINI_API_KEY, and GITLAB_PROJECT_ID
```

### Run — CLI

```bash
# Full optimization (creates branch + MR)
python -m backend.ecoops --project-id YOUR_PROJECT_ID

# Dry run (analyze only, no changes)
python -m backend.ecoops --project-id YOUR_PROJECT_ID --dry-run

# JSON output for CI integration
python -m backend.ecoops --project-id YOUR_PROJECT_ID --json
```

### Run — 3D Web Dashboard

```bash
# Start the Flask backend
flask --app backend.web_app run --port 5001

# In a new terminal — start the 3D frontend
cd frontend
npm install
npm run dev
# Visit http://localhost:5173
```

### Run — 2D Web Dashboard

```bash
# Start the Flask app (includes built-in dashboard)
flask --app backend.web_app run --port 5001
# Visit http://localhost:5001
```

### Environment Variables

```env
GITLAB_TOKEN=glpat-xxx           # GitLab Personal Access Token (api scope)
GEMINI_API_KEY=xxx               # Google Gemini API key
GITLAB_PROJECT_ID=80425527       # Target project ID
GITLAB_BASE_URL=https://gitlab.com  # GitLab instance URL (optional)
```

---

## 📊 Sample Green Impact Report

> From analyzing a real project with 50 pipeline runs:

| Metric | Before | After (Projected) |
|--------|--------|-------------------|
| CI Minutes/Month | 4,200 | 2,520 |
| Monthly Cost | $33.60 | $20.16 |
| Energy Usage | 35.0 kWh | 21.0 kWh |
| CO₂ Emissions | 13.5 kg | 8.1 kg |

### 💰 Monthly Savings
- **⏱️ 1,680 minutes** of CI compute saved
- **💵 $13.44** in runner costs avoided
- **⚡ 14.0 kWh** of energy saved
- **🌍 5.4 kg CO₂** of emissions avoided
- **🌳 Equivalent to 0.25 trees absorbing CO₂ for a month**

---

## 🎯 Technical Deep Dive

### Step 1: Data Collection (GitLab REST API)

ECOOPS fetches rich data from your GitLab project:

```
GET /api/v4/projects/:id/repository/commits?per_page=50
GET /api/v4/projects/:id/repository/commits/:sha/diff
GET /api/v4/projects/:id/repository/files/.gitlab-ci.yml
GET /api/v4/projects/:id/repository/tree?recursive=true
```

It cross-references:
- Which **files changed** in each commit
- What **jobs exist** in your CI configuration
- What **files each job actually depends on** (inferred from script commands and artifact patterns)

### Step 2: AI Waste Analysis (Gemini 2.0)

The commit history, CI config, and repo structure are sent to Gemini with a structured prompt that produces:
- Per-job dependency mapping (file globs)
- Wasted run counts and percentages
- Estimated duration and monthly waste

### Step 3: YAML Optimization (Gemini 2.0)

The optimizer takes the waste analysis + current YAML and adds `rules:changes:` blocks:

```yaml
# Before (runs on EVERY commit):
lint:
  stage: test
  script:
    - flake8 src/

# After (ECOOPS optimized — only runs when Python files change):
# ECOOPS: Added rules:changes to reduce waste
lint:
  stage: test
  script:
    - flake8 src/
  rules:
    - changes:
        - "src/**/*.py"
        - "tests/**/*.py"
        - ".flake8"
        - ".gitlab-ci.yml"
```

### Step 4: Validation & MR Creation

- The optimized YAML is validated with the GitLab CI Linter API
- A new branch `ecoops/optimize-pipeline` is created
- A Merge Request is opened with the full **Green Impact Report**

---

## 🌿 Green Impact Methodology

Our CO₂ calculations use industry-standard conversion factors:

| Factor | Value | Source |
|--------|-------|--------|
| CI Runner Cost | $0.008/minute | GitLab SaaS medium runner pricing |
| Server Power | 0.5 kWh/hour | Average cloud compute instance |
| Grid Carbon Intensity | 0.385 kg CO₂/kWh | IEA Global Average (2024) |
| Tree CO₂ Absorption | 21.77 kg CO₂/month | EPA estimate (261.27 kg/year ÷ 12) |

See [full methodology documentation](docs/green-impact-methodology.md) for details.

---

## 📁 Repository Structure

```
ecoops/
├── backend/                        # Python backend
│   ├── ecoops.py                   # CLI entrypoint (orchestrator)
│   ├── web_app.py                  # Flask web dashboard + API
│   ├── config.py                   # Configuration constants
│   ├── services/
│   │   ├── gemini_client.py        # Google Gemini AI client
│   │   └── reporter.py            # Green Impact Report generator
│   └── utils/
│       ├── gitlab_client.py        # GitLab REST API v4 client
│       ├── run_logger.py           # Analysis run logger
│       └── shared_utils.py         # Shared utility functions
│
├── frontend/                       # 3D React/Three.js dashboard
│   ├── src/
│   │   ├── App.tsx                 # Main application component
│   │   ├── components/
│   │   │   ├── Experience.tsx      # 3D scene orchestrator
│   │   │   ├── CameraController.tsx # Animated camera transitions
│   │   │   ├── DataHighway.tsx     # Data visualization scene
│   │   │   ├── YamlDiffDisplays.tsx # YAML before/after comparison
│   │   │   ├── FinalResultsScene.tsx # Impact dashboard scene
│   │   │   ├── StepCard.tsx        # Step navigation UI
│   │   │   ├── UIOverlay.tsx       # HUD overlay elements
│   │   │   └── ActionConsole.tsx   # Console output panel
│   │   └── index.css               # Global styles
│   └── package.json                # Node.js dependencies
│
├── templates/
│   ├── web/dashboard.html          # 2D web dashboard template
│   └── green-impact-report.md      # Report template
├── static/                         # CSS + JS for 2D dashboard
│
├── tests/                          # Unit tests
│   ├── test_gitlab_client.py
│   ├── test_gemini_client.py
│   ├── test_reporter.py
│   ├── test_run_logger.py
│   └── test_api.py
│
├── agents/                         # Agent system prompts
│   ├── pipeline-analyzer.md
│   ├── yaml-optimizer.md
│   └── green-impact-reporter.md
├── flows/
│   └── ecoops-flow.yml             # Flow configuration
├── demo/
│   ├── wasteful-ci.yml             # Intentionally wasteful CI (for demo)
│   └── sample-app/                 # Sample Python app
├── docs/
│   ├── green-impact-methodology.md # Impact calculation methodology
│   └── agent-setup-guide.md        # Setup documentation
├── logs/                           # Analysis run logs (auto-generated)
│
├── .gitlab-ci.yml                  # Project CI/CD configuration
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
├── AGENTS.md                       # Agent guidelines
├── LICENSE                         # MIT License
└── README.md
```

---

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ -v --cov=backend --cov-report=html
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Merge Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <strong>🌱 ECOOPS</strong><br/>
  <em>Emission Cost Optimizer — Operations Pipeline System</em><br/>
  <em>Making CI/CD sustainable, one pipeline at a time.</em>
</p>
