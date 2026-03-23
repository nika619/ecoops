# Agent Setup Guide — ECOOPS

> Step-by-step instructions for creating the 3 agents and 1 flow in the GitLab AI Catalog.

## Prerequisites

1. **GitLab Premium or Ultimate** subscription with Duo features enabled
2. Access to the **AI Catalog** (Settings → AI Catalog in your group)
3. A **GitLab group** where you have Maintainer or Owner access
4. Duo features must be enabled at the group level

---

## Step 1: Create Agent — Pipeline Analyzer

1. Navigate to **your group → Settings → AI Catalog → Agents → New Agent**
2. Fill in the details:

| Field | Value |
|-------|-------|
| Display Name | `ECOOPS Pipeline Analyzer` |
| Description | `Analyzes pipeline history and .gitlab-ci.yml to identify wasted CI compute` |
| Visibility | `Public` |

3. Under **Tools**, select:
   - ✅ `gitlab_api_get`
   - ✅ `get_repository_file`
   - ✅ `list_repository_tree`
   - ✅ `get_job_logs`
   - ✅ `create_issue_note`

4. Under **System Prompt**, paste the full prompt from [`.gitlab/agents/pipeline-analyzer.md`](../.gitlab/agents/pipeline-analyzer.md) (the content inside the code block)

5. Click **Create Agent**

---

## Step 2: Create Agent — YAML Optimizer

1. Navigate to **your group → Settings → AI Catalog → Agents → New Agent**
2. Fill in the details:

| Field | Value |
|-------|-------|
| Display Name | `ECOOPS YAML Optimizer` |
| Description | `Rewrites .gitlab-ci.yml with rules:changes: blocks to eliminate waste` |
| Visibility | `Public` |

3. Under **Tools**, select:
   - ✅ `get_repository_file`
   - ✅ `create_commit`
   - ✅ `ci_linter`

4. Under **System Prompt**, paste the full prompt from [`.gitlab/agents/yaml-optimizer.md`](../.gitlab/agents/yaml-optimizer.md)

5. Click **Create Agent**

---

## Step 3: Create Agent — Green Impact Reporter

1. Navigate to **your group → Settings → AI Catalog → Agents → New Agent**
2. Fill in the details:

| Field | Value |
|-------|-------|
| Display Name | `ECOOPS Green Impact Reporter` |
| Description | `Calculates CO₂ + cost savings and creates MR with Green Impact Report` |
| Visibility | `Public` |

3. Under **Tools**, select:
   - ✅ `create_merge_request`
   - ✅ `create_merge_request_note`
   - ✅ `create_issue_note`

4. Under **System Prompt**, paste the full prompt from [`.gitlab/agents/green-impact-reporter.md`](../.gitlab/agents/green-impact-reporter.md)

5. Click **Create Agent**

---

## Step 4: Create Flow — ECOOPS

1. Navigate to **your group → Settings → AI Catalog → Flows → New Flow**
2. Fill in the details:

| Field | Value |
|-------|-------|
| Display Name | `ECOOPS` |
| Description | `Analyzes CI pipeline waste and auto-optimizes .gitlab-ci.yml with a Green Impact Report` |
| Visibility | `Public` |

3. Under **Flow Configuration**, paste the YAML from [`.gitlab/flows/ecoops-flow.yml`](../.gitlab/flows/ecoops-flow.yml)

4. Click **Create Flow**

---

## Step 5: Enable Flow in Your Project

1. Open the project where you want to optimize the CI pipeline
2. Navigate to **Settings → Integrations → AI Agents**
3. Find **ECOOPS** in the list and click **Enable**
4. A service account will be created (e.g., `@ecoops-[group]`)

---

## Step 6: Trigger ECOOPS

### Option A: Issue @mention

1. Open or create an issue in the project
2. Write a comment mentioning the service account:

```
@ecoops-[group] Please analyze this project's CI pipeline for waste and optimize it.
```

3. The flow will start automatically

### Option B: Individual Agent via Duo Chat

1. Open **Duo Chat** (sidebar → Duo Chat)
2. Select one of the ECOOPS agents from the agent dropdown
3. Ask it to analyze the current project

---

## Verification Checklist

After setup, verify everything works:

- [ ] All 3 agents appear in the AI Catalog
- [ ] The flow appears in the AI Catalog
- [ ] The flow is enabled in the target project
- [ ] A service account user was created for the flow
- [ ] @mentioning the service account triggers the flow
- [ ] Pipeline Analyzer produces a waste analysis
- [ ] YAML Optimizer creates a branch with `rules:changes:` blocks
- [ ] CI linter validates the optimized YAML
- [ ] Green Impact Reporter creates an MR with savings report
- [ ] The Green Impact Report contains correct CO₂/cost calculations

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Agent doesn't appear in Duo Chat | Make sure visibility is set to Public and the agent is created in the correct group |
| Flow doesn't trigger | Verify the flow is enabled in the project under Settings → Integrations → AI Agents |
| `gitlab_api_get` fails | Ensure the service account has at least Developer access to the project |
| `create_commit` fails | Ensure the service account has at least Developer access to push branches |
| `ci_linter` returns errors | Review the optimized YAML; the agent may need to retry with adjusted glob patterns |
| Report calculations look wrong | Verify the number of pipelines analyzed and the date range in the waste analysis |
