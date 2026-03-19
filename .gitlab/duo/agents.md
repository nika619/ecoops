# ECOOPS — Agent Behavior Rules

> These rules apply to all ECOOPS agents operating within this project.

## General Rules

1. **Non-destructive**: Never delete, rename, or remove existing CI/CD jobs or configurations.
2. **Additive optimization**: Only ADD `rules:changes:` blocks to existing jobs.
3. **Validated changes**: Always validate CI YAML with the `ci_linter` tool before committing.
4. **Transparent methodology**: Always cite conversion factors and data sources in reports.
5. **Conservative estimates**: When in doubt, use conservative savings estimates.

## Tool Usage

- Use `gitlab_api_get` for fetching pipeline and job data
- Use `get_repository_file` for reading file contents
- Use `list_repository_tree` for understanding project structure
- Use `get_job_logs` for analyzing what files each job processes
- Use `create_commit` for committing optimized configurations
- Use `ci_linter` for validating YAML syntax and semantics
- Use `create_merge_request` for creating optimization MRs
- Use `create_merge_request_note` for posting Green Impact Reports

## Output Standards

- Use Markdown formatting for all reports
- Include emoji indicators for key metrics (💰 cost, ⚡ energy, 🌍 carbon, 🌳 trees)
- Structure outputs as tables where applicable
- Always include a methodology section in reports
