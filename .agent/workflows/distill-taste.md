---
name: distill-taste
version: "1.0.0"
released: "2026-11-21"
description: Five-minute Director intake and ongoing rule promotion/compaction workflow for DIRECTOR_PROFILE.md (studio scope) and STYLE_ANCHOR.md (project scope).
---

# Workflow: Distill Director Taste & Project Style Anchor

Used by [`general/taste`](../skills/general/taste/SKILL.md) for initial studio setup, new game style calibration, or promoting/compacting learned corrections.

## Mode A — 5-Minute Studio Director Intake (`.agent/DIRECTOR_PROFILE.md`)

1. **Inspect existing context first (Read-Only):** Read `.agent/DIRECTOR_PROFILE.md` and any user-approved notes so you never re-ask known facts. Never ask for secrets or tokens.
2. **Ask one concise grouped round (skipping known answers):**
   - How should agents communicate and present trade-offs?
   - Which actions may agents execute directly vs. always ask first?
   - Core game-design preferences (pacing, tutorial philosophy, challenge/fairness bar)?
   - Core engineering preferences (module granularity, data formats, abstraction bar)?
   - Hard pet peeves / "AI slop" patterns agents must **never** produce?
3. **Draft & Review:** Update `.agent/DIRECTOR_PROFILE.md` in third-person directive style (`Prefers...`, `Never...`), keeping `## Always-on summary` under `2,500` characters and logging provenance in `## Sources`. Show the diff for Director confirmation.

## Mode B — Project Style Calibration (`Projects/<game>/STYLE_ANCHOR.md`)

1. Define **2–3 North-Star References** with explicit columns: `Reference Game | Borrow Exactly This | Do NOT Borrow This`.
2. Set **Experience Dials (`1–10`):** Input Snappiness, Punishment/Lethality, HUD Information Density, Narrative Tone.
3. Link **Golden Samples** as soon as the Director approves the first exemplar of dialogue, mechanic spec, data table, or code module.

## Mode C — Correction Capture & 50-Rule Compaction

1. Extract `{scene, wrong, correct}` + `Applies when: <trigger>`.
2. Default to `Projects/<game>/STYLE_ANCHOR.md` (`scope: project`). Promote to `.agent/DIRECTOR_PROFILE.md` (`scope: studio`) only when confirmed across 2+ projects or explicitly requested as global.
3. If rules exceed **50 entries**, merge semantically overlapping rules (preferring newer phrasing), preserve `## Sources`, and report `"Merged N similar rules into M"`.
