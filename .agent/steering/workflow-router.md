---
inclusion: manual
---

# Optional workspace workflow index

Use this index only when the user explicitly asks for a workspace workflow or its menu. Do not intercept ordinary words such as “analyze”, “commit”, or “branch”, and do not override built-in slash commands.

Workflows explicitly routed by [PREFLIGHT.md](../PREFLIGHT.md) (`task-workflow.md`, `jira-rai-build.md`, `jira-ticket-create.md`, `create-branch.md`) execute on demand when triggered by `PREFLIGHT.md`. Other unrouted legacy workflow files under `../workflows/` remain manual-only when explicitly requested; for analysis or commit work inside a repository, prefer current skills and instructions, verify legacy steps against the current task and repository, and ignore stale instructions that would revert user files, force a fixed pipeline, or push, merge, or change external state without authorization.
