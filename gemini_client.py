"""
ECOOPS — Gemini API Client

Handles interactions with the Google Gemini API for:
- Analyzing CI pipeline waste patterns
- Generating optimized YAML configurations
"""

import time
from google import genai


class GeminiClient:
    """Client for interacting with Google Gemini API."""

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.client = genai.Client(api_key=api_key)
        self.model = model

    def _generate(self, prompt: str,
                  temperature: float = 0.3) -> str:
        """Generate content from Gemini. Fails fast on quota errors."""
        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config={
                    "temperature": temperature,
                    "max_output_tokens": 8192,
                },
            )
            return response.text
        except Exception as e:
            err_str = str(e).lower()
            is_quota = any(k in err_str for k in
                           ["429", "rate", "quota",
                            "resource_exhausted"])
            if is_quota:
                print("\n" + "=" * 50)
                print("❌ GEMINI API QUOTA EXHAUSTED")
                print("=" * 50)
                print("   Your Gemini API key has hit its rate limit.")
                print("   Possible fixes:")
                print("   1. Wait a few minutes and try again")
                print("   2. Use a different API key in .env")
                print("   3. Upgrade your Gemini API plan")
                print("=" * 50)
                import sys
                sys.exit(1)
            raise e

    def analyze_waste(self, ci_yaml: str, commits_data: str,
                      repo_tree: str) -> str:
        """
        Analyze CI pipeline waste using Gemini.

        Sends the CI config, commit history with diffs, and repo
        structure to Gemini for intelligent waste analysis.
        """
        prompt = f"""You are ECOOPS Pipeline Analyzer. Analyze this CI/CD configuration and commit history to identify wasted compute.

## CI Configuration (.gitlab-ci.yml):
```yaml
{ci_yaml}
```

## Repository Structure:
```
{repo_tree}
```

## Recent Commits with Changed Files:
{commits_data}

## Your Task:
For each job in the CI config:
1. Determine which files/folders the job ACTUALLY depends on (based on its script commands, artifacts, cache paths)
2. Count how many of the commits did NOT change any relevant files for that job
3. Those are "wasted runs" — the job ran unnecessarily

## Output Format (use this EXACT format):
### Pipeline Waste Analysis

**Commits Analyzed**: [count]
**Date Range**: [earliest date] to [latest date]

#### Wasted Jobs Found:

For EACH job that has waste:
- **Job Name**: [exact job name from yaml]
- **Stage**: [stage name]
- **Relevant Paths**: [glob patterns of files this job needs]
- **Total Runs**: [total commits analyzed]
- **Wasted Runs**: [commits that didn't change relevant files]
- **Waste Percentage**: [calculated %]
- **Avg Duration**: [estimate in seconds based on job complexity, use 60s for lint, 120s for test, 180s for build, 90s for deploy]
- **Total Wasted Minutes**: [wasted_runs * avg_duration / 60]

#### Summary:
- Total Wasted CI Minutes: [sum]
- Total Wasted Runs: [sum]
- Overall Waste Percentage: [weighted average]
- Estimated Monthly Waste: [extrapolated to 30 days]
- Days Analyzed: [count]

Be thorough and conservative. If unsure whether a job depends on certain files, assume it does."""

        return self._generate(prompt)

    def generate_optimized_yaml(self, ci_yaml: str,
                                waste_analysis: str) -> str:
        """
        Generate optimized CI YAML using Gemini.

        Takes the current YAML and waste analysis, produces an
        optimized version with rules:changes: blocks.
        """
        prompt = f"""You are ECOOPS YAML Optimizer. Take the waste analysis and rewrite the CI YAML to eliminate wasted runs.

## Current .gitlab-ci.yml:
```yaml
{ci_yaml}
```

## Waste Analysis:
{waste_analysis}

## Rules:
1. ONLY add rules:changes: blocks — DO NOT modify any existing job configuration
2. Preserve ALL scripts, stages, artifacts, cache, and other settings exactly as they are
3. For each wasted job, add a rules:changes: block with the relevant file paths
4. Always include .gitlab-ci.yml in the changes list
5. Add a comment "# ECOOPS: Added rules:changes to reduce waste" above each modified job
6. If a job already has rules:, carefully merge the changes: condition

## Output:
Return ONLY the complete, valid YAML content. No markdown fences, no explanation — just the raw YAML.
Start directly with the first line of YAML (e.g., stages: or the first comment)."""

        text = self._generate(prompt).strip()

        # Strip markdown code fences if Gemini wraps them
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            text = "\n".join(lines)

        return text
