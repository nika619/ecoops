"""
ECOOPS — Green Impact Reporter

Calculates environmental and cost impact from CI optimization
and generates the Green Impact Report.
"""

import math
from typing import Dict
import re

from backend.config import (
    RUNNER_COST_PER_MINUTE,
    SERVER_POWER_KWH,
    CARBON_INTENSITY,
    TREE_ABSORPTION_MONTHLY,
    TREE_ABSORPTION_ANNUAL,
)


def parse_waste_metrics(waste_analysis: str) -> Dict:
    """Extract key metrics from the waste analysis text.

    Looks for summary-level metrics first.  When the summary section
    is absent (Gemini sometimes omits it), falls back to summing
    per-job metrics from the detailed breakdown.
    """
    metrics = {
        "total_wasted_minutes": 0,
        "total_wasted_runs": 0,
        "waste_percentage": 0,
        "days_analyzed": 1,
        "commits_analyzed": 0,
    }

    # ── Per-job accumulators (fallback) ──────────────────────
    per_job_minutes: list = []
    per_job_wasted_runs: list = []
    per_job_total_runs: list = []
    per_job_waste_pct: list = []

    for line in waste_analysis.split("\n"):
        line_lower = line.lower().strip()

        # ── Summary-level metrics ───────────────────────────
        if "total wasted ci minutes" in line_lower:
            nums = re.findall(r"[\d,]+\.?\d*", line)
            if nums:
                metrics["total_wasted_minutes"] = float(
                    nums[-1].replace(",", ""))

        elif "total wasted runs" in line_lower and "job" not in line_lower:
            nums = re.findall(r"[\d,]+", line)
            if nums:
                metrics["total_wasted_runs"] = int(
                    nums[-1].replace(",", ""))

        elif "overall waste percentage" in line_lower:
            nums = re.findall(r"[\d.]+", line)
            if nums:
                metrics["waste_percentage"] = float(nums[-1])

        elif "days analyzed" in line_lower:
            nums = re.findall(r"\d+", line)
            if nums:
                metrics["days_analyzed"] = max(int(nums[-1]), 1)

        elif "commits analyzed" in line_lower:
            nums = re.findall(r"\d+", line)
            if nums:
                metrics["commits_analyzed"] = int(nums[-1])

        # ── Per-job metrics (for fallback summing) ──────────
        elif "total wasted minutes" in line_lower:
            nums = re.findall(r"[\d,]+\.?\d*", line)
            if nums:
                per_job_minutes.append(float(nums[-1].replace(",", "")))

        elif "wasted runs" in line_lower and "total" not in line_lower:
            nums = re.findall(r"[\d,]+", line)
            if nums:
                per_job_wasted_runs.append(int(nums[-1].replace(",", "")))

        elif "total runs" in line_lower:
            nums = re.findall(r"[\d,]+", line)
            if nums:
                per_job_total_runs.append(int(nums[-1].replace(",", "")))

        elif "waste percentage" in line_lower and "overall" not in line_lower:
            nums = re.findall(r"[\d.]+", line)
            if nums:
                per_job_waste_pct.append(float(nums[-1]))

        # ── Date range → days_analyzed estimate ─────────────
        elif "date range" in line_lower:
            dates = re.findall(r"\d{4}-\d{2}-\d{2}", line)
            if len(dates) >= 2:
                from datetime import datetime as _dt
                try:
                    d0 = _dt.strptime(dates[0], "%Y-%m-%d")
                    d1 = _dt.strptime(dates[-1], "%Y-%m-%d")
                    diff = max((d1 - d0).days, 1)
                    if metrics["days_analyzed"] <= 1:
                        metrics["days_analyzed"] = diff
                except ValueError:
                    pass

    # ── Fallback: if summary metrics are 0, sum per-job data ─
    if metrics["total_wasted_minutes"] == 0 and per_job_minutes:
        metrics["total_wasted_minutes"] = sum(per_job_minutes)

    if metrics["total_wasted_runs"] == 0 and per_job_wasted_runs:
        metrics["total_wasted_runs"] = sum(per_job_wasted_runs)

    if metrics["waste_percentage"] == 0:
        # Try average of per-job percentages
        if per_job_waste_pct:
            metrics["waste_percentage"] = round(
                sum(per_job_waste_pct) / len(per_job_waste_pct), 1)
        # Or compute from total/wasted runs
        elif per_job_total_runs and per_job_wasted_runs:
            total = sum(per_job_total_runs)
            wasted = sum(per_job_wasted_runs)
            if total > 0:
                metrics["waste_percentage"] = round(
                    (wasted / total) * 100, 1)

    return metrics


def calculate_savings(metrics: Dict) -> Dict:
    """Calculate environmental and cost savings."""
    days = max(metrics["days_analyzed"], 1)
    wasted_min = metrics["total_wasted_minutes"]

    # Monthly projections
    minutes_per_month = wasted_min * (30 / days)
    cost_per_month = minutes_per_month * RUNNER_COST_PER_MINUTE
    energy_per_month = (minutes_per_month / 60) * SERVER_POWER_KWH
    co2_per_month = energy_per_month * CARBON_INTENSITY
    trees_monthly = co2_per_month / TREE_ABSORPTION_MONTHLY

    # Annual projections
    minutes_per_year = minutes_per_month * 12
    cost_per_year = cost_per_month * 12
    co2_per_year = co2_per_month * 12
    trees_annual = co2_per_year / TREE_ABSORPTION_ANNUAL

    return {
        "monthly": {
            "minutes_saved": round(minutes_per_month, 0),
            "cost_saved": round(cost_per_month, 2),
            "energy_saved_kwh": round(energy_per_month, 2),
            "co2_avoided_kg": round(co2_per_month, 2),
            "trees_equivalent": round(trees_monthly, 2),
        },
        "annual": {
            "hours_saved": round(minutes_per_year / 60, 1),
            "cost_saved": round(cost_per_year, 2),
            "co2_avoided_kg": round(co2_per_year, 2),
            "trees_equivalent": round(trees_annual, 2),
        },
    }


def generate_impact_report(waste_analysis: str,
                           jobs_optimized: int) -> str:
    """Generate the full Green Impact Report markdown."""
    metrics = parse_waste_metrics(waste_analysis)
    savings = calculate_savings(metrics)
    m = savings["monthly"]
    a = savings["annual"]

    report = f"""# 🌱 ECOOPS Green Impact Report

## Executive Summary

ECOOPS analyzed **{metrics['commits_analyzed']} commits** over \
**{metrics['days_analyzed']} days** and identified \
**{jobs_optimized} jobs** with significant waste. By adding \
`rules:changes:` blocks, we project the following savings:

## 📊 Monthly Savings

| Metric | Savings |
|--------|---------|
| ⏱️ CI Minutes Saved | **{m['minutes_saved']:.0f} minutes** |
| 💵 Cost Saved | **${m['cost_saved']:.2f}** |
| ⚡ Energy Conserved | **{m['energy_saved_kwh']:.2f} kWh** |
| 🌍 CO₂ Avoided | **{m['co2_avoided_kg']:.2f} kg** |
| 🌳 Tree Equivalent | **{m['trees_equivalent']:.2f} trees** |

## 📈 Annual Projection

| Metric | Savings |
|--------|---------|
| ⏱️ Compute Saved | **{a['hours_saved']:.1f} hours** |
| 💵 Cost Saved | **${a['cost_saved']:.2f}** |
| 🌍 CO₂ Avoided | **{a['co2_avoided_kg']:.2f} kg** |
| 🌳 Tree Equivalent | **{a['trees_equivalent']:.2f} trees/year** |

## 🛠️ What Changed

ECOOPS added `rules:changes:` blocks to **{jobs_optimized} CI jobs** so \
they only run when their relevant source files are modified. This means \
jobs like linting, building, and testing now **skip commits that don't \
affect them** — saving compute, money, and carbon emissions.

## 🏗️ Before vs After

| | Before | After |
|--|--------|-------|
| Job Trigger | Every commit | Only relevant commits |
| Wasted Runs | ~{metrics['waste_percentage']:.0f}% | ~0% |
| Monthly CI Cost | ~${m['cost_saved']:.2f} wasted | Near-zero waste |

## 📏 Methodology

| Factor | Value | Source |
|--------|-------|--------|
| CI Runner Cost | $0.008/min | GitLab SaaS medium runner |
| Server Power | 0.5 kWh/hour | Average cloud compute |
| Carbon Intensity | 0.385 kg CO₂/kWh | IEA 2024 global average |
| Tree Absorption | 21.77 kg CO₂/month | EPA estimate |

---

*Generated by ECOOPS 🌱 — Emission Cost Optimizer — Operations Pipeline System*
"""
    return report
