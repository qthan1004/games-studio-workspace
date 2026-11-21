---
name: crew
description: Use when launched with a captain brief (a `.agent-runs/<run>/<task>/brief.md` path or `/crew <run>/<task>`) to implement or investigate one task inside an isolated git worktree.
metadata:
  internal: true
---

# Crew (worker in a worktree)

Goal: complete exactly the briefed task inside its worktree, with evidence the captain can verify without re-exploring.

Rules are unchanged: the repo entrypoint, `personal-behavior` (MCP-first, Gate 1 → 2 → 3), and the skills the brief names. The brief narrows scope; it never loosens a rule.

## Start (every session, including relaunch)

1. Read `brief.md`, then `notes.md` and `inbox.md` from the task folder. Resume from notes instead of re-exploring.
2. **Mandatory preflight.** Read the actual repository entrypoint, workspace `personal-behavior`, and active repository `.agent/PREFLIGHT.md` (workspace preflight for workspace-only tasks). Execute applicable skill routing before dependent work; a brief mentioning PREFLIGHT is not execution. Record the paths read, selected skills, branch/scope constraints and actual MCP operation or disclosed fallback in the checkpoint. Load only relevant references; do not recursively load the skill library.
3. **Isolation assertion.** The toplevel and branch must equal the exact values assigned in the brief. A worker branch forks from the current feature/fix-bug/hot-fix work branch's recorded HEAD, uses the repository's naming rules, and later merges back into that same parent. Never require `agent/<task>` or fork from CI. An exclusive original checkout is allowed only when explicitly assigned for a serial run; parallel writers use separate worktrees.
4. If the brief has unfilled TODOs in intent, acceptance, or permissions, set `needs-input` and stop.
5. Record `running` in the assigned status/checkpoint. Use `fleet.mjs set` only for helper-managed runs; do not require the helper for native/CLI artifacts.
6. Consult domain memory only when preflight/task context calls for it; accepted task/spec sections already supplied are the starting source. Treat stale notes and hypotheses as leads, not evidence.

## Work

- **Ship**:
  1. Gate 1, using `diagnose` for bugs.
  2. `test-driven-development` in batch mode: test matrix, red evidence, freeze, green.
  3. Gate 2, then Gate 3.

  Work in slices. After each slice: update `notes.md` (what changed, digests, next step), read `inbox.md`, and run the full suite when the brief or repo requires it.
- **Scout**: Gate 1 only. Write `report.md`. Scratch edits must stay uncommitted, and none of them is the fix.
- Stay inside the brief. If a needed change falls outside scope, write it under `## Questions` and set `needs-input`; do not widen scope.
- Logs: save raw output to `<task-folder>/logs/*.log` as UTF-8 (`... 2>&1 | Out-File -Encoding utf8 <file>`) and read it only through `log-digest.mjs` (`--compare` against the baseline).
- Commits only if the gate granted them:
  - stage explicit paths;
  - run `clean-commit/scripts/inspect-staging.ps1` before each commit;
  - never commit agent config or env files;
  - never push, merge, or rebase.

## Questions and blockers

- Send questions directly to the captain in the main chat; never address the user yourself. Write the question in `report.md` under `## Questions`, with evidence, options and your recommendation. Do not create another coordinator or bridge agent.
- `fleet.mjs set --state needs-input`, then continue an unblocked slice or stop.
- Answers arrive in `inbox.md`. Mark them `[x]` when applied.

## Finish

1. Self-check against every acceptance criterion, with evidence.
2. Write `report.md` in the brief's format. It must start with `Outcome: <one line>`. Include `Wiki candidates` if any.
3. Record `done` in the assigned checkpoint (`fleet.mjs set` for helper-managed runs). Use `failed` with the reason if the stop-when cannot be met. Include preflight evidence and leave no writer active after completion unless assigned a correction.
4. Captain integrates into the recorded parent work branch only after gates pass. After verified integration, the worker branch is retired under the user's recorded cleanup authorization; never delete it while dirty, unmerged or still being written. Branch retirement does not by itself authorize removing a worktree directory.

The captain verifies and reviews independently, so never overstate.
