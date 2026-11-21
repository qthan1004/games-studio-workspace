# Games Studio Workspace

A genre-agnostic, engine-agnostic AI Game Studio workspace where specialized agents collaborate across real studio departments under strict synchronization and quality guardrails.

## Purpose & Scope

This repository contains **only the studio operating system** — skills, workflows, Node.js tools, lifecycle hooks, templates, and architecture documentation. It contains **zero game source code**.

- **Skills (`.agent/skills/`)** — Split into two clean clusters with fast-scan `README.md` roadmaps:
  - [`general/`](.agent/skills/general/README.md): Universal rules enforced across every role (`guardrails`, `sync`, `taste`, `clarify`, `character-gen`, `git`, `mr`, `adversarial-review`, `hygiene`, `cli-bridge`).
  - [`roles/`](.agent/skills/roles/README.md): Department playbooks (`producer`, `research`, `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer`, `qa`).
- **Workflows (`.agent/workflows/`)** — Multi-step studio procedures (`overview-plan`, `bootstrap-project`, `parallel-dispatch`, `multi-view-character`, `distill-taste`, `polish-scorecard`, `release-version`).
- **Tools & Hooks (`.agent/tools/`, `.agent/hooks/`)** — 100% unified zero-dependency **Node.js ESM (`.mjs`)** CLI utilities and lifecycle guards.
- **Studio Documentation (`documents/`)**:
  - Practical Usage Guide (Vietnamese): [`documents/studio-usage-guide.md`](documents/studio-usage-guide.md)
  - Master Architecture Blueprint (Vietnamese): [`documents/game-studio-architecture-blueprint.md`](documents/game-studio-architecture-blueprint.md)

## Workspace Layout

```text
.
├── .agent/                  # Preflight, Director Profile, skills (general + roles), workflows, Node.js tools & hooks
├── documents/               # Studio architecture blueprints and engineering standards
├── Projects/                # Standalone per-game Git repositories (git-ignored here)
├── AGENTS.md                # Universal agent entrypoint
├── CLAUDE.md                # Claude Code entrypoint
└── GEMINI.md                # Gemini / Antigravity entrypoint
```

## How Games Live in `Projects/`

Each game lives in `Projects/<game-slug>/` as its own independent GitHub repository paired with a **GitHub Project v2** board:
- **Cloud-First Work Tracking:** Roadmaps, milestones, task briefs, bug reports, QA reviews, and playtest checklists live on **GitHub Projects, Issues, and PRs** (automated via GitHub Actions + `gh` CLI, requiring no custom webhook server and leaving zero task-log clutter in the local repo).
- **Lean Local Product Repo:** Each game repository stores only living product truth (`PROJECT.md`, `STYLE_ANCHOR.md`, living specs under `departments/01..06` + `MOC.md` + `registry.yaml`, `data/`, engine code/assets, and `tests/`), inheriting studio skills while adding its own engine/genre specialist skills.
