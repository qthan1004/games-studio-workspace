---
name: polish-scorecard
version: "1.0.0"
released: "2026-11-21"
description: Iterative blind two-judge scoring workflow (out of 10) to raise animations, VFX, UI, or game-feel items to a named target bar.
---

# Workflow: Blind Two-Judge Polish Scorecard

Used by [`roles/art-audio`](../skills/roles/art-audio/SKILL.md) and [`roles/qa`](../skills/roles/qa/SKILL.md) when the Director sets a numeric quality target (e.g., *"Get combat skills to 8/10"*).

## Steps

1. **Pin Target & Benchmark:**
   - Restate the exact target score (e.g., `8/10` on **every** listed item, never rounded up) and the named visual/feel benchmark from `STYLE_ANCHOR.md`.
2. **Anchor a 5-Criterion Rubric (`0–2` points each = `10` max):**
   - Example for skills/animations: *(1) Silhouette & Anticipation Read, (2) Contact Frame & Hit-Stop Sync, (3) Follow-Through & Weight, (4) VFX/Lighting Cohesion, (5) Target Reaction & Aftermath*.
   - Include measurable checks where applicable (frame budget, draw calls, zero scale/offset drift after recovery).
3. **Capture Deterministic Baseline:**
   - Capture frames/screenshots on a stepped or seeded deterministic state (`browser` subagent or headless engine capture) at native resolution, clear of HUD overlap.
4. **Judge Blind with Two Fresh Read-Only Subagents:**
   - Spawn **two independent read-only subagents** given only the rubric, benchmark description, and anonymized captures (no code, no author claims, no prior scores).
   - Keep the **lower** of the two totals. `7.5` against an `8` bar is not yet passing.
5. **Iterate & Lock In:**
   - Fix the lowest-scoring criterion first without breaking 60 FPS frame budgets or `registry.yaml` timings, then re-capture and re-judge under the identical rubric.
   - Stop when the lower judge meets the bar or when an item hits a hard asset/model ceiling (report honestly what asset/tool is needed).
   - Post the final `Before -> After` scorecard table to the active **GitHub Issue / PR** rather than cluttering the repo with temporary report files.
