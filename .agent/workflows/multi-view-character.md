---
name: multi-view-character
version: "1.0.0"
released: "2026-11-21"
description: Step-by-step Nano Banana (image-generator) workflow generating 1 front face -> 10-20 multi-angle face refs and 1 front body -> 10-20 multi-angle body refs for zero-drift character consistency across any game engine.
---

# Workflow: Multi-Angle Character Synthesis (`Nano Banana` / Web Asset Pipeline)

Used by [`general/character-gen`](../skills/general/character-gen/SKILL.md) and [`roles/art-audio`](../skills/roles/art-audio/SKILL.md) whenever creating custom consistent characters or preparing directional sprites/3D reference packs.

## Directory Layout per Character

Store source reference packs in `assets_source/characters/<char-id>/` (and exported runtime-ready atlases/models in `<asset_root>/characters/<char-id>/` + `asset-manifest.json`):

```text
assets_source/characters/<char-id>/
├── 00_face_front_anchor.png          # Step 1A: Canonical 0-deg straight-on face
├── face_angles/                      # Step 1B: 10-20 directional head/face views
│   ├── face_yaw_000_pitch_00.png
│   ├── face_yaw_030_pitch_00.png ... face_yaw_330_pitch_00.png (12 yaw steps)
│   └── face_iso_pitch_plus25_*.png   # 4-8 elevated/low pitch angles
├── 01_body_front_anchor.png          # Step 2A: Canonical 0-deg full-body (locked to 00_face)
└── body_angles/                      # Step 2B: 10-20 directional full-body views
    ├── body_yaw_000_pitch_00.png ... body_yaw_330_pitch_00.png
    └── body_iso_pitch_plus25_*.png
```

## Step-by-Step Execution

1. **Step 1A — Front Face Anchor (`00_face_front_anchor.png`):**
   - Dispatch `image-generator` (Nano Banana) for **1 straight-on (`0°` yaw, `0°` pitch) head-and-shoulders portrait** on a flat neutral keyable background (`#E8ECEF`), specifying exact anime line weight, cel-shading ramp, iris color, dual eye highlights, and hair silhouette from `STYLE_ANCHOR.md` / `art-bible.md`.
2. **Step 1B — `10–20` Multi-Angle Face Reference Pack (`face_angles/`):**
   - Passing `00_face_front_anchor.png` as the visual reference input, generate **`10–20` multi-angle head views** (`12` `30°`-step horizontal yaw angles `0°..330°` + `4–8` elevated `+25°` isometric & `-15°` pitch views, either as high-res grid sheets sliced deterministically via Node script or individual renders).
   - Verify asymmetric hair locks, glasses, ribbons, and ear/neck junctions stay consistent across every angle.
3. **Step 2A — Front Full-Body Anchor (`01_body_front_anchor.png`):**
   - Passing `00_face_front_anchor.png` + `face_angles/` as identity reference, generate **1 straight-on (`0°`) full-body standing/A-pose sheet** locking exact head-to-body ratio (e.g., `1:7` non-chibi anime), blazer/shirt/skirt/slacks tailoring, and shoes.
4. **Step 2B — `10–20` Multi-Angle Full-Body Turnaround Pack (`body_angles/`):**
   - Passing `01_body_front_anchor.png` + `face_angles/` as anchors, generate **`10–20` directional full-body views** covering full `360°` yaw + game camera pitch (`+25°` diorama angle).
5. **Step 3 — Animation & Engine Binding:**
   - **2D / 2.5D Billboards (`Web Three.js`, `PixiJS`, `Godot`, `Unity`, `Unreal`):** Generate pose frames (`idle`, `walk_1..4`, `sit_work`, `chill`) conditioned on the matching `body_angles/` direction, strip the solid key background to clean RGBA PNG/WebP, normalize foot pivot `(0.5, 1.0)`, and bind camera-relative directional angle switching (`sector = (((Math.round(((charYaw - camYaw) / TWO_PI) * N) % N) + N) % N)`).
   - **3D Models (`.vrm` / `.glb`):** Use the `10–20` turnaround pack as orthographic modeling/texture reference or pair directly with open-license VRoid `.vrm` base meshes + retargeted skeletal animations.
