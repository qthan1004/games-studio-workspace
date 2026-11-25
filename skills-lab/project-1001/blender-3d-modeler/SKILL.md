---
name: blender-3d-modeler
version: "0.1.0"
released: "2026-11-24"
description: >
  Executes Stage-2 Blender 3D modeling, VRM 1.0 head-to-armor welding, QuadriFlow beast
  retopology, modular 2.0m grid kits, and headless mesh QA for 48-unit 60 FPS tactical battles.
  Not for 2D concept generation (use srpg-concept-previs) or Unity C# gameplay logic (use unity-urp-srpg).
---

# Stage-2 Blender 3D Modeler & Tech-Art Pipeline

> **Status (`v0.1.0 Pre-Pilot Baseline`):** Experimental skill staged in [../README.md](../README.md) (`pre-pilot-staging`). Never load by default; promote to `.agent/skills/` only after validating live Windows 11 4-Lane Pilot friction logs.

Convert deterministic Stage-1 Blueprints (`srpg-concept-previs`) into `URP SRP Batcher`-ready `.vrm` / `.fbx` / `.glb` assets sustaining **48 active units at 60 FPS** within the **11 Master Rigs** (`9–12` ceiling).

## Verified Tool Stack

- **Blender `4.2 LTS+` + `ahujasid/mcp-for-blender v2.3.1`:** Launch via `uvx mcp-for-blender` over TCP `localhost:9876` with `DISABLE_TELEMETRY=true`, `PYTHONIOENCODING=utf-8`, and `PYTHONUTF8=1` (prevents Windows `cp1252` stream crashes). Uses the **10 consolidated MCP tools** — prioritize `get_scene_info` (token-light field queries), `execute_blender_code`, `look(mode="angles")` (**hard cap `<= 2–3` calls per asset**, only after JSON checks pass), `generate_3d`, and `search_assets` / `import_asset` restricted to **`Poly Haven 1k–2k CC0`** PBR/HDRI (never `8k`).
- **`saturday06/VRM-Addon-for-Blender v4.10.5` (`io_scene_vrm` / PyPI `bpy-vrm-format`):** Automates headless `VRM 1.0` import/export, `MToon 1.0` shade/rim bindings, `SpringBone` chains, and the 6 standard `VRM Expressions` (`neutral`, `determined_cutin`, `wounded_convalescent`, `fuming_ff_hit`, `camp_relax_warm`, `psych_shift_bark`).
- **Local AI 3D Mesh Generators (`ComfyUI` / `Pinokio`):** **`TRELLIS 2`** (MIT) for crisp hard-surface weapons, shields, and armor; **`Hunyuan3D 2.1`** (`ap-singapore` endpoint for international accounts) for organic monster/mount volumes.

## Single-Live-Agent + Headless Workshop Rule

1. **At Most `1` Live MCP Agent:** Connect **at most `1` live agent** to `mcp-for-blender` (`TCP 9876`) at any moment for assembly, socket alignment, and final `look(mode="angles")` sign-off. Concurrent live agents collide at world origin `(0, 0, 0)` and corrupt active modes.
2. **Headless CLI for Batch Work:** Run all repeatable operations (retopology, normal transfer, UV/atlas baking, decimation, and export QA) via isolated CLI invocations:
   ```bash
   blender --background <file.blend> --python scripts/qa_unity_export.py -- --budget-tris 15000 --max-materials 1 --json
   ```
3. **Naming & Provenance:** Enforce prefixes `ARM_` (Armature), `SM_` (Mesh), `COL_` (Collider), `MAT_` (Material), `VFX_` (Carrier Mesh), and log license (`CC0`, `CC-BY`, `Original VRoid`) + AI generator provenance in `data/assets/asset-manifest.json`.

## 4 Modeling Pipelines & `11 Master Rigs` (`60 FPS / 48 Units`)

Bind all `112+` campaign units exclusively to the **11 Master Rigs** — never author one-off custom skeletons per monster:
- `RIG-01 ARM_VRM_Humanoid_Std` | `RIG-02 ARM_Cavalry_QuadMount` | `RIG-03 ARM_Aerial_WingedMount` | `RIG-04 ARM_Magitech_Construct` | `RIG-05 ARM_Seraph_MultiWing_2x2` | `RIG-06 ARM_Beast_Lupine_Quad` | `RIG-07 ARM_Arachnid_Carapace` | `RIG-08 ARM_Reptile_Drake` | `RIG-09 ARM_Stationary_Tendril_Node` | `RIG-10 ARM_Colossal_Brute_Biped` | `RIG-11 ARM_Elder_Dragon_Wyrm`.

### 1. Humanoid Characters (`RIG-01 VRM`)
- Weld the Stage-1 `.vrm` head/hair onto **`12–15 Shared Class Armor Bodies`** scaled to the 3 static `FrameCon` silhouettes (`Slender 4–6`, `Athletic 7–9`, `Heavy Vanguard 10–14`).
- Isolate the **`Face_Protected`** vertex group (`Head`, `EyeSocket`, `Chin`, `Brow`) and transfer sphere-projected custom loop normals (`Data Transfer Modifier` + custom split normals) before joining meshes so `48°` directional `MToon` lighting never creases the nose or cheeks.
- Bake textures (`Gothic MToon 60-30-10`) and merge deformable geometry into **`1 SkinnedMeshRenderer + 1 Texture Atlas`** (`2048x2048` Hero/Boss **`<= 15k tris`**, `1024x1024` Creep **`<= 7k tris`**, dimensions divisible by `4` for `BC7`).

### 2. Weapons & Snap-On Props (Bypass VRoid)
- Reconstruct from Stage-1 orthographic `Front/Side/Top` sheets via `TRELLIS 2 / Hunyuan3D`, preserving `Swift` (slender) vs. `Peerless` (heavy `2.2x–3.0x` head) tactical silhouettes at `38°` pitch.
- Refine hard edges with **`Planar Decimate (5°–8°)` + `Bevel` + `Weighted Normals`**, orient blade tip `+Z` / cutting edge `+Y`, and snap **`Grip Pivot` to `(0, 0, 0)`** for zero-offset `J_Bip_R_Hand` binding (**`<= 1.5k tris`** weapons; **`<= 800 tris`** bone-socket hero props).

### 3. Organic Beasts & Mounts (`RIG-02..RIG-11`)
- **Never** sculpt organic creatures or anime bodies from raw primitives in `bpy`.
- Run **`QuadriFlow Remesh`** on `Hunyuan3D 2.1` meshes to establish clean quad deformation loops (never `Planar Decimate` on organic skin), then bind via **`Voxel Heat`** / automatic weights onto verified open `CC0/CC-BY` beast armatures (`RIG-02..RIG-11`; Creep **`<= 7k tris`**, Colossal `2x2/3x3` Boss **`<= 18k–22k tris`**).

### 4. Modular Grid Tiles (`2.0m × 2.0m`) & `3D VFX Carrier Meshes`
- **Grid Tiles (`<= 800 tris`):** Build `2.0m × 2.0m` biome modules (`>= 1.4m × 1.4m` flat walkable center at `Y = 0.00m ± 0.02m`, `Half Cover = 1.0m`, `Full Cover = 2.8m`, and **`2–3 Tile Choke Gates` (`4.0m–6.0m`)** with `4×4` buffer bays for `[FF: ON]` positioning) textured with shared `Poly Haven 1k–2k CC0` atlases.
- **`3D VFX Carrier Meshes` (`<= 300 tris`):** Author clean UV-scrolled `Z-Rift Spatial Cut Planes`, `Slash Ribbons`, `Shockwave Rings`, and `Cracked Rubble` paired with `Master Rig Clip Slicing` (`Tier 3 -> Tier 2 -> Tier 1` frame ranges at `60 FPS`).

## Deterministic Export Gate

Run [scripts/qa_unity_export.py](scripts/qa_unity_export.py) before handing any `.vrm`, `.fbx`, or `.glb` to Unity. Every mesh in `bpy.data.objects` must pass `total_tris <= budget`, `material_count <= max_materials`, `scale == (1.0, 1.0, 1.0)`, `rotation == (0, 0, 0)`, and `non_manifold_edges == 0` (use `--allow-boundaries` only for open `VFX_` ribbons/hair strips); failures emit deterministic `fix.run` / `fix_commands` JSON.

## Gotchas

- **Calling `sys.exit()` crashes Blender:** Raising uncaught `SystemExit` inside `execute_blender_code` or imported Python modules immediately kills the live Blender process. Return structured dicts instead.
- **Missing `bpy.context.temp_override` on Timer threads:** `mcp-for-blender` dispatches socket commands inside `bpy.app.timers` without an active `VIEW_3D` context; mutate `bpy.data` / `bmesh` directly or wrap `bpy.ops` in `with bpy.context.temp_override(window=..., area=...):`.
- **Leaving `EDIT` or `POSE` mode open without `try/finally`:** Always wrap mode changes in `try ... finally: bpy.ops.object.mode_set(mode='OBJECT')` so subsequent `bmesh`, modifier, and export calls do not fail context polls.
- **Blender 4.x shader & smoothing renames:** `Principled BSDF` sockets moved to `'Emission Color'` and `'Specular IOR Level'`, and legacy `mesh.use_auto_smooth` was replaced by the `Smooth by Angle` modifier.
- **Raw `.vrm` exports (`6–12` materials) blowing Draw Calls:** Unmerged VRoid exports split face, iris, lash, hair, and outfit slots (`> 500` Draw Calls across `48` units), breaking `URP SRP Batcher` unless merged into `1 SkinnedMeshRenderer + 1 Texture Atlas`.
