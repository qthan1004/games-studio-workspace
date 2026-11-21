---
name: art-audio
version: "1.0.0"
released: "2026-11-21"
description: >
  Governs Art Bible visual direction, consistent asset family production, raster/alpha QA,
  audio bus/SFX design, non-simulation Game Feel (juice), and blind rubric polish scoring.
  Use for visual specs, placeholder/AI art briefs, soundscapes, hit-stop/shake tuning, or
  scoring polish out of 10. Not for core simulation physics (use engineer).
---

# Art Direction, Audio & Game Feel (Juice)

Deliver cohesive visuals, punchy audio, and visceral feedback that read clearly at native game scale without polluting gameplay simulation.

## Write Scope

- **Allowed writes:** `departments/05_art_vfx_audio/**`, `<asset_root>/**` (defined in `PROJECT.md`), and `assets_source/**`.

## Visual & Asset Pipeline

1. **Lock Technical & Visual Frame (`art-bible.md`):** Pin camera angle, native resolution, world scale/PPU, silhouette hierarchy, palette roles, lighting direction, and compression rules aligned with `STYLE_ANCHOR.md`.
2. **Hero Target -> Cohesive Family:** Approve one representative hero sprite/model at actual game scale over a real background *before* generating or authoring a batch. Derive related assets from that approved seed to prevent style drift.
3. **Deterministic Asset QA & Provenance (`asset-manifest.json`):**
   - Verify real alpha channels (reject baked grey-white checkerboards), exact frame grids/pivots, nearest-neighbor vs. mipmap settings, and multiples-of-4 block compression sizes.
   - Record source, license, and AI-generation disclosure status per asset in `asset-manifest.json`.
   - For character production, follow [`../../general/character-gen/SKILL.md`](../../general/character-gen/SKILL.md) and [`../../../workflows/multi-view-character.md`](../../../workflows/multi-view-character.md): either retarget open-license web rigs (`.vrm`/`.glb`) or generate **1 front face -> 10–20 angles**, then **1 front body -> 10–20 angles** via Nano Banana (`image-generator`) before engine binding. Use `cli-bridge` (`blender`, `krita`, `gimp`, `audacity`) when deterministic CLI harnesses are installed.

## Audio & Non-Simulation Juice

1. **Feedback Never Mutates Simulation:** Attach juice to discrete events (`on_hit`, `on_land`, `on_crit`). Shake only the camera visual offset (using decaying `trauma^2` in unscaled real time); run hit-stop with real-time restore timers so overlapping hits never freeze `timeScale` permanently.
2. **Proportional Feedback Tiers (`Small / Medium / Large`):** Reserve heavy hit-stop (`<= 0.12s`), flash (`<= 3/sec` WCAG limit), and large bursts for crits/bosses; keep routine footsteps/pickups subtle. Provide shake/flash accessibility sliders.
3. **Audio Bus Discipline:** Route `Master <- Music / SFX / Ambience / UI` in decibels; apply slight pitch/sample variation to frequent SFX and duck ambience/music under critical cues.
4. **Blind Polish Scoring:** When asked to raise animations, VFX, or UI to a target score (e.g., `8/10`), run [`../../../workflows/polish-scorecard.md`](../../../workflows/polish-scorecard.md).

## Gotchas

- **Baked text or UI chrome inside generated images.** Keep all labels, numbers, and buttons code-native and localization-ready.
- **Results firing before impact.** Sync hit reactions, SFX, and damage numbers to the exact contact frame registered in `registry.yaml`, never on button click if the attack has travel/wind-up time.
