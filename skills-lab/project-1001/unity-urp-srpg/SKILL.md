---
name: unity-urp-srpg
version: "0.1.0"
released: "2026-11-24"
description: >
  Integrates Unity 6 URP tactical presentation for Project 1001: enforces Covenant.Core
  (noEngineReferences) vs. Covenant.UnityView assembly isolation, Single-Writer Scene Lock,
  60 FPS (16.67 ms) 48-unit UniVRM SRP Batcher rendering, 0-GC stackalloc AP Action Order Bar,
  and unscaled Hard Mode Shot-Clock (30-60s). Use when building Unity 6 scenes, presenters,
  shaders, audio buses, or timeline UI. Not for Blender mesh retopology (use blender-3d-modeler)
  or tuning combat balance tables (use srpg-ap-utility-ai).
---

# Unity 6 URP Tactical SRPG Integration (`Project 1001`)

> **v0.1.0 Pre-Pilot Baseline:** Isolated inside `skills-lab/project-1001/unity-urp-srpg/` outside `.agent/skills/` auto-discovery. Load only via explicit `SKILLS TO READ:` pointers; promote to `Projects/<slug>/.agent/skills/unity-urp-srpg/` only after completing the live 4-lane pilot (`PILOT_FRICTION_LOG.md`) and explicit Director sign-off.

## 1. Strict Assembly Split, `820-Byte` Snapshot & Scene Lock

- **Unity 6 (`6000.0 LTS` URP) Roots:** Compile strictly under `Assets/` and `Packages/` (never create a root `src/` folder). Keep tunables in `Assets/_Game/Data/Tables/` (JSON SSOT) and asset mappings in `Assets/_Game/Data/Catalogs/`.
- **`Assets/_Game/Scripts/Core/Covenant.Core.asmdef` (Pure C# Simulation):**
  - Pin `"noEngineReferences": true` and `"allowUnsafeCode": true` (**zero `UnityEngine` imports**). Hosts `EncounterComposer`, `DeploymentResolver`, `TimelineKernel`, `CombatResolver`, `SymmetricUtilityAiPipeline`, and `SaveMigrator` testable in EditMode NUnit (`< 2s`).
  - **3-Tier Memory (`<= 1,000` Stat Ceiling):**
    1. `SaveGame.WorldState`: Persistent campaign SSOT (`HiddenAffinity[435]`, `EscrowPool`) written via atomic 4-step swap **`slot_XX.save.tmp` (with `schema_version` + `checksum_xxh64` + `Flush(flushToDisk: true)`) -> `slot_XX.save.bak` -> `slot_XX.save.json`** and pure `MigrateV1ToV2` steps.
    2. `ImmutableBattleHeader`: Read-only cold battle context (`0` snapshot bits) storing `FrameCon (4..14)`, `EffCon = FrameCon + floor(BaseSTR / 8)`, `BaseWeightsQ8[10]`, and `[STORY_SPARE_FLOOR: 1 HP]`.
    3. **`820-Byte` Full Battle Snapshot (`Pack = 1`, natural alignment):** `48 × 14B UnitHotState` (`672B`: `BiasedAP = Clamp(RawAP, -50, +205) + 50`, `2-bit RetaliationTokens [0..3]` locked to `0%` when `BiasedAP < 50`, `LockedGrayHP`) + **`148B BattlefieldGlobalHeader`** (`RngState`, `CurrentTurnIndex`, `TurnAccumulatorTicks`, weather timers, reinforcement masks, `DynamicGridMutations[32]`). Keeps a `32`-step `Turn-Rewind` ring buffer at `25.6 KB` inside L1 cache.
- **`Assets/_Game/Scripts/UnityView/Covenant.UnityView.asmdef` (Presentation Shell):**
  - Integrates `Unity 6 URP`, `UniVRM v0.128.0+`, `Cinemachine`, `InputSystem`, and `TextMeshPro SDF` (zero baked UI text).
  - **Unidirectional Flow:** Emits immutable `BattleCommandIntent` (guarded by `ExpectedTurnSequenceId: uint`) into `Core`; observes `ReadOnlySpan<BattleDomainEvent>` and read-only snapshots. View feedback never mutates simulation state.
- **Single-Writer Scene Lock & Git LFS:**
  - Enforce **Single-Writer Scene Lock** on `.unity`, `.prefab`, and `.asset` files (`Force Text` + `Visible Meta Files`). Keep only 3 thin bootstrapper scenes (`Boot.unity`, `CampPrep.unity`, `BattlefieldHost.unity`) composed dynamically over `1 Tile = 2.0m × 2.0m` modular kits.
  - Require `.gitattributes` **Git LFS** tracking on `*.vrm, *.vroid, *.vroidcustomitem, *.fbx, *.blend` (plus `*.glb, *.png, *.psd, *.tga, *.exr, *.hdr, *.wav, *.ogg`) and pass `qa_unity_export.py` sidecar (`MODEL.glb.json` w/ `fix.run`) + `asset-manifest.json` checks before import.

## 2. `60 FPS (16.67 ms)` Budget for `48 Active Units` & Special VFX

| Runtime Subsystem (`16 Player + 32 Enemy/Ally = 48 Units`) | Frame Ceiling | Mandatory Engineering Guardrail |
|---|---:|---|
| **`Covenant.Core` + `Utility AI`** | `<= 0.50 ms` (`<= 0.85 ms` AI turn) | Flat `14B` structs, `stackalloc` previews, `0 B GC`, zero `LINQ`/boxing/`O(N^2)` frame scans. |
| **`URP Render & SRP Batcher`** | `<= 6.50 ms` (`< 150` SetPass) | **`1 SMR + 1 Texture Atlas`** (`2K` BC7 Hero/Boss, `1K` Creep) + `1` shared-variant `MToon` material under `1` `48°` Directional Key Light (`Face_Protected` sphere normals; weapon on `J_Bip_R_Hand` at `Grip Pivot 0,0,0`). |
| **`Animator` (`11 Master Rigs`) & `SpringBone`** | `<= 2.50 ms` | **Disable `100%` of `VRMSpringBone` at wide `38°` (`FOV 24°`) tactical zoom**; enable **only on `1–2` pawns** during close zoom / `Cut-in <= 1.5s` (`FOV 32°`) or `Camp Inspect`. |
| **UI, 5-Layer Stencil Decals & Pooled VFX** | `<= 3.00 ms` | Event-driven UI; pooled combat text, decals (`Gold Sanctuary` > `Crimson [FF: ON]` > `Amber/Azure Spawn` > `Azure Safe`), and `Reinhart` `Astra` VFX. |
| **`4-Bus CC0 Audio` & OS Headroom** | `>= 3.32 ms` | Voice stealing (`<= 3` hits / `60 ms`), `3–4` round-robin clips (`±6%..±9%` pitch), sidechain ducking. |

- **Pooled `Reinhart` `Astra` VFX & Non-Simulation Juice:**
  - Pre-warm **`4` Ghost-Silver Fresnel afterimage clones** + **`Z-Rift Spatial Cut` shader planes** and 3D carrier meshes (`VFX_Afterimage_GhostRibbon`), syncing damage numbers/SFX strictly to `contact_frame_ms` in `departments/registry.yaml`.
  - **`HitStopController` (`<= 120 ms` Hard Cap):** Tiered `35–40 ms` (`Swift`), `70–80 ms` (`Peerless`), `100–120 ms` (`Crit / Poise Break / Apex`). Drive via **`Time.unscaledDeltaTime`** using `max(remainingUnscaledMs, newHitStopMs)` and force `Time.timeScale = 1.0f` in `OnDisable / finally`.
  - **Child Camera Shake & WCAG Flash Cap:** Apply `MaxOffset * trauma^2 * Perlin(unscaledTime)` only to a **child `CameraVisualShakeOffset` transform** so parent grid raycasts never drift; cap impact flashes to `<= 3 flashes/s` (`<= 35%` warm ivory alpha).
  - **`4-Bus CC0 Audio` (`Master 0 dB [-1.0 dBTP limiter] <- Music -8 dB, SFX -4 dB, Ambience -14 dB, UI -6 dB Unscaled`):** Stream `.ogg` (`-16 LUFS`) for `Music/Ambience`, preload ADPCM `.wav` (`-14 LUFS`, `< 2 ms` trim) for `SFX/UI`, duck `Music/Ambience` on `Apex / Boss Bark / Mirelle Bell`, and apply a `650 Hz` low-pass filter inside `Zero-Hymn Sanctuary`.

## 3. Interactive `0-GC` `AP Action Order Bar` & `Hard Mode Shot-Clock (30–60s)`

- **`0-GC` Stack Timeline Projection (`< 0.05 ms`, `0 B GC`):**
  - On tile hover (`+4 AP/tile`), `5-slot` satchel weapon swap (`0 AP` start-of-turn `Swift` vs. `Peerless`), or `+/-AP` skill aim, copy `BattlefieldGlobalHeader` (`148B`) + `Span<UnitHotState> simUnits = stackalloc UnitHotState[48]` (`672B`) into `TimelineKernel.ProjectUpcomingNodes` to render `16–24` slots and `55%`-alpha ghost shift previews (`data/ui/ap_timeline_theme.json`):
  - **Portrait Card States:** `Neutral` (`#1E242B` Dark Slate Iron + `2.5px` faction border: `Player #2563EB`, `Teal #0D9488`, `Enemy #92400E`); **`Buff`** (**`#D6ECFA` Soft Sky-Blue** / `rgba(135,206,250,0.28)` + **`▲`**, never neon, keeping faction border); **`Debuff`** (**`#FADBD8` Crimson Red** / `rgba(220,53,69,0.30)` + **`▼`**, **`#64748B` Steel-Gray** micro-HP bar segment when `LockedGrayHP > 0`, and `#94A3B8` silver lock trim in negative `RawAP [-50..-1]`).
  - **`1.4x` Tall `[TURN X]` Divider Pillars (`100 Base Ticks`):** Brass vertical pillar (`1.4x` card height) emitted every `TurnAccumulatorTicks == 100` (`TURN XX -> TURN XX+1`), carrying the soft-timer **Objective Countdown Pill** and **docked Weather/Phenomenon Badges** (`Storm`, `Blizzard`, `Ashlung Fog`, `Mortar`, plus independent `60-Tick` `Mirelle Bell` nodes in `Ch.24`).
  - **End-of-Turn Reinforcement Slide-In:** When `[TURN X]` reaches `0` (after `1 Cycle` `Amber/Azure Spawn Ring` warning), reinforcement cards slide top-down (`280 ms EaseOutCubic`) into deterministic arrival slots (**Enemy `Clamp(25 + floor(EffSPD / 4), 25, 30)`** [`BiasedAP 75..80`], **Ally `Clamp(30 + floor(EffSPD / 6), 30, 35)`** [`BiasedAP 80..85`], `0` PRNG rolls).
  - **`Click-to-Inspect` Popovers (`360×240px`):** Clicking any unit card or `[TURN X]` pillar (or pressing `I`) shows `HP (+GrayHP)`, `SP`, `RawAP`, `RetaliationTokens [0..3]`, `EffCon vs. WeaponWeight`, active `Tier 1 / Tier 2 Overlimit` modifiers, `> 35%` `Utility AI` psychology tags + `Battle Bark`, or upcoming weather/reinforcement waves.
- **`HardModeTurnClockPresenter` (`30–60s` Non-Simulation Controller):**
  - **Gating:** **`∞` (disabled/hidden)** on `Normal` & `Story` modes and across **all `Camp & Battle Prep`** screens.
  - **Active `Hard Mode` Clock (`Time.unscaledDeltaTime`):** Default **`45.0s`** (`30.0s` Blitz; auto-elevated to **`60.0s`** on **`Fog` maps, `CLP >= 8`, or `Turn 1`**), refilled only when a `PlayerManual` unit starts a turn (`BiasedAP >= 150`; `Undo Move` never refills time). Renders a silent brass arc (`45s -> 11s`) and a `1.0 Hz` amber pulse (`#F59E0B`) + muffled heartbeat/pocket-watch tick on `UI Bus` (`<= 10s`, zero screen flash).
  - **Anti-Pause-Cheating:** Ticks continuously in `AwaitingPlayerDecision`; **PAUSED** during `CommittedMove / FogReveal (0.8s Sight-Settle Grace)`, `ActionAnimation`, and `Cutscene`; **NEVER paused** on `InspectPopover`, `TileHover`, `GhostPath`, or `SatchelSwitch`; pressing `ESC` (`System Pause`) applies a **full tactical blindfold** hiding the map, `AP Bar`, and stats.
  - **Timeout (`0.0s`) Rollback & Dispatch:** Close open popovers/reticles, rollback uncommitted ghost paths to **`TurnStartOrLockedCheckpoint`** (preserving any move that revealed `Fog` or triggered traps), and dispatch `AutoWaitOnTimeout(slot, turnSequenceId)`: **`AutoWait` (`-25 AP -> 75 RawAP`, sets `WaitingExposure = 1`)** on first timeout, or **`BastionDefend` (`-45 AP -> 55 RawAP`, resets `WaitingExposure = 0`)** on consecutive timeout (`WaitingExposure == 1`).

## Gotchas

- **Mutating `Time.timeScale` without an unscaled restore timer:** Stacking hit-stops additively or counting down with `Time.deltaTime` freezes combat during multi-hit chains (`5x Astra` / `Union Attack`). Always track hit-stop with `Time.unscaledDeltaTime` (`max` rule) and restore `Time.timeScale = 1.0f` in `OnDisable / finally`.
- **Leaving `VRMSpringBone` active on `48` units:** Running spring physics across `48` pawns wastes `4–5 ms` CPU at `38°` tactical pitch. Keep `100%` of `SpringBone` components disabled except on `1–2` zoomed/Cut-in subjects, and reject multi-SMR/multi-material VRM imports that break `SRP Batcher`.
- **Pausing the `Hard` clock during `Inspect` or rolling back past revealed `Fog` tiles:** Halting the shot-clock on `InspectPopover` or leaving the board visible on `ESC` enables infinite planning, while rewinding past `Fog` reveals or traps leaks hidden state. Always keep `Inspect` ticking and clamp rollbacks to `TurnStartOrLockedCheckpoint`.
- **Heap-allocating `List<>` on every hover preview:** Allocating managed lists, `LINQ` iterators, or closures during cursor path sweeps causes GC stutters. Project `AP Action Bar` nodes strictly into preallocated `Span<T>` buffers over `stackalloc UnitHotState[48]` (`0 B GC`).
