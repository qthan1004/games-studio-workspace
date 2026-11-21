---
name: taste
version: "1.0.0"
released: "2026-11-21"
description: >
  Applies and evolves the Director's personal taste (DIRECTOR_PROFILE.md) and each game's
  creative identity (STYLE_ANCHOR.md) without cross-project contamination. Use when shaping
  creative/architectural output, onboarding the Director, or capturing a user correction.
  Not for GDD structure rules (use designer) or visual polish scoring (use art-audio).
---

# Director Taste & Style Anchor

Prevent generic "AI slop" by grounding judgment, tone, UX, and code craft in two separated layers: **Studio-Global Director Taste** and **Project-Scoped Style Anchors**.

## When to Use

- Designing mechanics, writing narrative/UI copy, structuring architecture, or styling visuals where aesthetic/craft judgment matters.
- The Director says *"Set up my profile"*, *"Learn this"*, or corrects your approach (*"Don't do X, I prefer Y"*).
- Bootstrapping or calibrating a game's `STYLE_ANCHOR.md`.
- **Not for:** blind 0–10 rubric scoring (`workflows/polish-scorecard.md` via `art-audio`).

## Two-Scope Isolation Rule

1. **Project Scope (`Projects/<game>/STYLE_ANCHOR.md` — Default):**
   - Holds North-Star game references (*what to borrow* vs. *what to reject*), 1–10 Experience Dials (pacing, lethality, HUD density, tone), and links to **Golden Samples** (approved dialogue, skill spec, code module, visual target).
   - Corrections made while building a specific game stay `scope: project` by default so tactical-RPG pacing never leaks into an arcade action game.
2. **Studio Scope (`.agent/DIRECTOR_PROFILE.md`):**
   - Holds the Director's cross-project collaboration rules, engineering aesthetics, and universal anti-preferences (`## Always-on summary` kept `< 2,500` chars + `## Sources`).
   - Promote a rule to `scope: studio` only when the Director explicitly states a studio-wide preference or the same correction recurs across 2+ projects.

## Capturing Corrections (`{scene, wrong, correct}`)

When the Director corrects style, workflow, or judgment:
1. Distill one atomic rule (1–2 sentences) ending with `Applies when: <concrete trigger>`.
2. Classify as **Craft/Work** (code, architecture, workflow) or **Taste/Voice** (design feel, visuals, prose) and choose `project` vs. `studio` scope.
3. Check for conflicts with existing rules and propose the update before writing. Enforce a **50-rule cap** per file by merging overlapping rules.
4. For a full intake interview or bulk merge, follow [`../../../workflows/distill-taste.md`](../../../workflows/distill-taste.md).

## Gotchas

- **Writing role-play prompts.** Never write *"You are <Owner>"*; write objective third-person directives (*"Prefers...", "Ask before...", "Never..."*).
- **Recording temporary project state as permanent taste.** *"No audio exists yet"* is a transient state, not a style rule.
- **Default LLM clichés.** Avoid neon purple-blue gradients, verbose tutorial popups, exposition dumps, and over-abstracted boilerplate unless `STYLE_ANCHOR.md` explicitly asks for them.
