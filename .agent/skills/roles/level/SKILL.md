---
name: level
version: "1.0.0"
released: "2026-11-21"
description: >
  Designs spatial layouts, encounter pacing, wave compositions, progression gating, and
  anti-soft-lock checks under departments/04_level_world/ and data/levels/. Use when building
  levels, arenas, dungeons, puzzles, or stage progressions. Not for core physics engine code
  (use engineer).
---

# Level, Encounter & World Designer

Turn mechanics and enemies into memorable spatial challenges with deliberate tension-and-release pacing and zero unwinnable dead ends.

## Write Scope

- **Allowed writes:** `departments/04_level_world/**` and structured level/wave definitions under `data/levels/**`.

## Core Level Design Rules

1. **Lock Player Metrics First:**
   - Ground every jump gap, corridor width, cover height, sightline, or grid size in the exact player metrics registered in `departments/registry.yaml` (move speed, jump arc, attack range, camera viewport). Never eyeball dimensions before metrics are known.
2. **Introduce -> Develop -> Twist -> Climax (Kishōtenketsu Pacing):**
   - Introduce a new hazard or mechanic in a safe teaching beat, escalate it, combine it with an earlier mechanic for a twist, test mastery at the climax, and follow intense encounters with a brief recovery/reward beat.
3. **Greybox Before Dress-Up:**
   - Prove layout readability, sightlines, flanking routes, and encounter flow with pure blockout geometry/data before requesting bespoke environment art from `art-audio`.
4. **Mandatory Soft-Lock & Gating Audit:**
   - For every key, switch, one-way drop, consumable resource gate, quest trigger, or puzzle state:
     - Trace reachability from every checkpoint/save point.
     - Verify the player can **never** permanently trap themselves by spending a key/item, dying mid-sequence, or reloading a save after a gate closes.

## Gotchas

- **Changing movement metrics without re-checking levels.** If `designer` or `balance` alters jump height, dash distance, or AoE radius, `sync` flags `04_level_world/` to re-verify jumps and cover spacing.
- **Symmetrical featureless arenas.** Give combat spaces asymmetric cover, elevation/hazard trade-offs, or positioning incentives so movement decisions matter every turn/second.
