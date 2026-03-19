# ECOOPS 🌱

### Emission Cost Optimizer — Operations Pipeline System

> **Making CI/CD sustainable, one pipeline at a time.**

[![GitLab Duo](https://img.shields.io/badge/GitLab%20Duo-Agent%20Platform-orange)](https://docs.gitlab.com/ee/user/duo_workflow/)
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

**ECOOPS** is an AI-powered agent system built on the **GitLab Duo Agent Platform** that:

1. **Analyzes** your pipeline history to find wasted compute
2. **Optimizes** your `.gitlab-ci.yml` with smart `rules:changes:` blocks
3. **Reports** the environmental and cost savings in a Green Impact Report

All triggered with a single `@mention` — zero configuration required.

---

## 🏗️ Architecture

ECOOPS consists of **3 specialized agents** orchestrated by **1 flow**:

```mermaid
graph LR
    A["👤 User @mentions<br/>ECOOPS"] --> B["🔍 Pipeline Analyzer<br/>Agent"]
    B -->|"Waste Analysis<br/>(jobs, paths, minutes)"| C["⚙️ YAML Optimizer<br/>Agent"]
    C -->|"Optimized YAML<br/>on branch"| D["📊 Green Impact<br/>Reporter Agent"]
    D --> E["🌱 Merge Request<br/>with Green Impact Report"]

    style A fill:#667eea,stroke:#5a67d8,color:#fff
    style B fill:#f6ad55,stroke:#ed8936,color:#fff
    style C fill:#48bb78,stroke:#38a169,color:#fff
    style D fill:#4299e1,stroke:#3182ce,color:#fff
    style E fill:#68d391,stroke:#48bb78,color:#fff
```

### Agent Details

| Agent | Purpose | Key Tools |
|-------|---------|-----------|
| **🔍 Pipeline Analyzer** | Fetches pipeline history, reads CI config, maps file dependencies per job, calculates waste % | `gitlab_api_get`, `get_repository_file`, `list_repository_tree`, `get_job_logs` |
| **⚙️ YAML Optimizer** | Adds `rules:changes:` blocks to wasteful jobs, validates with CI linter, commits to branch | `get_repository_file`, `create_commit`, `ci_linter` |
| **📊 Green Impact Reporter** | Calculates CO₂/cost/energy savings, creates MR with comprehensive Green Impact Report | `create_merge_request`, `create_merge_request_note` |

### Flow: ECOOPS

- **Type**: Ambient (multi-agent orchestration)
- **Trigger**: `@mention` of the service account or issue assignment
- **Pipeline**: Analyzer → Optimizer → Reporter (sequential, each feeds into the next)

---

## 🚀 Quick Start

### Prerequisites

- GitLab Premium or Ultimate (for Duo features)
- Access to the GitLab AI Catalog (experimental)
- A project with CI/CD pipeline history (10+ pipeline runs recommended)

### Setup

1. **Enable the agents and flow** in your GitLab group via the AI Catalog
   - See [Agent Setup Guide](docs/agent-setup-guide.md) for detailed instructions

2. **Trigger ECOOPS** — open an issue in your project and mention the service account:
   ```
   @ecoops Please analyze this project's CI pipeline for waste and optimize it.
   ```

3. **Wait for the magic** ✨ — ECOOPS will:
   - Analyze your last 50-100 pipeline runs
   - Identify jobs running on irrelevant commits
   - Create a branch with an optimized `.gitlab-ci.yml`
   - Open a Merge Request with a full **Green Impact Report**

4. **Review the MR** — the Green Impact Report shows:
   - CI minutes saved per month
   - Dollar cost savings
   - Energy (kWh) saved
   - CO₂ emissions avoided
   - Tree equivalency for carbon offset

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

## 🌿 Green Impact Methodology

Our CO₂ calculations are based on industry-standard conversion factors:

| Factor | Value | Source |
|--------|-------|--------|
| CI Runner Cost | $0.008/minute | GitLab SaaS medium runner pricing |
| Server Power | 0.5 kWh/hour | Average cloud compute instance |
| Grid Carbon Intensity | 0.385 kg CO₂/kWh | IEA Global Average (2024) |
| Tree CO₂ Absorption | 21.77 kg CO₂/month | EPA estimate (261.27 kg/year ÷ 12) |

See [full methodology documentation](docs/green-impact-methodology.md) for details.

---

## 🎯 How It Works (Technical Deep Dive)

### Step 1: Pipeline Analysis

The **Pipeline Analyzer Agent** uses `gitlab_api_get` to fetch pipeline history:

```
GET /api/v4/projects/:id/pipelines?per_page=50
GET /api/v4/projects/:id/pipelines/:pipeline_id/jobs
GET /api/v4/projects/:id/repository/commits/:sha
```

It cross-references:
- Which **files changed** in each commit
- Which **jobs ran** on that commit
- What **files each job actually depends on** (inferred from script commands and artifact patterns)

This produces a **waste analysis** — e.g., "Your `lint` job ran 45 times, but only 12 commits actually changed Python files."

### Step 2: YAML Optimization

The **YAML Optimizer Agent** reads the current `.gitlab-ci.yml` and adds `rules:changes:` blocks:

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

The optimized YAML is validated with `ci_linter` and committed to a new branch.

### Step 3: Green Impact Report

The **Green Impact Reporter Agent** calculates savings using the formulas:

```
Minutes Saved/Month = Wasted Minutes × (30 / days_analyzed)
Cost Saved/Month    = Minutes Saved/Month × $0.008
Energy Saved/Month  = (Minutes Saved/Month / 60) × 0.5 kWh
CO₂ Avoided/Month   = Energy Saved/Month × 0.385 kg
Trees Equivalent    = CO₂ Avoided/Month / 21.77
```

It creates a Merge Request from `ecoops/optimize-pipeline` → default branch, with the full Green Impact Report posted as an MR note.

---

## 📁 Repository Structure

```
ecoops/
├── .gitlab/
│   └── duo/
│       └── agents.md              # Agent behavior rules (Duo context)
├── agents/
│   ├── pipeline-analyzer.md       # Pipeline Analyzer system prompt
│   ├── yaml-optimizer.md          # YAML Optimizer system prompt
│   └── green-impact-reporter.md   # Green Impact Reporter system prompt
├── flows/
│   └── ecoops-flow.yml            # Flow configuration (reference)
├── demo/
│   ├── sample-app/                # Sample Python app for demo
│   │   ├── app.py
│   │   ├── utils.py
│   │   └── tests/
│   │       └── test_app.py
│   └── wasteful-ci.yml            # Intentionally wasteful CI config
├── docs/
│   ├── green-impact-methodology.md
│   ├── agent-setup-guide.md
│   └── screenshots/
├── templates/
│   └── green-impact-report.md
├── .gitlab-ci.yml
├── AGENTS.md
├── LICENSE
└── README.md
```

---

## 🏆 Hackathon Submission

**GitLab Duo AI Agents Hackathon** — March 2026

### Categories Targeted

| Category | Prize | Why ECOOPS Qualifies |
|----------|-------|----------------------|
| 🏆 Grand Prize | $15,000 | Multi-agent flow with real-world impact |
| 🌱 Green Agent | $3,000 | Purpose-built for sustainability |
| 🌿 Sustainable Design | $500 | CO₂-aware optimization methodology |
| 💥 Most Impactful | $5,000 | Every CI pipeline in the world benefits |
| 🧠 Anthropic Excellence | $10,000 | Claude-powered analysis and code generation |

### Demo Video

> 🎬 [Watch the 3-minute demo](https://youtube.com/watch?v=TODO) — See ECOOPS transform a wasteful pipeline into an optimized, green CI configuration in real-time.

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
  <em>Making CI/CD sustainable, one pipeline at a time.</em><br/><br/>
  Built with ❤️ for the GitLab Duo AI Agents Hackathon 2026
</p>
