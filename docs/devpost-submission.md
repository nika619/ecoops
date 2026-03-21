# ECOOPS — Devpost Submission

## Project Title
ECOOPS: Emission Cost Optimizer — Operations Pipeline System

## Short Description
AI-powered CI/CD sustainability agent that analyzes GitLab pipeline history, identifies wasted compute using Google Gemini, and automatically optimizes `.gitlab-ci.yml` with smart `rules:changes:` blocks — reducing CO₂ emissions, energy usage, and runner costs.

## Category
🌿 Green Agent Prize — Sustainability in CI/CD

---

## Inspiration

The average engineering team wastes **30–40% of CI minutes** running jobs on commits where they add zero value. A linter that runs when only docs changed. A build that recompiles when only the README was updated. This waste translates directly to unnecessary energy consumption, CO₂ emissions, and cost.

We built ECOOPS to make CI/CD pipelines environmentally sustainable — automatically.

## What It Does

ECOOPS is a **fully automated pipeline optimization agent** that:

1. **Ingests** 50+ commits from your GitLab project via REST API
2. **Analyzes** commit diffs against CI job configurations using **Google Gemini 2.0 Flash** to identify wasted runs
3. **Generates** optimized `.gitlab-ci.yml` with `rules:changes:` blocks so jobs only run when their relevant files change
4. **Validates** the optimized YAML through GitLab's CI Linter API
5. **Creates** a branch, commits the changes, and opens a **Merge Request** with a full **Green Impact Report**

The Green Impact Report includes:
- CI minutes saved per month
- Runner cost savings ($USD)
- Energy savings (kWh)
- CO₂ emissions avoided (kg)
- Tree equivalency (for relatability)

It comes with two interfaces:
- **3D Web Dashboard** — An immersive React/Three.js experience that visualizes each optimization step in 3D space
- **CLI** — A single command for CI integration

## How We Built It

- **Backend**: Python (Flask) with modular architecture
  - `GitLabClient` — REST API v4 integration for fetching commits, diffs, CI config, creating branches/MRs
  - `GeminiClient` — Google Gemini 2.0 Flash for waste analysis and YAML optimization
  - `Reporter` — Green impact calculations using IEA carbon intensity factors and EPA tree absorption rates
  - Real-time SSE (Server-Sent Events) streaming for live progress updates

- **Frontend**: React + Three.js (`@react-three/fiber` + `@react-three/drei`)
  - 6-step immersive 3D visualization with animated scenes
  - Live analysis integration via SSE
  - Glassmorphism UI with cinematic post-processing (Bloom, Vignette)

- **Agent Design**: Three specialized agents (Pipeline Analyzer, YAML Optimizer, Green Impact Reporter) with defined tool bindings

## Challenges

- Cross-referencing commit diffs with CI job dependencies at scale required careful prompt engineering with Gemini
- Ensuring the optimized YAML preserves ALL existing job configurations while adding `rules:changes:` blocks
- Building a real-time SSE bridge between Flask and the React 3D frontend

## What We Learned

- Even simple CI pipelines can waste 30%+ of compute on irrelevant runs
- `rules:changes:` is one of GitLab's most powerful but underused optimization features
- AI can reliably infer file dependencies from CI job scripts, artifact patterns, and repository structure

## Built With

- Python
- Flask
- Google Gemini 2.0 Flash
- GitLab REST API v4
- React
- Three.js
- TypeScript
- Vite

## Try It Out

```bash
git clone https://gitlab.com/sungodnikaa69-group/ecoops.git
cd ecoops
pip install -r requirements.txt
# Add your GITLAB_TOKEN, GEMINI_API_KEY, GITLAB_PROJECT_ID to .env
python -m backend.ecoops --project-id YOUR_ID --dry-run
```
