---
title: "{{PROJECT_NAME}} — Studio Map of Content (MOC)"
owner: "producer"
status: "draft"
updated: "{{DATE}}"
---

# {{PROJECT_NAME}} — Central Knowledge Map (`MOC`)

Single navigation hub connecting living department specifications. All task schedules, bug reports, QA verdicts, and sprint states live on **GitHub Projects & Issues** (`PROJECT.md`).

## Project Anchors

- [Project Identity & Engine Config](../PROJECT.md)
- [Project Style & Golden Samples](../STYLE_ANCHOR.md)
- [Cross-Department Canonical Registry](registry.yaml)

## Living Department Specifications

| Dept | Directory | Canonical Documents | Status |
|---|---|---|---|
| **01 Narrative** | `01_narrative/` | *(Add world/character docs when needed)* | `empty` |
| **02 Game Design** | `02_game_design/` | [Game Brief](02_game_design/game-brief.md) | `draft` |
| **03 Balance & Economy** | `03_balance_economy/` | *(Add formulas/curves when numeric systems start)* | `empty` |
| **04 Level & World** | `04_level_world/` | *(Add pacing/layout specs when level work starts)* | `empty` |
| **05 Art, VFX & Audio** | `05_art_vfx_audio/` | *(Add art-bible & asset-manifest when visual lock starts)* | `empty` |
| **06 Architecture & Tech** | `06_architecture_tech/` | *(Add architecture/save contracts when shared code appears)* | `empty` |

## Feature & System Sync Matrix

| System ID | Owner Spec | Data Path | Code Path | Current State | Sync Flag |
|---|---|---|---|---|---|
| `core-loop` | [game-brief.md](02_game_design/game-brief.md) | `data/` | `{{CODE_ROOT}}` | `idea` | `[OK]` |
