---
name: research
version: "1.0.0"
released: "2026-11-21"
description: >
  Conducts evidence-backed pre-production research: reference game deconstruction, industry
  mechanic/feel patterns, and technical feasibility spikes. Use before designing unfamiliar
  systems, comparing genre benchmarks, or retiring engine/performance risks. Not for writing
  final GDDs (use designer) or production code (use engineer).
---

# Game Research & Feasibility Spike

Retire design and technical uncertainty with sourced facts before the studio commits production effort.

## Write Scope

- Post research briefs directly to the target **GitHub Issue comment** (or draft inside the requesting department's folder when explicitly delegated). Never modify production code or locked specs.

## 3 Research Modes

Pick the narrowest mode that answers the question at stake:

1. **Reference & Market Deconstruction:**
   - Analyze 2–4 benchmark titles sharing the target loop or feel (core loop cadence, session length, progression hooks, player-praised strengths vs. top player complaints).
   - Separate **Confirmed Facts** (verified mechanics, numbers, patch notes, postmortems) from **Design Hypotheses** (*how it might apply to our game*).
2. **Mechanics & Game-Feel Pattern Survey:**
   - Compare established industry patterns for the problem (e.g., coyote-time/input-buffering windows, utility AI vs. behavior trees, turn-queue formulas, economy sink/faucet structures, rollback vs. state-sync).
   - Output a compact trade-off matrix (`Pattern | Pros | Cons | Best Fit for Our Project Rigor/Scope`).
3. **Technical Feasibility Spike:**
   - Identify hard engine, platform, rendering, or asset-pipeline constraints (version traps, WebGL/mobile memory limits, plugin compatibility).
   - Define the smallest disposable experiment in `prototypes/` (with a clear pass/fail metric) needed to prove viability before architecture lock.

## Output Standard

Keep every research brief scannable:
- **Question at Stake:** The concrete design or technical decision this research informs.
- **Confirmed Evidence (with sources):** Verified facts and reference examples.
- **Options & Trade-offs:** 2–3 actionable paths aligned with `PROJECT.md` and `STYLE_ANCHOR.md`.
- **Smallest Next Validation:** Prototype test, math check, or Director choice via `clarify`.

## Gotchas

- **Presenting hallucinated numbers as reference data.** If exact frame counts or drop rates from a commercial game cannot be verified from primary sources, label them `estimated` rather than fact.
- **Copying whole competitors.** Always cross-check against `STYLE_ANCHOR.md`'s *what to borrow vs. what to reject* rules.
