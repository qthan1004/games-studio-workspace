# Studio Director Profile

> **Version:** `1.1.0` | **Updated:** `2026-11-21`
> Context about the Studio Owner read by agents across all projects. Written as objective directives ("Prefers...", "Ask before...", "Never..."), never as a role-play persona. Run [`workflows/distill-taste.md`](workflows/distill-taste.md) to refine or merge new cross-project rules (capped at 50 rules).

## Always-on summary

- **Language Split:** Converse with the Director, write Overview Plans, and author all living project docs (`PROJECT.md` prose, `STYLE_ANCHOR.md`, `departments/MOC.md`, `departments/01..06`) in **Vietnamese** (preserving English tech terms, code symbols, and `registry.yaml` IDs). Write `SKILL.md` files, `workflows/`, source code, comments, Conventional Commits, and MR bodies in **English**.
- **2-Stage Kickoff Gate (Interview -> Overview Plan File -> Producer Breaks Details):**
  1. Interview first (`clarify` + `taste`) on new projects or open-ended features; if context already exists, send `research` first.
  2. Write the **High-Level Overview Plan** (`status: draft`) to `documents/<Project Name>/overview-plan.md` (or `overview-<feature-slug>.md` per [`workflows/overview-plan.md`](workflows/overview-plan.md)), link it for review, and wait for approval (`status: locked`) before executing. Once approved, `producer` autonomously breaks tasks onto **GitHub Issues & Project v2**.
- **True Multi-Agent Studio (`Point >= 2`):** Reject solo execution. From `Point >= 2`, main chat stays strictly `producer`, dispatches `research` first, delegates to Role Subagents (`narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer`), and verifies via an independent `qa` subagent.
- **Day-1 GitHub Repo & Board:** Every `Projects/<slug>/` gets a `private` GitHub repo, **GitHub Project v2**, Milestones, department Issues, `<type>/<issue>-<slug>` branches, and standardized MRs (`Name` / `Agent` / `Description`).
- **Complete & Synced Departments:** Populate all relevant `departments/01..06` with substantive Vietnamese specs synced via `registry.yaml` and `MOC.md`; zero empty stub folders.
- **Never:** Never solo-code `Point >= 2` work; never skip sign-off on the `documents/<Project Name>/` Overview Plan file; never overwrite `status: locked` files or `.env` unasked; never merge into `main` without Director sign-off.

## Craft & Engineering Preferences

- Keep `SKILL.md` files concise (`<= 150` lines) with `README.md` roadmaps; write all studio/project CLI tools and hooks in zero-dependency **Node.js ESM (`.mjs`)**; use relative links inside repo Markdown.

## Game & Aesthetic Taste

- Store project-specific tone, North-Star references, Experience Dials, and Golden Samples in `Projects/<game>/STYLE_ANCHOR.md` (`scope: project`).

## Sources

| Fact / Preference | Source | Date |
|---|---|---|
| Vietnamese chat, zero filler; English `SKILL.md`, code, commits, and `mr` template | interview | 2026-11-21 |
| Vietnamese living department docs (`01..06`, `MOC.md`, `STYLE_ANCHOR.md`) with English tech IDs | correction + interview | 2026-11-21 |
| Mandatory `producer`-only main agent from `Point >= 2` (`research` -> Role Subagents -> `qa`) | correction + interview | 2026-11-21 |
| Interview first -> High-level Overview Plan check -> Producer breaks details on GitHub | correction + interview | 2026-11-21 |
| Mandatory Day-1 `private` GitHub Repo + Project v2 + Milestones + Issues per game | correction + interview | 2026-11-21 |
| Write Gate-2 Overview Plans to `documents/<Project Name>/*.md` (`overview-plan` workflow) for review | correction | 2026-11-21 |
