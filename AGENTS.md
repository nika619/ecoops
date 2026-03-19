# AGENTS.md — ECOOPS

> This file provides cross-tool agent instructions for the ECOOPS project.

## Project Context

ECOOPS (Emission Cost Optimizer — Operations Pipeline System) is an AI-powered CI/CD sustainability tool. It analyzes pipeline history, identifies wasted compute (jobs that run on irrelevant commits), and optimizes `.gitlab-ci.yml` configurations with `rules:changes:` blocks.

## Repository Layout

- `agents/` — System prompts for each custom agent
- `flows/` — Flow configuration YAML
- `demo/` — Sample project and intentionally wasteful CI for demo purposes
- `docs/` — Methodology documentation and setup guides
- `templates/` — Report templates

## Agent Guidelines

### When analyzing CI pipelines:
- Always fetch at least 50 pipeline runs for statistical significance
- Cross-reference commit diffs with job execution to identify waste
- Use file path patterns (globs) that are as specific as possible
- Never suggest removing jobs — only add `rules:changes:` blocks

### When optimizing YAML:
- Preserve ALL existing job configurations (scripts, stages, artifacts, etc.)
- Always include `.gitlab-ci.yml` in `rules:changes:` paths (so CI config changes still trigger jobs)
- Always validate optimized YAML with `ci_linter` before committing
- Use descriptive comments: `# ECOOPS: Added rules:changes to reduce waste`

### When reporting impact:
- Use standard conversion factors from `docs/green-impact-methodology.md`
- Always show both absolute numbers and percentages
- Include the tree equivalency for relatability
- Be transparent about estimation methodology

## Key Conventions

- Branch naming: `ecoops/optimize-pipeline`
- MR title format: `🌱 ECOOPS: Optimize pipeline to save [X] CI minutes/month`
- All calculations should use per-month projections for consistency
- CO₂ values in kilograms, energy in kWh, cost in USD
