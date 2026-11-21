---
name: bootstrap-project
version: "1.1.0"
released: "2026-11-21"
description: End-to-end workflow to interview the Director, approve a high-level Overview Plan, scaffold Projects/<slug>/, create its GitHub Repo + Project v2 + Issues, and dispatch department subagents.
---

# Workflow: Bootstrap a New Game Project

Mandatory procedure whenever creating a new project under `Projects/<game-slug>/`. Never skip straight to coding.

## Steps

1. **Step 1 — Discovery & Taste Interview (`clarify` + `taste`):**
   - Interview the Director in one concise Vietnamese pass to confirm: `project_name`, `slug`, `genre`, `engine` (`Godot` | `Unity` | `Unreal` | `Web` | `Custom`), `rigor` (`minimal` | `standard` | `full`), North-Star references, Experience Dials, and repo visibility (`private` default).
2. **Step 2 — High-Level Overview Plan File Gate (`PAUSE FOR DIRECTOR`):**
   - Follow [`overview-plan.md`](overview-plan.md): write the concise Vietnamese **Executive Overview Plan** (`status: draft`) to `documents/<Project Name>/overview-plan.md` (Core Fantasy, Pillars, Participating Departments `01..06` + `engineer` + `qa`, and M1 Milestone Goal), link it to the Director, and wait for sign-off (then set `status: locked`).
3. **Step 3 — Scaffold Local Repo & Provision GitHub Suite (`producer`):**
   - Once approved, run the deterministic scaffolder:
     ```bash
     node <workspace>/.agent/tools/bootstrap-game.mjs --slug <slug> --name "<Project Name>" --engine <Engine> --genre "<Genre>" --rigor <rigor> [--vault] --json
     ```
   - Provision the remote GitHub repository, Milestone, and Project v2 board via `gh-studio.mjs`:
     ```bash
     node <workspace>/.agent/tools/gh-studio.mjs repo-init --repo <owner>/<slug> --project-dir Projects/<slug> --title "<Project Name> Studio Board" --json
     ```
   - Break the approved Overview Plan into concrete per-department **GitHub Issues** (`gh-studio.mjs create`) and create branch `feat/1-initial-foundation` off `main`.
4. **Step 4 — Install Project Specialist Skills & Dispatch Studio Crew:**
   - Author/install matching engine & genre specialist skills in `Projects/<slug>/.agent/skills/`.
   - Dispatch `research` -> department subagents (`narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`) to author substantive **Vietnamese** specs across `departments/01..06` + `STYLE_ANCHOR.md` + `registry.yaml` -> `engineer` subagent for initial playable foundation.
5. **Step 5 — Independent QA, Sync Verification & MR:**
   - Run `check-sync.mjs` and `validate-skills.mjs --strict`, dispatch `qa` subagent to audit and comment on GitHub, push the branch, and open a standardized MR (`mr` skill) into `main`.
