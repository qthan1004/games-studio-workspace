---
name: hygiene
version: "1.0.0"
released: "2026-11-21"
description: >
  Enforces 1-line rule-free code comments, clean separation of tuning data from logic,
  relative Markdown links, and draft/locked document frontmatter across all studio files.
  Use whenever writing or editing source code, shaders, data files, or department docs.
  Not for architectural paradigm choice (use architect).
---

# Code, Data & Document Hygiene

Keep source code readable, tuning parameters data-driven, and department documents cleanly governed without stale prose hiding inside code files.

## When to Use

- Writing, editing, or reviewing code comments, `data/` tables, or `departments/` Markdown specs.
- Locking or unlocking a design spec's status header.
- **Not for:** system architecture design (`architect`) or cross-file sync checks (`sync`).

## Core Rules

1. **Single-line, mechanism-only code comments:**
   - Every inline comment must be **at most one short line** explaining *what technical mechanism* the snippet performs (e.g., `// Decay camera trauma using unscaled real time.`).
   - Prefer self-explanatory names and types; if clear, write **no comment**.
   - **Zero gameplay rules or ticket stories in comments:** Never write multi-line blocks, `STEP 1/2` narratives, issue IDs, or imperative design rules (`MUST`, `ONLY`, *"boss deals 2x damage in phase 2"*) inside code. Put rules in `departments/` specs and numbers in `data/`. If an explanation needs multiple lines, tell the user and document it in `departments/`.
2. **Data-Driven values first:**
   - Gameplay tunables (damage, cooldowns, speeds, drop weights, dialogue lines, wave counts) belong in structured `data/` files or engine data assets — never as magic numbers buried inside logic loops.
3. **Lightweight Document Governance (`status: draft | locked`):**
   - Every living spec under `departments/01..06` starts with YAML frontmatter containing at minimum `title`, `owner`, `status: draft | locked`, and `updated: YYYY-MM-DD`.
   - Agents freely refine `status: draft` files within their department scope, but **never** edit a `status: locked` file without explicit Director unlock approval.
4. **Portable Markdown:**
   - Use relative paths (`../03_balance_economy/formulas.md`) for all internal links; avoid decorative emoji clutter in dense technical tables when plain status tokens (`[LOCKED]`, `[SYNC-REQUIRED]`) read cleaner.

## Gotchas

- **Trusting stale code comments.** Treat existing rule-heavy comments as unverified hypotheses; delete or replace them when aligning code with `registry.yaml` and GDDs.
- **Duplicating tables into prose.** State a numeric table once in `data/` or its owning `03_balance_economy/` doc and link to it elsewhere.
