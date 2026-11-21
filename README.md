# Games Studio Workspace

An AI-agent workspace designed so agents can collaborate and operate within clearly defined roles.

## Purpose & Scope

This repository serves strictly as the **workspace configuration layer** and intentionally contains **no project source code**. It provides only:

- **Skills** — Reusable role capabilities, behavioral rules, and task guides under [`.agent/`](.agent/).
- **Workflows** — Standardized execution and coordination flows under [`.agent/workflows/`](.agent/workflows/).
- **Preflight & Entrypoints** — Routing, role boundaries, and workspace context via [`.agent/PREFLIGHT.md`](.agent/PREFLIGHT.md), [`AGENTS.md`](AGENTS.md), [`CLAUDE.md`](CLAUDE.md), and [`GEMINI.md`](GEMINI.md).

## Workspace Structure

```text
.
├── .agent/          # Shared skills, workflows, templates, and preflight rules
├── Projects/        # Independent project sub-repositories (git-ignored here)
├── AGENTS.md        # Default workspace agent entrypoint
├── CLAUDE.md        # Claude agent entrypoint
└── GEMINI.md        # Gemini / Antigravity agent entrypoint
```

## Projects

All actual projects live as standalone sub-repositories inside the [`Projects/`](Projects/) folder. Everything inside `Projects/` (except `.gitkeep`) is ignored by this workspace repository so each project manages its own version control independently while inheriting workspace-level skills, workflows, and preflight routing.
