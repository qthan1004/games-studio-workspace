---
name: bootstrap-project
version: "1.0.0"
released: "2026-11-21"
description: Bootstrap a new standalone game repository under Projects/<slug>/ with lean 6-department living specs, GitHub Project v2 automation, and selected engine/genre specialist skills.
---

# Workflow: Bootstrap a New Game Project

Use when starting a new game under `Projects/<game-slug>/`.

## Steps

1. **Collect Core Identity (1 Short Pass via `clarify`):**
   - Confirm only what is missing: `project_name`, `slug`, `genre`, `engine` (`Godot` | `Unity` | `Unreal` | `Web` | `Custom` + version), `rigor` (`minimal` default | `standard` | `full`), and initial North-Star references.
2. **Scaffold Local Game Repository Deterministically:**
   - Run the Node.js scaffolder:
     ```bash
     node <workspace>/.agent/tools/bootstrap-game.mjs --slug <slug> --name "<Project Name>" --engine <Godot|Unity|Unreal|Web|Custom> --genre "<Genre>" --rigor <minimal|standard|full> [--vault] --json
     ```
   - This initializes `Projects/<slug>/` with its own `.git`, engine-aware `.gitignore`/`.gitattributes`, `PROJECT.md`, `STYLE_ANCHOR.md`, `.versionrc.json`, `.github/workflows/studio-board.yml`, `.agent/skills.json` (inheriting studio `general` + `roles`), `departments/MOC.md`, `departments/registry.yaml`, and optional `StudioVault/<slug>` directory junction.
3. **Install Only Matching Engine & Genre Specialist Skills:**
   - Select **only** the matching engine + genre/discipline skills (e.g., from curated skill libraries or custom templates) into `Projects/<slug>/.agent/skills/` and list them in `Projects/<slug>/.agent/skills/README.md`. Never copy unrelated engines.
4. **Provision GitHub Repo & Project Board (Only When Authorized):**
   - Create remote repo (`gh repo create <owner>/<slug> --private --source Projects/<slug> --push` when authorized), create initial GitHub Milestones (`M0-Concept`, `M1-Prototype`), and link the **GitHub Project v2** number into `PROJECT.md`.
5. **Verify:**
   - Run `node <workspace>/.agent/tools/check-sync.mjs --project Projects/<slug> --json` and `node <workspace>/.agent/tools/validate-skills.mjs --root Projects/<slug>/.agent/skills --json`.
