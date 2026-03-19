# 🌿 Green Impact Methodology

> How ECOOPS calculates environmental savings from CI/CD optimization.

## Overview

ECOOPS estimates the environmental impact of CI/CD waste by converting **wasted CI minutes** into energy consumption, CO₂ emissions, and cost. This document explains every step of the calculation methodology.

## Conversion Factors

| Factor | Value | Source | Notes |
|--------|-------|--------|-------|
| **CI Runner Cost** | $0.008/minute | [GitLab Pricing](https://about.gitlab.com/pricing/) | SaaS medium runner (Linux, 2 vCPU) |
| **Server Power Draw** | 0.5 kWh/hour | Industry average | Based on cloud VM with 2-4 vCPUs |
| **Grid Carbon Intensity** | 0.385 kg CO₂/kWh | [IEA 2024](https://www.iea.org/data-and-statistics) | Global weighted average |
| **Tree CO₂ Absorption** | 21.77 kg CO₂/month | [EPA](https://www.epa.gov/energy/greenhouse-gas-equivalencies-calculator) | 261.27 kg/year ÷ 12 months |

## Calculation Pipeline

### Step 1: Quantify Waste

The Pipeline Analyzer agent examines `N` pipeline runs over `D` days and identifies wasted runs:

```
total_wasted_minutes = Σ (wasted_runs_per_job × avg_duration_per_job / 60)
```

A run is classified as **wasted** when the commit that triggered it did NOT modify any files relevant to the job. Relevance is determined by analyzing:

- The job's `script` commands (e.g., `flake8 src/` → depends on `src/**/*.py`)
- The job's `artifacts:paths` (output dependencies)
- The job's `cache:paths` (input dependencies)
- The repository's folder structure

### Step 2: Monthly Projection

```
days_analyzed = D
minutes_saved_per_month = total_wasted_minutes × (30 / days_analyzed)
```

### Step 3: Cost Savings

```
cost_saved_per_month = minutes_saved_per_month × $0.008
```

This uses GitLab SaaS medium runner pricing. For self-hosted runners, the actual cost may differ, but the energy and CO₂ calculations remain valid.

### Step 4: Energy Savings

```
hours_saved_per_month = minutes_saved_per_month / 60
energy_saved_per_month = hours_saved_per_month × 0.5 kWh
```

The 0.5 kWh/hour figure represents the typical power draw of a cloud VM instance (2-4 vCPUs) including:
- CPU power draw (~60-120W)
- Memory, storage, and networking (~30-50W)
- Cooling overhead (PUE factor of ~1.2)

### Step 5: CO₂ Emissions Avoided

```
co2_avoided_per_month = energy_saved_per_month × 0.385 kg/kWh
```

The 0.385 kg CO₂/kWh is the IEA's 2024 global weighted average for electricity grid carbon intensity. This varies significantly by region:

| Region | Carbon Intensity (kg CO₂/kWh) |
|--------|-------------------------------|
| Norway (hydro) | 0.017 |
| France (nuclear) | 0.056 |
| EU Average | 0.231 |
| **Global Average** | **0.385** |
| USA Average | 0.379 |
| China | 0.555 |
| India | 0.708 |
| Poland (coal) | 0.635 |

We use the global average to provide a universally applicable estimate. Users with region-specific data can adjust this factor.

### Step 6: Tree Equivalency

```
trees_monthly = co2_avoided_per_month / 21.77
trees_annual = (co2_avoided_per_month × 12) / 261.27
```

Based on EPA estimates that a medium-growth coniferous or deciduous tree absorbs approximately **261.27 kg of CO₂ per year** (21.77 kg/month).

## Example Calculation

Given:
- 50 pipelines analyzed over 15 days
- 4 jobs identified as wasteful
- Total wasted minutes: 420

```
minutes_saved/month  = 420 × (30 / 15)                = 840 minutes
cost_saved/month     = 840 × $0.008                    = $6.72
energy_saved/month   = (840 / 60) × 0.5               = 7.0 kWh
co2_avoided/month    = 7.0 × 0.385                     = 2.695 kg
trees_equivalent     = 2.695 / 21.77                    = 0.12 trees

Annual projections:
minutes_saved/year   = 840 × 12                        = 10,080 minutes (168 hours)
cost_saved/year      = $6.72 × 12                      = $80.64
co2_avoided/year     = 2.695 × 12                      = 32.34 kg
trees_annual         = 32.34 / 261.27                   = 0.12 trees
```

## Limitations & Disclaimers

1. **Estimates, not measurements**: These calculations are estimates based on industry averages. Actual savings depend on:
   - Runner type (shared vs. dedicated, cloud vs. on-prem)
   - Data center location (affects carbon intensity)
   - Time of day (renewable energy availability varies)

2. **Conservative approach**: When uncertain about job dependencies, the analyzer assumes a job IS needed (reducing false positives but potentially underestimating waste).

3. **Embodied carbon not included**: We do not account for the embodied carbon in manufacturing the servers. This is a lifecycle analysis (LCA) concern beyond our scope.

4. **Network effects**: Reduced pipeline runs also save on:
   - Network bandwidth
   - Artifact storage
   - Developer wait time (indirect productivity gain)

   These secondary benefits are NOT included in our calculations.

## Sources

1. International Energy Agency (IEA). "CO2 Emissions from Electricity Generation." IEA Data and Statistics, 2024.
2. U.S. Environmental Protection Agency (EPA). "Greenhouse Gas Equivalencies Calculator." EPA, 2024.
3. GitLab. "GitLab SaaS Runner Pricing." GitLab Documentation, 2025.
4. Masanet, E., et al. "Recalibrating global data center energy-use estimates." Science, 2020.
5. The Green Web Foundation. "CO2.js: Estimate the carbon emissions of web services." 2024.

---

*This methodology is open source and contributions are welcome. If you have more accurate regional data or updated conversion factors, please submit a merge request.*
