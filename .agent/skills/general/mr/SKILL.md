---
name: mr
version: "1.0.0"
released: "2026-11-21"
description: >
  Creates standardized Merge Requests / Pull Requests with mandatory task summary,
  executing agent + model provenance, and file-by-file change breakdown. Use whenever
  opening or updating a GitHub PR or GitLab MR. Not for branch naming, staging, or
  SemVer tagging (use git).
---

# Merge Request / Pull Request Standard

Produce clear, auditable Merge Requests / Pull Requests that record **what task was solved**, **which agent & model executed it**, and **exact file-level changes** verified against Git diff.

## When to Use

- Opening or updating a GitHub Pull Request or GitLab Merge Request after pushing a task branch.
- **Not for:** branch creation, staging inspection, Conventional Commit formatting, or SemVer releases ([`../git/SKILL.md`](../git/SKILL.md)).

## Pre-MR Preparation

1. Verify all changes are committed, pushed to `origin/<branch>`, and working tree is clean (`git status -sb`).
2. Inspect ground-truth changes against the target base branch (`main` by default) — never list files from memory:
   ```bash
   git log main..HEAD --oneline
   git diff --name-status main...HEAD
   ```
3. Format the MR title using Conventional Commits: `<type>(<scope>): <concise task summary>`.

## Mandatory MR Description Template

Every MR/PR body MUST contain these exact three sections (`Name`, `Agent`, `Description`):

```markdown
## Name
<Short, direct name of the task>

## Agent
- **Agent:** <Agent harness, e.g. Antigravity / Claude Code / Codex> (Role: `<active-studio-role>`)
- **Model:** `<exact model name; list subagent models too if delegated>`

## Description
<1–2 sentence summary of outcome and verification run, followed by file-level breakdown:>

- `<path/to/file>` — <what was added, modified, or fixed in this file>
- `<path/to/dir/*>` — <grouped summary + file count ONLY for bulk identical deletes/renames>

<!-- Optional GitHub Project automation footer: Closes #<issue-id> -->
```

## Deterministic Creation (`gh-studio.mjs`)

Pass the Markdown body via `--body-file` (stored in OS temp or untracked scratch, never committed) so shell quoting never corrupts backticks:

```bash
node <workspace>/.agent/tools/gh-studio.mjs mr-create --repo <owner/repo> --base main --head <branch> --title "<type>(<scope>): <summary>" --body-file <scratch-body.md> --json
```

## Gotchas

- **Fabricating unknown model versions.** State the exact model ID when exposed by the session; if hidden by the host runtime, write `<Agent Name> (runtime active / inherit)` instead of guessing.
- **Missing files or raw diff spam.** Cover 100% of `git diff --name-status <base>...HEAD` — detail every authored/edited file individually and collapse only bulk obsolete directory removals with exact counts.
- **Opening an MR without authorization.** Pushing branches and opening/merging external MRs follow Director authorization rules in [`../../../PREFLIGHT.md`](../../../PREFLIGHT.md).
