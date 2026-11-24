---
name: srpg-concept-previs
version: "0.1.0"
released: "2026-11-24"
description: >
  Stage 1 technical concept and 3D-ready pre-visualization blueprinting for Project 1001 SRPG
  across 4 asset lanes: Multi-Angle + 3-Layer VRoid humanoids, orthographic weapon/relic sheets
  with locked Grip Pivot (0,0,0), 2.0m x 2.0m tactical grid blockouts, and 3-phase VFX/special
  choreography storyboards. Not for 3D Blender mesh remodeling or retopology (use
  blender-3d-modeler) or runtime C# coding (use unity-urp-srpg).
---

# SRPG Stage-1 Concept & 3D-Ready Pre-Visualization (`Project 1001`)

> **Experimental Lab Status (`v0.1.0 Pre-Pilot Baseline`):** Isolated inside [`../README.md`](../README.md) (`skills-lab/project-1001/`, `pre-pilot-staging`) and **never loaded by default**. Route here only for Stage 1 blueprinting (`designer`, `art-audio`, `level`), and calibrate prompt templates, VRoid slider presets, and socket tolerances during the live **`#13 Richard` Hero Pilot** before promoting to `.agent/skills/`.

Lock deterministic proportions, flat `Gothic MToon 60-30-10` value blocks, real-meter grid geometry, and `60 FPS` action choreography *before* Stage 2 Blender modeling begins.

## Hard Tool Routing Matrix (Zero VRoid Misuse)

**`VRoid Studio` ONLY builds humanoid avatars, heads, procedural hair, and `VRM 1.0` expressions** — it has **`0%` capability** for weapons, non-humanoid monsters, environment stages/tiles, or skill VFX meshes. Route every asset strictly by lane:

| Lane | Asset Scope | Stage 1 Pre-Vis Output | VRoid Usage | Stage 2 Target (`blender-3d-modeler`) |
|---|---|---|---|---|
| **1. Characters** | Playables, Humanoid Bosses/Troops | `Nano Banana` (`1 -> 10..20` views) + `VRoid 2.14.0` `.vrm` | **YES** *(Humanoid Head/Hair/Body/Expressions ONLY)* | `.vrm` Head + `14` Shared Class Armors (`1 SMR + 1 Atlas 2K`, `Face_Protected` normals) |
| **2. Weapons & Relics** | `22 Subtypes` (`Grade I–V`), Shields | Orthographic `Front / Side / Top` sheet (`#E8ECEF` + RGBA) | **NO (`0%` — Bypass VRoid)** | `TRELLIS 2` / hard-surface `bpy` (`Planar Decimate`, `Grip Pivot 0,0,0` -> `J_Bip_R_Hand`) |
| **3. Environments** | `7 Nations` Biomes & `2.0m` Grid Kits | `38°` Isometric Moodboard + `2.0m × 2.0m` Blockout Sheet | **NO (`0%` — Bypass VRoid)** | Modular Blender `2.0m` Kit + `Poly Haven CC0` (`1k–2k`) |
| **4. Skill VFX & Arts** | Class Arts, `6` Bloodlines, `30` Ultimates | `3-Phase` Frame/ms Storyboard + Carrier Mesh Callouts | **NO (`0%` — Bypass VRoid)** | `3D VFX Carrier Meshes` + `Master Rig Clip Slicing` (`9–12 Master Rigs`) |

*(Non-humanoid beasts/constructs/seraphim bypass VRoid via `Nano Banana` multi-view sheets -> Stage 2 `Hunyuan3D 2.1` + `QuadriFlow Remesh` onto Master Rigs `RIG-02..11`.)*

## 4-Lane Deterministic Blueprint Contract

### Lane 1 — Characters (`Nano Banana 1 -> 10..20 Angles` + `VRoid VRM 1.0`)

1. **Two-Stage Multi-Angle Identity Lock (`Nano Banana`):**
   - **Face First (`1 -> 10..20`):** Lock `1` straight-on `0°` front face (eye shape, iris specular, hair parting, scars), then generate `10–20` directional head views (`0°–360°` yaw + `38°` tactical pitch).
   - **Body Second (`1 -> 10..20`):** Conditioned on the locked face, lock `1` `0°` full-body anchor at exact `FrameCon` scale, then generate `10–20` turnaround views stripped to clean **RGBA alpha**.
2. **`3-Layer Anatomy Split` (Modular Reuse Invariant):**
   - **Layer A (`VRoid Head, Procedural Hair Strips & Skin`):** Draw hair decomposed into clear `Procedural Hair Strips` (**geometry before textures**). Export flat unshaded `PNG` iris, scar, and rune layers for `.vroidcustomitem` (`ZIP` = `JSON + PNG`), tune sliders (`VRoid 2.14.0` / optional `vroid-studio-mcp` `214` face + `23` body sliders), and export `VRM 1.0` `.vrm`.
   - **Layer B (`3 Static FrameCon Body Proportions` × `14` Shared Class Bodies):** Map body silhouettes `1:1` to static **`FrameCon = BaseCon + ClassCon`** (keep `EffCon = FrameCon + floor(BaseSTR/8)` in `Cold Header` for weapon weight without multiplying 3D rigs):
     - **`Slender` (`FrameCon 4–6`, `[1:7]`):** `1.62m–1.70m` non-chibi (assassins, mages, scholars, clerics).
     - **`Athletic` (`FrameCon 7–9`, `[1:7.5]`):** `1.75m–1.83m` (swordsmen, lancers, marksmen, `#13 Richard`).
     - **`Heavy` (`FrameCon 10–14`, `[1:8]`):** `1.88m–2.02m` broad-shouldered vanguards and armor-breakers.
   - **Layer C (`Detached Snap-On Hero Props` for `Bone Sockets`):** Isolate asymmetric hero/boss props (`#13 Richard` eyepatch, `#03 Mira` chest reactor, `#07 Kaelen` wolf pauldron) onto standalone orthographic sheets bound to `Head / Spine2 / UpperArm / Hand` **`Bone Sockets`**.
3. **Flat `Gothic MToon 60-30-10` Palette (`Zero Eastern Fantasies`):**
   - Pin **`60%` dark iron / stone / cloth base** (`2-Step Crisp MToon`, `Shade Toony = 0.88`, `1` key light at `48°`) : **`30%` nation heraldry** : **`10%` `Aether` HDR glow**.
4. **`6 VRM Expressions` (`VRM 1.0` BlendShapes for 3D Cut-ins, Dialogue & `AP Bar` Portraits):**
   - Author **`Neutral, CutInAngry, Wounded, FumingFF, RelaxSmile, Surprised`** (mapped 1:1 to runtime IDs `neutral, determined_cutin, wounded_convalescent, fuming_ff_hit, camp_relax_warm, psych_shift_bark`).

### Lane 2 — Weapons & Relics (`22 Subtypes`, `Grade I–V`, Bypass VRoid)

- **Orthographic Sheet & Alpha:** Deliver aligned **`Front / Side / Top`** views on flat neutral **`#E8ECEF`** plus clean **RGBA alpha** cutouts (`BC7` multiples of `4`).
- **Locked `Grip Pivot (0, 0, 0)` & Real-Meter Scale:** Stamp a red `#FF0000` crosshair locking **`Grip Pivot (0, 0, 0)`** at the right-hand grip center (`+Z` tip forward, `+Y` blade edge up) alongside a real-meter bar calibrated to **`1 Tile = 2.0m`** (`0.45m` `Stiletto` to `2.35m` `Heavy Lance / Halberd`).
- **`Swift` vs. `Peerless` Silhouette Polarity (Readable at `38°` Pitch):**
  - **`Swift`** (`Rapier, Sabre, Twin Blades, Stiletto, Wire Dagger, Repeater Crossbow, Light Spear, Short-Staff`): **slender, hilt-weighted** profile with narrow fullers and crisp silver/azure edge highlights.
  - **`Peerless`** (`Greatsword, War Axe, Warhammer, Halberd, Heavy Lance, Greatbow, Aether Rifle, Greatstaff`): **thick, tip-heavy armor-breaker** mass (`2.2x–3.0x` wider blade/head) with `Grade IV–V` `Aether` channels.

### Lane 3 — Environments & Grid Tiles (`7 Nations`, Bypass VRoid)

- **Moodboard + `2.0m × 2.0m` Modular Blockout Sheet:** Pair a **`38°` isometric** biome moodboard (`FOV = 24°` low-FOV/ortho hybrid, `4` `90°` yaw snaps, nation `60-30-10` palette) with measured blockouts for all `8` modular kit pieces (`Floor_Fill`, `Floor_Edge`, `Floor_Corner`, `Ramp_Step`, `Half_Cover_Wall`, `Full_Cover_Pillar`, `Choke_Gate_Arch`, `Reinforcement_Hatch`).
- **Tactical Grid Geometry Rules:**
  - **Walkable Core & Steps:** **`>= 1.4m × 1.4m` flat center** (`Y = 0.00m ± 0.02m`) for clean foot IK/decals, with **`ΔY = 1.0m` height steps** (`0.5m` ramp sub-steps).
  - **Flow & `[FF: ON]` Safety:** **`2–3 Tile` (`4.0m–6.0m`) Choke Gates + `4×4` Pocket Bays** preventing 16-unit congestion and friendly-fire pileups.
  - **Cover & LoS Tiers:** **`1.0m Half Cover`** (`0.35m` rim wall preserving `38°` unit readability) vs. **`2.8m Full LoS Pillar`** (`SLOT_POOL` sniper perches) + `1-Cycle` pre-warned `Reinforcement_Hatch` spawn rings.

### Lane 4 — Skill VFX & Special Choreography (`3-Phase Storyboard`, Bypass VRoid)

1. **`60 FPS` Frame/ms Budgets & `Master Rig Clip Slicing`:**
   - Specify **`Wind-up / Telegraph` -> `Active / Contact` (`contact_frame_ms`) -> `Recovery`**: `Swift <= 0.60s` (`40 ms` hit-stop), `Peerless <= 1.00s` (`80 ms` hit-stop), `Apex / Heavy <= 1.50s` with hard ceiling **`Hit-Stop <= 120 ms`** (unscaled real time) and **`<= 3 flashes/s`** (WCAG).
   - Storyboard one `84–90 frame` `Tier 3` clip and mark **`Master Rig Clip Slicing`** cuts for `Tier 2` (`~0.80s`) and `Tier 1` (`~0.50s`).
2. **Ground Telegraph Hierarchy & `3D VFX Carrier Mesh` Callouts:**
   - **Priority (High -> Low):** **`Gold Sanctuary`** (`#F59E0B` / `#FDE68A`, `100%` `[FF: ON]` immunity) > **`Crimson [FF: ON]`** (`#DC2626 -> #F97316` `1.5 Hz` double-pulse hazard, `60%` ally DMG + `1-Turn Pre-Charge` lock) > **`Amber / Azure` `1-Cycle` Spawn Ring** > **`Azure [FF: OFF]`** (`#2563EB` / `#38BDF8` safe target/move decal).
   - Call out Stage 2 **`3D VFX Carrier Meshes`** (`VFX_SlashArc_Thin_120deg`, `VFX_HeavyCleave_1x3`, `VFX_ShockwaveRing_R2`, `VFX_CrackedRubble_Decal`, `VFX_Afterimage_GhostRibbon`, `VFX_Sanctuary_HexDome_R4`).
3. **Special Bloodline vs. Normal Class Art Differentiation:**
   - **Normal Class Art** (e.g., normal `Cross Blade`): **lit arena** (`0%` vignette dim) + grounded **physical 2-sword swing** with clean steel/spark arcs.
   - **Special Bloodline Chain** (e.g., `Reinhart` `#13 Richard` chain `Double Slash -> Triple Edge -> Astra`): **`25% Vignette Dim`** + **vanish-step** + **`2 / 3 / 5` jagged Z-shaped spatial rift cuts** at the target + **`1 / 2 / 4` translucent ghost clones + `1` true body** bursting radially into **`2 / 3 / 5` directions** holding **distinct sword stances** before the clones dissolve!

## Stage 1 -> Stage 2 Hand-off Gate

- Package RGBA `PNG` sheets (multiples of `4`), `VRM 1.0` `.vrm` head/hair files, and SHA-256 provenance entries (`Nano Banana` / `Original VRoid` / `CC0`) for `data/assets/asset-manifest.json` before invoking `blender-3d-modeler`.

## Gotchas

- **Oil-painting gradients breaking `MToon`.** Soft multi-tone airbrushing collapses into muddy banding under `2-Step Crisp MToon` (`Shade Toony = 0.88`); enforce flat cel-shaded `Gothic MToon 60-30-10` value blocks.
- **Baked UI text or fake checkerboards.** Never rasterize labels, damage numbers, or grey-white alpha checkerboards into PNGs; strip to real RGBA alpha and keep all UI text in runtime `TextMeshPro SDF`.
- **Drawing asymmetric capes or hero props fused into shared armor bodies.** Baking signature capes, eyepatches, or chest reactors onto Layer B armor breaks reuse across the `14` shared class bodies (`1 SMR + 1 Atlas` cap); detach them into Layer C `Snap-On Hero Props` on `Bone Sockets` (`VRMSpringBone` is also culled `100%` at `38°` tactical view).
- **Asking `VRoid Studio` to generate weapons, monsters, stages, or VFX.** `VRoid` is strictly a humanoid avatar/hair/expression builder (`0%` non-humanoid mesh support); bypass VRoid on Lanes 2–4 and output orthographic/blockout sheets for Stage 2.
