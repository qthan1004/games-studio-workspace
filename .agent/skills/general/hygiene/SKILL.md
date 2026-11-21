---
name: hygiene
version: "1.1.0"
released: "2026-11-21"
description: >
  Enforces 1-line rule-free English code comments, data-driven tables, substantive Vietnamese
  department specs (with English technical IDs), relative links, and draft/locked frontmatter.
  Use whenever authoring or editing source code, data files, or department docs. Not for
  module architecture choice (use architect).
---

# Code, Data & Department Document Hygiene

Keep source code clean in English, tuning parameters data-driven in `data/`, and living department specifications rich, readable in Vietnamese, and strictly governed.

## When to Use

- Writing, editing, or reviewing code comments, `data/` tables, or `departments/` Markdown specs.
- **Not for:** system architecture paradigm selection (`architect`) or cross-file sync validation (`sync`).

## Core Rules

1. **Single-line, mechanism-only code comments (English):**
   - Every inline code comment must be **at most one short line** explaining *what technical mechanism* runs (e.g., `// Clamp frame delta to prevent tab-switch tunneling.`).
   - Write **no comment** when names and types already read clearly.
   - **Zero gameplay rules or multi-line stories in code:** Never put `STEP 1/2`, ticket IDs, or game design rules/numbers inside comments; document rules in `departments/` and numbers in `data/`.
2. **Vietnamese Living Department Docs + Zero Empty Touched Folders:**
   - Author `PROJECT.md` prose, `STYLE_ANCHOR.md`, `departments/MOC.md`, and all `departments/01..06/*.md` specs in **clear Vietnamese**, keeping technical terms, file paths, and `registry.yaml` / `data/` identifiers in **English** (e.g., `parry_window_ms`, `MeshToonMaterial`, `Event Bus`).
   - Every department relevant to the project (`01_narrative`, `02_game_design`, `03_balance_economy`, `04_level_world`, `05_art_vfx_audio`, `06_architecture_tech`) must hold real, project-specific specifications — never leave empty stub folders while burying rules inside code or JSON.
3. **Data-Driven values first:**
   - Store all tunables (stats, timings, coordinates, dialogue lines, wave tables) in `data/` rather than hardcoded in logic.
4. **Document Frontmatter (`status: draft | locked`) & Relative Links:**
   - Start every spec under `departments/01..06` with YAML frontmatter (`title`, `owner`, `status: draft | locked`, `updated: YYYY-MM-DD`). Never edit `status: locked` files without Director approval. Use relative Markdown links only.

## Gotchas

- **Stub 10-line placeholder GDDs.** Write concrete mechanics, edge cases, layouts, and baseline numbers so `engineer`, `balance`, and `qa` can build and audit against real specs.
- **Duplicating raw tables into prose.** Keep canonical datasets in `data/` and reference their `registry.yaml` IDs from department docs.
