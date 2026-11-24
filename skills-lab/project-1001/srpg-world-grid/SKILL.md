---
name: srpg-world-grid
version: "0.1.0"
released: "2026-11-24"
description: >
  Governs Project 1001's Diamond Convergent WorldState, EncounterComposer, 2-3 tile tactical
  grid geometry, [TURN X] timeline phenomena, End-of-Turn reinforcement arrivals, 3-pass
  DeploymentResolver, and 1,000-seed map validation. Use when designing or coding chapters,
  world flags, tile modifiers, turn-line events, or running map audits. Not for combat damage
  formulas or AI weight tuning (use srpg-ap-utility-ai) or Blender tile modeling (use
  blender-3d-modeler).
---

# Project 1001 — Dynamic WorldState & Tactical Grid (`srpg-world-grid`)

> **Status (`v0.1.0 Pre-Pilot Baseline`):** Staged in `skills-lab/project-1001/srpg-world-grid/` prior to live `Ch.01` 4-tile Blender-to-Unity URP & `1,000-seed` pilot cooking (*Not yet playtested by a human*). All numeric constants obey Project 1001's `<= 1,000` ceiling.

## 1. `Diamond Convergent WorldState -> EncounterComposer`

1. **5 Fixed Story Peaks & `Fail-Forward` Continuity:**
   - Mid-act rosters permute organically from prior kills, bribes (`C10`), and spares (sparing `B10 Olaf` in `Ch.06/12` flips `Ch.20A` Skarnheim cavalry from `Amber` to `Azure`), while converging strictly on **5 Fixed Story Peaks:** **`Ch.01–04`**, **`Ch.14`**, **`Ch.17`**, **`Ch.18` (`5-Turn` defense if `flag_garrick_family_saved == true` vs `8-Turn Fail-Forward` holdout until `#01/#20` shatter the jammer if `false`)**, and **`Ch.22–24`**.
2. **`EncounterComposer` & `SanityClamp`:**
   - Maps commander temperament to Layer-1 `MandateFilter` (`PURSUE`, or `HOLD_TILE` with `MandateOverride` when HP drops `< 65%–70%`, escort `C21` falls, or a rival enters `6` tiles) and locks **`[STORY_SPARE_FLOOR: 1 HP]`** on talk/spare bosses (`B10 Olaf`).
   - **`SanityClamp`:** Hard-caps **`<= 48 active units`** on-grid simultaneously (`60 FPS` SRP Batcher budget; overflow enters the End-of-Turn queue until active units drop `< 42`) and **`<= 1 interrupt trap`** (`C08` / `C14-Nyx`) **per `3-tile` choke width**.
3. **`Stabilized Escrow Economy`:**
   - Enforces **`65% Fixed Bounty + Pre-Emptive Escrow`** (early Elite kills escrow `100%` Gold into the next chapter's chest + `75%` Bonus Camp EXP), tags alarm waves **`[Escalation Wave: 40% EXP, 0 Gold]`** (`0 EXP` if spawn-blocked), and preserves **`100% Promotion Seal Invariance`**.

## 2. Spatial Geometry & `[TURN X]` Timeline Phenomena

1. **Physical Grid & `2–3 Tile Choke Gates + 4×4 Staging Bays`:**
   - **`1 Tile = 2.0m × 2.0m`** (`>= 1.4m × 1.4m` walkable pad), `ΔHeight = 1.0m` (`Tier 0..3`; `|ΔTier| = 1` ramp costs `+1 Move, +2 AP/step`; `|ΔTier| >= 2` impassable except `Flying`; High Ground `+15% Hit` & `+1 Max Range` for `Bow/Crossbow/Mortar`, Low Ground `-15% Hit`, Ledge Knockback `15% MaxHP × ΔTier` cap `45%` & `-20 AP`). Map bounds scale `18×22..32×36`, hard-capped at **`<= 36×36`** (`Ch.24`), built from `7` modular kits (`kit_tile_base_1x1`, `kit_stair_ramp_1x2`, `kit_cover_half_1x1`, `kit_pillar_los_1x1`, `kit_choke_gate_2x1`, `kit_wall_breach_1x1`, `kit_spawn_hatch_1x1`).
   - **Choke Standard:** Side gates use `2` tiles (`4.0m`) and main gates use `3` tiles (`6.0m`) opening into **`4×4` (`8.0m × 8.0m`) Staging Bays** — matching **`Greatsword 1×3`** cleave and **`Sanctuary Cross 5`** `[FF: ON]` ward coverage while keeping `1–2` lanes open if rubble drops. Pair with `Half Cover` (`1.0m`, `LoS: Open`, `-25% Ranged Hit / -20% AoE`), `Full LoS Pillar` (`2.8m`, `LoS: Blocked`, `35%` dither fade), and `Destructible Breach Walls` (`2.4m`, `HP 40–80`, `x2.0 DMG` from `Peerless / Sunder / Explosives` -> `tile_12_cracked_rubble`).
2. **`12 Biome Tile Modifiers` (Base Step = `4 AP/Step`, Move = `Inf/Cav/Fly`):**
   - `tile_01_paved_stone` (`1/1/1, 4 AP`, neutral) | `tile_02_forest_thicket` (`2/3/1, 6 AP`, `+20% Evade, +2 DEF`, burns `10% HP/T` on `Fire`) | `tile_03_bastion_fort` (`1/2/1, 4 AP`, `+15% Evade, +3 DEF/RES, +10% HP & -5 Fatigue` cap `2x`) | `tile_04_red_ash_dune` (`2/3/1 [Mage 1], 8 AP [Mage/Fly 4 AP]`, `+10% Evade, -10% Cav Hit`, halts `C13` charge) | `tile_05_aether_rail` (`1/1/1, 4 AP`, `-10% Evade`, chains `100% Lightning` `4` tiles & `-25 AP` mechs) | `tile_06_aether_spill` (`2/2/1, 6 AP`, `-15% Evade, -3 RES`, `Fire` detonates `[FF: ON] 18 DMG` chain) | `tile_07_black_ice` (`1/2/1, 5 AP`, `-20% Evade, -2 Melee DEF`, `Slide +1 Tile` on push/pull, melts to `tile_08`) | `tile_08_shallow_canal` (`2/3/1, 7 AP`, `-10% Evade, +15% Fire Res, +35% Lightning DMG`, `Cryo` freezes to `tile_07` + `Root 1T`) | `tile_09_solaris_sanctum` (`1/1/1, 4 AP`, `+10% Hit, +4 RES, +8 SP/T, +15% Radiant DMG`, blocks `Ch.24 Supernova`) | `tile_10_silent_miasma` (`2/2/1, 6 AP`, `+15% Veil Evade`, unlit end-turn `-10 SP, -8 Morale, +6 Fatigue` except `0.0x` Pillars) | `tile_11_ashlung_fog` (`1/2/1, 5 AP`, `+25% Evade >=3 tiles`, blocks LoS `>2` tiles & `Overwatch`, `+8 Fatigue/T` after `2T`) | `tile_12_cracked_rubble` (`2/4/1, 8 AP`, `+10% Ranged Cover, -10% Melee Evade`).
3. **Universal `[TURN X] = 100 Base Ticks` & `8 Clickable Turn-Line Weather Phenomena`:**
   - `global_turn_base_ticks = 100` across all 24 chapters and 5 Paralogues; **`Ch.24` adds independent `Mirelle Bells` nodes every `60 Ticks`** (`Bell #1..#15 = 900 Ticks <= 1,000` running alongside `[TURN 1..9]`). Every node telegraphs `1 Turn` (`100 Ticks`) ahead and supports Click-to-Inspect 3D tile highlights:
   - **(1) `phenom_red_ash_gale`** (`2T`: `-1` ranged max range floor `2`, `Sight=5`, clears fire); **(2) `phenom_whiteout_blizzard`** (`2T`: freezes `tile_08 -> tile_07` with `Root 1T/-15 AP`, `+2 AP/Step` outside `Radius 3` heaters, `+1` push slide); **(3) `phenom_ashlung_surge`** (`2T`: `Sight=2`, disables `Overwatch`, enforces `Fog Artillery Lock`); **(4) `phenom_armored_train_salvo`** (instant rail crush `65 DMG / -40 AP` on `tile_05` + two `3×3 [FF: ON] 28 DMG` salvos leaving `tile_06`); **(5) `phenom_solaris_zenith`** (`2T`: strips `Stealth/Veil`, `+20% Radiant DMG`, activates `tile_09`); **(6) `phenom_canal_floodgate`** (`2T`: floods `Tier 0 -> tile_08`, sweeps non-Flying/non-Bastion `2` tiles & `-25 AP`); **(7) `phenom_leyline_eruption`** (occupied `1×1` center grants `+15 SP & +15% ATK/MAG 1T`; `Ring 1` — plus empty center — blasts `[FF: ON] 22 Arcane DMG & -20 AP`); **(8) `phenom_mirelle_bell`** (`Ch.24` `60-Tick` nodes: `#4/#8/#12` heal `+35% HP/+30 SP` & spawn four `2×2` Sanctuaries; `#13–#14` collapse outer rims; `#15` triggers `White Purge` at `Tick 900`).
4. **End-of-Turn Reinforcement Arrival:**
   - Requires a **`1-Turn` dual telegraph** on `[TURN X]` and `kit_spawn_hatch_1x1` (`Amber` Enemy / `Azure` Allied), spawning strictly at Turn end with `Retaliation Token = 1`: **Enemy `SpawnAP = 25..30` (`<= 30`)**, **Allied `SpawnAP = 30..35`**.
   - **Creep Spawn-Block vs Named `BFS 1..3`:** Occupying an enemy hatch cancels `C01–C50` spawns for that turn (`+10 Camp EXP`, or `0 EXP` on `[Escalation Wave]`). Named Bosses/Allies (`B01–B32`, `#01–#30`, `Olaf`) never cancel — they displace via concentric **`BFS 1..3` tiles** with valid `A*` arena access and enemy `SpawnAP <= 30`.

## 3. `DeploymentResolver` (`FIXED -> SLOT_POOL -> ZONE_SCATTER`) & `CLP <= 10`

1. **3-Pass Resolution & 5 Anti-Soft-Lock Invariants (`1,000 Seeds`):**
   - Resolves `Pass 1: FIXED` (bosses, seals, switches, hostages, hatches) -> `Pass 2: SLOT_POOL` (curated perches/cover for Elites and `No-Go Zone` units) -> `Pass 3: ZONE_SCATTER` (`[R_min, R_max]` patrol clusters), audited via [scripts/validate-chapter-map.mjs](scripts/validate-chapter-map.mjs) (`node scripts/validate-chapter-map.mjs --map <path.json> --json`):
   - **(1) `MaxThreatOverlap <= 2`:** `No-Go Zone` archetypes (`C14 [4–9], C15 [2–6], C28 [1–8], C38 [2–6]`) MUST use `SLOT_POOL` and satisfy `ThreatOverlap(x, y) <= 2` across choke approaches and player spawns.
   - **(2) `AP-Aware Fair Start`:** Enforce $D_{\text{path}}(e, \text{PlayerSpawn}) > K_{\text{AP}}(e) \cdot \text{Move}(e) + \text{MaxRange}(e)$ with **`K_AP = 2` for `SPD >= 22`** (`C18, C19, C23, C24, C31, C35, C39`) and `K_AP = 1` for `SPD < 22`.
   - **(3) `2×2` & `A*` Reachability:** Ground `1×1` `A*` reaches every chest, switch, hostage, and exit without `Flying` (pre- and post-`Breach Wall`), and `2×2` units (`Chebyshev Clearance = 2`) path cleanly to the main arena.
   - **(4) `Virtual Squad Anchor`:** `ZONE_SCATTER` squads inherit a zero-entity `SLOT_POOL` anchor when their commander was neutralized in prior `WorldState`.
   - **(5) `5-Step Fallback`** (preserving Invariants `1–3`): `(1)` AoE spacing `2 -> 1` -> `(2)` radius `+2` -> `(3)` secondary terrain -> `(4)` `Secondary Zone` -> `(5)` `[TURN 2]` End-of-Turn queue (`SpawnAP = 25..30`).
2. **Cognitive Load (`CLP <= 10`, `<= 12` Climax Override) & Fair Fog Contract:**
   - Sum active complexity weights (`Fog +3`, `Split-Wing +2 [+3 Ch.24 -> 0 Fog, 0 AI Guest]`, `Escort +2 [NPC Preservation=3.0 Turns 1–4]`, `Dark Shadow AI +2 [+1 Tier C]`, `Timers +1..2`, `[TURN X] Weather +1..2`, `Boss Puzzle +2`) <= **`10 CLP`** (`<= 12` explicit climax override).
   - Enforce **`Ashlung Fog` blind-artillery ban (`Fog Artillery Lock`:** `4–9` tile mortars cannot fire from unrevealed fog), **`[STORY_SPARE_FLOOR: 1 HP]`**, and `Hard Mode 30–60s Shot-Clock` (`60s` on `Fog` or `CLP >= 8`; pauses on movement, `0.8s` fog-reveal grace, and cut-ins; timeouts revert uncommitted moves to `Wait [-25 AP]` or `Bastion Defend`).

## Gotchas

- **`1-tile` GBA corridors causing 16-unit `[FF: ON]` self-wipes:** Narrow `1-tile` main hallways jam 16-unit armies, turn `Cross 5` spells into friendly-fire kills, break `Greatsword 1×3` cleave, and soft-lock on `1` rubble/trap. Always build `2–3` tile chokes with `4×4` staging bays or a destructible/flank bypass.
- **Same-Turn Ambush Spawns:** Spawning enemies mid-turn or at `100 AP` snipes healers unfairly. Lock arrivals to `[TURN X]` after a `1-Turn` `Amber/Azure` telegraph at `SpawnAP = 25..30` (Enemy) or `30..35` (Allied).
- **Randomizing `C14 / C15 / C28 / C38` outside `SLOT_POOL`:** Scattering or hard-fixing `No-Go Zone` artillery, Overwatch crossbows, lasers, or SP-drain totems causes lethal `>= 3` sightline overlaps. Restrict all four to `SLOT_POOL` with `MaxThreatOverlap <= 2`.
- **Naive per-kill economy punishing early Elite kills:** Removing bosses/squads via `WorldState` without `65% Fixed Bounty + Pre-Emptive Escrow`, `[Escalation Wave: 40% EXP, 0 Gold]`, and `100% Promotion Seal Invariance` starves proactive players or enables infinite wave farming.
