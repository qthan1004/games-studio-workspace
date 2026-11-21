---
name: character-gen
version: "1.0.0"
released: "2026-11-21"
description: >
  Engine-agnostic character and visual asset production pipeline using either verified open
  web rigs/models with retargeted animations or Nano Banana multi-angle generation (1 front
  face -> 10-20 angles, then 1 front body -> 10-20 angles). Not for core physics code (use engineer).
---

# Multi-Angle Character Generation & Web Asset Retargeting

Produce authentic, consistent game characters (never crude primitive stick/cylinder approximations when real anime/stylized art is expected) that plug cleanly into **Web (`Three.js`/`PixiJS`), Godot, Unity, or Unreal**.

## Choose the Right Production Track

1. **Track A — Sourced Open-License Rig/Model + Engine Animation:**
   - Fetch verified open-license (`CC0`, `CC-BY`, `MIT`) character assets from trusted repositories (e.g., VRoid/VRM `.vrm` anime humanoids, `.glb` skeletal characters, or open Spine/2D rigs).
   - Record source URL, license, author attribution, and target scale in `<asset_root>/asset-manifest.json`.
   - Drive or retarget full skeletal/procedural animation states (`idle`, `walk`, `run`, `interact/work`, `sit/chill`) cleanly onto the imported bone hierarchy (`VRMHumanBoneName`, glTF joints, or engine `Humanoid` avatar).
2. **Track B — Nano Banana (`image-generator`) 2-Stage Multi-Angle Pipeline ([`../../../workflows/multi-view-character.md`](../../../workflows/multi-view-character.md)):**
   - Use whenever generating custom characters, directional 2.5D sprites, or 3D modeling/texture reference sheets so identity **never drifts across camera angles or frames**:
     - **Rule 1 — Face First (`1 Front -> 10..20 Angles`):** Generate **1 straight-on front face (`0°`)** hero anchor locking eye shape, iris highlights, hair locks, line weight, and shading. Once locked, generate **`10–20` directional head/face views** from all yaw/pitch angles (`0°` through `360°` + isometric/elevated pitch) conditioned on that exact front face.
     - **Rule 2 — Body Second (`1 Front -> 10..20 Angles`):** Conditioned on the locked Face Anchor, generate **1 straight-on front full-body (`0°`)** anchor locking exact proportions (e.g., `1:7` non-chibi anime), attire, and footwear. Then generate **`10–20` directional full-body views** matching all `360°` yaw/pitch angles as the canonical consistency dataset before cutting animation poses or engine atlases.

## Engine-Agnostic Integration Contract

| Target Engine | Track A (3D Rig / Web Model) | Track B (`10–20` View Dataset -> Runtime) |
|---|---|---|
| **Web (`Three.js` / `PixiJS`)** | `@pixiv/three-vrm` (`.vrm` + `MToonMaterial`) or `GLTFLoader` + `AnimationMixer` | Camera-yaw-indexed 8/16-angle billboard/sprite sheets or UV-projected toon textures |
| **Godot 4** | `.glb` / `godot-vrm` `Node3D` + `AnimationTree` bone retarget | `AnimatedSprite3D` / `SpriteFrames` indexed by `wrapi(yaw_sector)` |
| **Unity** | `.fbx`/`.glb`/`UniVRM` `Humanoid` Avatar + `AnimatorController` | `SpriteLibraryAsset` + directional `BlendTree` |
| **Unreal 5** | `SkeletalMesh` + `IK Retargeter` + `AnimBlueprint` | `PaperZD` multi-directional `AnimSequence` flipbooks |

## Mandatory Asset QA

- **True Alpha & Clean Edges:** Strip solid neutral studio backgrounds into clean RGBA alpha; reject baked grey-white checkerboards, cropped feet/hair tips, or baked UI text.
- **Locked Identity Check:** Compare `45°`, `90°`, and `180°` views side-by-side against the `0°` anchor — hair parting, asymmetric accessories, and outfit hemlines must match across all `10–20` angles.

## Gotchas

- **Generating animations straight from a text prompt without the `1 -> 10..20` Face & Body turnaround pack.** Causes severe face/outfit morphing every time the character turns or sits.
- **Approximating stylized anime humans with geometric primitives.** Spheres, cones, and lathed tubes read as wooden mannequins; always use real rigged `.vrm`/`.glb` models or Nano Banana multi-view sheets.
