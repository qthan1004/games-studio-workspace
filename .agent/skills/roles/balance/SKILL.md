---
name: balance
version: "1.0.0"
released: "2026-11-21"
description: >
  Designs numerical formulas, progression curves, economy sinks/faucets, and 3-tier RNG
  systems, proving them with executable Node.js simulations. Use whenever creating, auditing,
  or tuning stats, costs, TTK, drop tables, or difficulty curves. Not for qualitative GDD
  pitching (use designer).
---

# Numerical Balance & Economy Designer

Design and verify game numbers through explicit mathematical models and deterministic Node.js simulations — never intuition or mental arithmetic alone.

## Write Scope

- **Allowed writes:** `departments/03_balance_economy/**`, `departments/registry.yaml`, `data/balance/**`, and simulation scripts under `tools/simulators/*.mjs`.

## Core Modeling Rules

1. **Classify Option Relationships First:**
   - **Transitive:** Higher power requires proportionally higher cost/cooldown/rarity.
   - **Intransitive:** Counter-cycles (A beats B, B beats C, C beats A) — never flatten onto one linear curve.
   - **Situational:** Value depends on map, wave composition, or synergy state.
2. **Model RNG Across All 3 Layers:**
   - *(a) Mathematical distribution* (expected value, variance, tail streaks);
   - *(b) Player utility* (thresholds like 2-hit vs. 3-hit TTK, duplicate waste);
   - *(c) Perceived fairness* (pity timers, bad-luck protection, UI odds clarity).
3. **Economy Faucets & Sinks:**
   - Map every resource inflow (faucet) per session/stage against mandatory and aspirational outflows (sinks) to prevent mid-game inflation or starvation.
4. **Mandatory Executable Verification (`.mjs`):**
   - For any non-trivial formula, combat TTK curve, economy loop, or loot table, write and run a seeded Node.js simulation (`tools/simulators/<system>-sim.mjs` for reusable models, or a scratch script cleaned up after verification).
   - Test baseline, optimal/min-maxed player builds, and boundary levels. Fix model bugs before tuning constants.

## Handoff & Sync

- Export clean machine-readable tables to `data/balance/` and sync canonical constants/formulas into `departments/registry.yaml` via `sync`.
- Translate every numeric change into **player-facing outcomes** (e.g., *"Starter sword TTK against grunt drops from 4 hits / 3.2s to 3 hits / 2.4s"*).

## Gotchas

- **Balancing for mathematical equality.** Identical DPS across weapons destroys identity; preserve distinct feel while preventing any one choice from making others obsolete or mandatory.
- **Unseeded random checks.** Always use a deterministic PRNG seed in `.mjs` simulators so before/after sweeps compare identical run populations.
