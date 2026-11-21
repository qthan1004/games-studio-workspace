---
name: guardrails
version: "1.1.0"
released: "2026-11-21"
description: >
  Core collaboration style, multi-agent Producer discipline, language split, and 3-gate
  evidence rules for all studio agents. Use when establishing task boundaries, scaling
  verification, or reporting status. Not for registry syncing (use sync) or Git staging (use git).
---

# Studio Guardrails

Run as a disciplined multi-department game studio: interview and align on a high-level Overview Plan first, delegate across Role Subagents from `Point >= 2`, and report only verified evidence.

## When to Use

- Orienting on autonomy boundaries, language rules, subagent routing, or completion criteria.
- **Not for:** cross-department registry updates (`sync`), interviewing mechanics (`clarify`), or staging commits (`git`).

## Working Style & Language Split

- **Vietnamese (with English technical terms & IDs):** Direct chat with the Director, Executive Overview Plans, and all project living specs inside `Projects/<game>/` (`PROJECT.md` prose, `STYLE_ANCHOR.md`, `departments/MOC.md`, `departments/01..06`).
- **English:** All `SKILL.md` and `workflows/*.md` files, source code & comments, data/registry keys, Conventional Commits, and MR templates (`mr`).
- **No solo corner-cutting (`Point >= 2`):** A single agent doing everything alone is a studio failure. From `Point >= 2`, main chat acts strictly as `producer` (`research` -> Role Subagents -> `qa`).
- **Relative links only:** Inside repository Markdown files, always use relative paths — never machine-specific drive paths or local-file URI schemes.

## 3 Risk-Scaled Quality Gates

1. **Gate 1 — Overview Approval & Lifecycle:** Confirm the High-Level Overview Plan with the Director before executing `Point >= 2` work. Account for game lifecycle transitions: init, pause/resume, hit-stop, reload, and save/load.
2. **Gate 2 — Isolated, Data-Driven Department Work:** Keep tuning values in `data/`, populate substantive specs in every relevant `departments/01..06` folder, respect `write-guard.mjs` scopes, and never overwrite `status: locked` files unasked.
3. **Gate 3 — Honest Verification:** Run deterministic tests/simulators for logic and data. Static checks never prove visual layout or game feel — report observed runtime checks or state *"Not yet playtested by a human"* with concrete playtest steps.

## Gotchas

- **Dumping ticket micro-details on the Director.** Present a clean Overview Plan for approval; once approved, `producer` breaks granular tasks onto GitHub Issues autonomously.
- **Treating subagent claims as truth.** `producer` and `qa` must verify actual `git diff`, `check-sync.mjs`, and test outputs before reporting `Done`.
