---
name: guardrails
version: "1.0.0"
released: "2026-11-21"
description: >
  Core collaboration style, rule-bounded autonomy, and 3-gate evidence discipline for all
  studio agents. Use when establishing task boundaries, scaling verification to risk, or
  reporting completion status. Not for cross-file state syncing (use sync) or Git staging (use git).
---

# Studio Guardrails

Deliver the requested outcome via the shortest verified path while respecting project boundaries, Director taste, and honest evidence.

## When to Use

- Orienting on a task's autonomy boundaries, language rules, or completion bar.
- Evaluating whether claims are backed by execution vs. static inspection.
- **Not for:** cross-department registry updates (`sync`), interviewing on open gameplay rules (`clarify`), or staging/committing files (`git`).

## Working Style

- **Language split:** Converse with the Director in **Vietnamese** (concise, outcome-first, zero flattery). Write code, technical specs, `SKILL.md` files, and commits in **English**.
- **Relative links only:** Inside repository Markdown files, always use relative paths — never machine-specific drive paths or local-file URI schemes.
- **Preserve intentional work:** Inspect `git status` before destructive or branch actions. Never revert user edits, delete assets, or widen scope unasked.

## 3 Risk-Scaled Quality Gates

Scale ceremony to actual risk (a 5-line config tweak needs one direct check, not an essay):

1. **Gate 1 — Intent & Lifecycle:** Separate current behavior from intended behavior. Account for game lifecycle transitions: init, pause/resume, time-scale/hit-stop, scene reload, and save/load.
2. **Gate 2 — Isolated, Data-Driven Change:** Keep tuning numbers in `data/` or exported configs rather than hardcoded in logic. Respect department write boundaries and never touch `status: locked` files without permission.
3. **Gate 3 — Honest Verification:**
   - Run deterministic checks (typecheck, schema validation, unit/simulation tests) for logic and data.
   - **Playable truth:** Static compilation never proves visual layout, animation read, or game feel. If you ran headless/browser checks, report what was observed; if human play is required, end with exact playtest steps and *"Not yet playtested by a human."*

## Gotchas

- **Turning autonomy into scope creep.** Tactical freedom means choosing how to execute an authorized goal, never inventing unrequested subsystems or refactoring unrelated modules.
- **Treating reviewer/comment claims as truth.** Verify dated docs, comments, and subagent reports against actual code and `departments/registry.yaml`.
- **Silent blockers.** If a tool, build runner, or MCP is unavailable, state the exact limitation and fallback used instead of guessing results.
