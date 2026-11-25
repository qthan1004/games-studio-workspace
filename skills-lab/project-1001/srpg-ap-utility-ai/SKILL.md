---
name: srpg-ap-utility-ai
version: "0.1.0"
released: "2026-11-24"
description: >
  Implements and verifies Project 1001's Compact <= 1,000 combat math, 14-byte UnitHotState
  BiasedAP timeline, 2-RN Hit / 1-RN Crit RNG, FrameCon/EffCon weight model, 36-level Hybrid
  Banded Growth, and symmetric 4-Layer Utility AI with [STORY_SPARE_FLOOR: 1 HP]. Not for
  spatial map layout (use srpg-world-grid) or Unity MonoBehaviour rendering (use unity-urp-srpg).
---

# Compact 14-Byte Combat Math & 4-Layer Utility AI (`srpg-ap-utility-ai`)

> **`v0.1.0 Pre-Pilot Baseline`:** Isolated inside `skills-lab/project-1001/srpg-ap-utility-ai/` outside `.agent/skills/` (never auto-loaded). Verify all formula or AI weight edits with [scripts/sim-combat-check.mjs](scripts/sim-combat-check.mjs) (`--seed 10012026 --json`).

## When to Use

- Designing, coding, or auditing `Covenant.Core` combat math, `BiasedAP` turn queues, `2-RN / 1-RN` RNG, `36-Level` progression, or the symmetric `4-Layer Utility AI`.
- **Not for:** spatial grid generation (`srpg-world-grid`) or Unity URP `MonoBehaviour` presentation (`unity-urp-srpg`).

## 1. `Compact <= 1,000` & `Hot 14-Byte UnitHotState` Contract

1. **Strict Numerical Ceiling (`<= 1,000`):**
   - Every unit stat, shield, summon, item price, and chapter credit bounty stays `<= 1,000`. **Only `B32 Seraphim Abaddon (Phase 2)` hits `1,000 HP`**; playables cap at `<= 80 HP` (hard cap `100`) and `<= 55` core stats (cap `60`; bosses `<= 64`).
2. **Binary Split (`14-Byte UnitHotState` vs. `ImmutableBattleHeader`):**
   - **`UnitHotState` (`14 B/unit`, `48 units = 672 B`, `0-GC` rewind & AI lookahead):**
     - `Bytes 0..3` (`uint32`): `CurrentHP (10b)` + `LockedGrayHP (10b)` + `Poise (4b)` + `WeaponSlot (3b, Turn-End Main-Hand)` + `Friction (3b)` + `Control (2b)`.
     - `Byte 4` (`uint8`): **`BiasedAP = Clamp(RawAP, -50, +205) + 50`** (`0..255`; `RawAP = 0 -> 50`, turn threshold `RawAP = 100 -> 150`). Battle-start `RawAP_init = 35 + floor(3 * EffSPD / 2)` uses pure integer math (`0` float `.5` drift). Negative bracket `RawAP in [-50..-1]` (`Post-Cast Delay`) is uncleansable and immune to `+AP` boosts until ticking to `>= 0`.
     - `Byte 5` (`uint8`): `CurrentSP` (`Init = 30`, `40` `Well-Rested`, `MaxSP = 100..130`; `Apex Ultimate` burns `100% MaxSP` + `100% AP`).
     - `Bytes 6..7` (`uint16`): `TacticalFlags` packing **`2-bit RetaliationTokens [0..3]`**, `BastionDefend`, `WaitExposure`, `PreCharge`, and `SanctuaryWard`.
     - `Bytes 8..9`: `GridX`, `GridY` (`2 x uint8`); `Bytes 10..11`: `StatMods/Timers`; `Bytes 12..13`: `Links/Cooldowns`.
   - **`ImmutableBattleHeader` (`Cold Header`, `0 bits` in `UnitHotState`):**
     - Holds `MaxHP`, `BaseStats[7]`, **`FrameCon = BaseCon + ClassCon (4..14)`** (`Slender 4–6`, `Athletic 7–9`, `Heavy 10–14`), battle-start immutable **`EffCon = FrameCon + floor(BaseSTR / 8) (4..20)`**, and `StorySpareFloorOneHp`.
     - `WeightPen = max(0, WeaponWt - EffCon)`, `EffSPD = max(4, BaseSPD + GearSPD + BuffSPD - WeightPen - TerrainPen)`.
3. **`1 Retaliation Token` Invariant:**
   - `Init = 1` at `Tick 0`, refreshed to `1` on `RawAP >= 100` (`2–3` under `Bastion Defend` / `Riposte`).
   - Counter consumes `1 Token` (`0 AP`) within `Turn-End Main-Hand` range, forced **`Single-Target`, `80% Base Might`, `[FF: OFF]`** (prevents `Greatsword` cleave teamkills).
   - **`0% Counter` lock** when **`RawAP < 0` (`BiasedAP < 50` — `RawAP == 0` still counters)**, **`Pre-Charging`**, or **`0 Poise` (`Staggered`)**.

## 2. Combat Formulas, Bloodline Echo & `36-Level` Progression

1. **3-Tier RNG Split (`2-RN Hit` + `1-RN Crit`):**
   - **Hit (`True Hit 2-RN`):** Draw `RN1, RN2 in [0..99]`; hit iff `floor((RN1 + RN2) / 2) < UI_Hit` (`72% UI -> 84.60%`, `30% UI -> 18.30%`).
   - **Crit (`Strict 1-RN`):** On hit, draw `RN_crit in [0..99]`; crit iff `RN_crit < UI_Crit` (`2.0x` post-mitigation single hit; `1.5x` per hit on multi-hit arts; `1.0x` vs `Leviathan Scale Ward`).
2. **Weapon-Driven `Swift` vs. `Peerless` & Subtype Rules:**
   - **`Swift` (Light Main-Hand):** `+20% Hit`, `-15% Base DMG`, `~-20% AP` (`55–70 AP`) — hunts high-evade assassins/mages.
   - **`Peerless` (Heavy Main-Hand backed by `EffCon`):** `+35%–45% Base DMG`, `+25% DEF/RES Pierce` + `-Poise`, `-15%..-20% Hit`, `85–105 AP` — crushes heavy armor.
   - **`1A. Rapier` (`60 AP`):** **`20% DEF Ignore`** (`Vantage` when `EffSPD - TargetEffSPD >= 4`), preserving `Peerless Warhammer`'s `>3x DP100AP` armor-breaking lead.
   - **`1C. Twin Blades` & `4B. Repeater Crossbow` (`65 AP`, `2x Strikes`):**
     `RawStrike = round((STR + 0.60 * WeaponMight) * 0.85)`, `FinalDMG = sum_2 max(1, RawStrike - EffDEF)`. Multi-hit `SP` Combat Arts (`Astra`) subtract `EffDEF` once before splitting across `N` hits.
   - **Special Bloodline `Flash Suppress` (`Reinhart` Chain):** Inflicts **`0% Counter`** suppression on the target and triggers an adaptive **`min(DEF, RES)` echo** strike along the `Reinhart` bloodline skill chain.
   - **`[FF: ON]` & Affinity:** `[FF: ON]` deals `60%` DMG to unwarded allies (`-25 / -40 / -70 Hidden Affinity`; `0%` under `Sanctuary Ward`). `Radiant <-> Abyssal` grants `+25% DMG` (`+50%` specialists).
3. **`36 Levels` (`3 × 12`), `Hybrid Banded Growth` & `Elder +10 Offset`:**
   - **`3 Tiers × 12 Levels` (`Promote Lv.8..12`):** Max `33` level-ups + `2` promotion bonuses (`Vanguard Seal` / `Sovereign Crest`). `WEXP` thresholds `[0, 40, 110, 210, 350]`; `24 Normal` units unlock `Apex Ultimates` at `Class Tier 3 + Mastery Lv.4 (210 WEXP)`.
   - **`Hybrid Banded Growth [μ - 2 .. μ + 3]` (`μ = L * g`):** Force `+1` if `G(L-1) <= floor(μ) - 2`, force `0` if `G(L-1) + 1 > ceil(μ) + 3`, roll `1-RN` inside band; if all 7 stats roll `0`, grant `+1` to largest `(μ - G)` deficit (`0.00%` dead levels).
   - **`Elder +10 Internal Level Offset`:** `InternalLv = CumulativeUps + 1 + ElderOffset` (`+10` for Elders `#13, #29, #09, #26` + `+25% Veteran Mentorship EXP` within `3 tiles`) on `1.24x` rubber-band EXP (`Hit = Clamp(round(10 * 1.24^(ΔL/2)), 2, 30)`, `Kill = Clamp(round(32 * 1.24^ΔL * M_Boss), 5, 100)`).

## 3. Symmetric `4-Layer Faction-Agnostic Utility AI` & `[STORY_SPARE_FLOOR: 1 HP]`

Shared `0-GC` `< 1 ms/turn` evaluator driving Enemies (`C01–C50`, `B01–B32`) and Teal-Banner Allies (`Dark Shadow #02–#06`):

1. **Layer 1 — `MandateFilter (+ MandateOverride)`:** Prunes actions violating `HOLD_TILE`, `TETHER_ZONE`, `SENTRY_WAIT`, `STAND_DOWN`, `PURSUE`, or `FREE_ENGAGE`, manages Boss 3-stage postures (`Static Bastion -> Triggered Awakening -> Ambush Predator`), applies `Commander Ping`, and **locks target utility `= 0` when a `[STORY_SPARE_FLOOR]` unit is at `1 HP`**.
2. **Layer 2 — `TacticalEvaluator` (`10 Buckets` + `5 Fairness Caps`):** Scores 10 intent buckets across `Global`, `Opponent Formation`, `Self`, and `Target & AP Timeline` states under 5 caps: `Tiered AI IQ` (bandits/beasts ignore formation traps), `2-Turn Impatience`, **`Focus-Fire Cap 2 (Normal) / 3 (Hard)`**, **`AoE Token Cap (1–2/cycle)`**, and `Difficulty Scaling`.
3. **Layer 3 — `PersonalityWeightResolver`:** Computes `EffectiveWeight = Clamp(BaseWeight * ContextMod, 0.05, 3.0)`, **preserving exact `BaseWeights` when `B02–B06` defect into `Dark Shadow #02–#06`**. Whenever personality shifts a candidate's score **`> 35%`** vs. pure tactical optimum, emit a **`UI Inspect Tag` & `Battle Bark`**.
4. **Layer 4 — `ProbabilitySampler`:** Filtered Softmax over **`Top-5` (`>= 70% S1`, `τ = 0.80`) for Creeps** and **`Top-2..3` (`>= 85% S1`, `τ = 0.35`) for Bosses & `Dark Shadow`**.
5. **`[STORY_SPARE_FLOOR: 1 HP]` Non-Lethal Clamp:** Targets flagged for `Talk` / recruitment never drop below `1 HP` from **Ally/`Dark Shadow` AI**, **Player `Retaliation` counters**, or **`[FF: ON]` / terrain DoTs**, and drop AI target score to `0` at `1 HP`; only a confirmed manual player execution can kill them.

## 4. Deterministic Verification CLI

Run [scripts/sim-combat-check.mjs](scripts/sim-combat-check.mjs) (`node scripts/sim-combat-check.mjs --seed 10012026 --json`) after any formula or AI edit; require `ok: true` and exit code `0`.

## Gotchas

- **Applying `2-RN` to `Crit`:** Compresses `15% UI Crit` down to `4.65%` (`-69.0%` relative loss), gutting crit duelists; `Crit` must always use `1-RN`.
- **Multiplying `0.60 * (STR + Might)` or double-applying `0.85` on dual-hit weapons:** Causes flat `EffDEF` to tax `STR` twice (`Twin Blades` `DP100AP` vs. assassins collapses from `40.87` to `~17.0`); scale `0.60` on `WeaponMight` only inside `round((STR + 0.60 * Might) * 0.85)`.
- **Forgetting `Retaliation` or `[FF: ON]` bypass on `[STORY_SPARE_FLOOR: 1 HP]`:** Unclamped player ripostes, `[FF: ON]` splash, or `Dark Shadow` attacks will accidentally kill `Talk` targets; clamp all three to `>= 1 HP` and zero AI utility at `1 HP`.
- **Adding classic `Rule of 4` or `Weapon Triangle` onto `AP + Swift/Peerless`:** Auto-doubling on `AS >= 4` double-counts `AP` tempo, and `+/-15%` weapon-triangle accuracy cancels out `Swift (+20% Hit)` vs. `Peerless (-15..20% Hit)` counter-cycles.
