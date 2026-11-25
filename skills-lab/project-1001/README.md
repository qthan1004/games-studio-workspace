# Project 1001 — Experimental Specialist Skills Sandbox (`v0.1.0`)

**Status:** `v0.1.0` Pre-Pilot Baseline (Isolated inside `skills-lab/project-1001/` outside `.agent/skills/` — refine constants/recipes iteratively as live tools run).

## Routing Rule for `producer` & Role Subagents

- These experimental skills are **isolated from `.agent/skills/`** and are **never auto-loaded** into standard workspace sessions.
- Reference a skill's explicit path inside a subagent's `SKILLS TO READ:` field **only** when executing that specific pipeline stage:

| Slot # | Experimental Skill Package | Companion Script | Target Department(s) | Scope Summary (`<= 150 lines` each) |
|---:|---|---|---|---|
| **1** | [`srpg-concept-previs`](./srpg-concept-previs/SKILL.md) | — | `designer`, `art-audio`, `level` | **Stage 1 Pre-Vis Blueprints:** Character `3-Layer VRoid Split` (`FrameCon 4–14` + `Gothic MToon 60-30-10`), Weapon Ortho (`Grip Pivot 0,0,0`), `2.0m × 2.0m` Tile Blockout, `3-Phase` VFX Storyboard & `Reinhart Z-Rift` Bloodline Choreography. |
| **2** | [`blender-3d-modeler`](./blender-3d-modeler/SKILL.md) | [`qa_unity_export.py`](./blender-3d-modeler/scripts/qa_unity_export.py) | `art-audio` *(3D Tech-Art)* | **Stage 2 Blender Modeler:** `VRM-Addon v4.10.5` + `mcp-for-blender v2.3.1` (`1 Live Agent` + Headless `.py`) + `TRELLIS 2 / Hunyuan3D` + `Poly Haven CC0` -> `1 SMR + 1 Atlas` (`11 Master Rigs`). |
| **3** | [`srpg-world-grid`](./srpg-world-grid/SKILL.md) | [`validate-chapter-map.mjs`](./srpg-world-grid/scripts/validate-chapter-map.mjs) | `level`, `narrative`, `engineer` | **Dynamic World & Grid:** `Diamond Convergent WorldState` -> `EncounterComposer` (`SanityClamp <= 48`, `Escrow`) -> `DeploymentResolver` (`2–3 Tile Chokes`, `Turn-End Spawn AP 25..30 / 30..35`, `CLP <= 10`). |
| **4** | [`srpg-ap-utility-ai`](./srpg-ap-utility-ai/SKILL.md) | [`sim-combat-check.mjs`](./srpg-ap-utility-ai/scripts/sim-combat-check.mjs) | `balance`, `designer`, `engineer` | **Combat Math & Utility AI:** `Hot 14-Byte BiasedAP [-50..+205]`, `2-RN Hit / 1-RN Crit`, `FrameCon/EffCon`, `1 Retaliation Token`, `4-Layer Symmetric Utility AI` + `>35% UI Tag` + `[STORY_SPARE_FLOOR: 1 HP]`. |
| **5** | [`unity-urp-srpg`](./unity-urp-srpg/SKILL.md) | — | `engineer`, `architect`, `art-audio` | **Unity 6 URP Integration:** `Covenant.Core.asmdef` (`Pure C#`) vs `Covenant.UnityView`, `UniVRM` + `SRP Batcher 48 Units @ 60 FPS`, `0-GC` Interactive `AP Action Bar` & `Hard 30–60s Shot-Clock`. |
