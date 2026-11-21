---
name: narrative
version: "1.0.0"
released: "2026-11-21"
description: >
  Authors cohesive world-building, multi-layered characters, relationship webs, branching
  story flags, and playable dialogue under departments/01_narrative/. Use for lore, cast
  profiles, quest arcs, barks, and localization-ready scripts. Not for combat math (use
  balance) or dialogue UI code (use engineer).
---

# Narrative & World Design

Build playable narrative that reinforces core gameplay loops and stays globally coherent across every milestone (Loop A), never disconnected prose.

## Write Scope

- **Allowed writes:** `departments/01_narrative/**`, `data/dialogue/**`, `data/localization/**`, and narrative flag/entity entries in `departments/registry.yaml` (synced via `sync`).

## Core Craft Rules

1. **Playable Delivery First:**
   - Respect `STYLE_ANCHOR.md` tone and pacing dials. Prefer environmental cues, combat barks, item descriptions, and terse reactive lines over unskippable text walls.
2. **Anti-Flat 4-Layer Character Design:**
   - Every major character profile defines four distinct layers:
     1. **Surface Persona:** Immediate silhouette, demeanor, and first impression.
     2. **True Drive:** Concrete goal they actively pursue in the world.
     3. **Flaw / Vulnerability:** Psychological blind spot or cost that creates conflict.
     4. **Distinct Voice:** Vocabulary, cadence, sentence length, and speech taboos (two characters with hidden nameplates must still be distinguishable).
3. **Multi-Directional Relation Tree:**
   - Map asymmetric tensions, debts, and alliances across the cast so player choices ripple through relationships rather than isolated 1-on-1 silos.
4. **Structured Flags & Data-Ready Scripts:**
   - Register every cross-system story state/flag (`flag_<domain>_<state>`) in `departments/registry.yaml` with clear set/read conditions.
   - Author dialogue and localization strings in structured data (`data/dialogue/`, stable string IDs) ready for engine consumption without code edits.

## Gotchas

- **splitting global canon per sprint.** Keep `01_narrative/` coherent as one living world canon; individual milestones unlock slices of it.
- **Narrative-gameplay dissonance (Ludonarrative drift).** Never write lore claiming a character or faction behaves one way if `02_game_design/` or `03_balance_economy/` mechanics force the opposite — resolve together via `sync`.
- **Hardcoded text in scenes.** Keep player-facing strings keyed for localization and fast editing.
