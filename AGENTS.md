# Games Studio Workspace — Agent Rules

Before starting any task in this workspace or inside `Projects/<game>/`, read and follow:
1. [.agent/PREFLIGHT.md](.agent/PREFLIGHT.md) — Core guardrails, mandatory full-chain sync, dynamic skill picking, and `1–5` point routing.
2. [.agent/DIRECTOR_PROFILE.md](.agent/DIRECTOR_PROFILE.md) — Always-on summary of the Studio Director's taste, autonomy boundaries, and anti-patterns.

@.agent/PREFLIGHT.md
@.agent/DIRECTOR_PROFILE.md

## Architecture Summary

- **Two Studio Skill Clusters (`.agent/skills/`):**
  - `general/` — Universal rules every role must obey when performing the corresponding action (`guardrails`, `sync`, `taste`, `clarify`, `character-gen`, `git`, `mr`, `adversarial-review`, `hygiene`, `cli-bridge`). Start at [.agent/skills/general/README.md](.agent/skills/general/README.md).
  - `roles/` — Department specialist playbooks (`producer`, `research`, `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer`, `qa`). Start at [.agent/skills/roles/README.md](.agent/skills/roles/README.md).
- **Per-Game Specialist Tier (`Projects/<game>/`):** Each game is a standalone Git repository with its own `PROJECT.md`, `STYLE_ANCHOR.md`, `departments/MOC.md`, and `.agent/skills/` for engine- and genre-specific capabilities.
- **Unified Tooling Language:** All workspace and project tools/hooks under `.agent/tools/` and `.agent/hooks/` are written exclusively in zero-dependency **Node.js ESM (`.mjs`)**.
