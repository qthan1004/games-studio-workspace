---
name: parallel-dispatch
version: "1.1.0"
released: "2026-11-21"
description: Multi-agent orchestration procedure for Point 2-5 tasks using GitHub Issues, ROLE-tagged Context Packets, Contract Freeze, Scene Locks, and independent QA review.
---

# Workflow: Multi-Agent Studio Dispatch

Used by [`roles/producer`](../skills/roles/producer/SKILL.md) after the Director approves the High-Level Overview Plan for any `Point >= 2` assignment.

## 1. Break Details onto GitHub & Freeze Contracts

1. Decompose the approved Overview Plan into per-department **GitHub Issues** via `node <workspace>/.agent/tools/gh-studio.mjs create --repo <owner/repo> ...`.
2. Score each slice via `Point = max(C, I, F, V)` and sequence waves:
   - **Wave 1 (Scout):** Read-only `research` subagent gathers codebase facts, genre benchmarks, or technical spike proofs.
   - **Wave 2 (Department Specs & Registry):** Parallel specialist subagents (`narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`) write Vietnamese living specs under `departments/01..06` and register shared entities/timings in `departments/registry.yaml`.
   - **Mandatory Contract Freeze & Scene Lock:** Lock shared `data/` schemas and `registry.yaml` before parallel code/asset writers start. At most **one** writer may touch binary/scene files (`.tscn`, `.tres`, `.unity`, `.prefab`, `.uasset`, `.umap`, `index.html`).
   - **Wave 3 (Implementation):** `engineer` and `art-audio` subagents implement code, `data/`, and tests.

## 2. Build `ROLE:`-Tagged Context Packets

Every subagent (`invoke_subagent`, `define_subagent`, or `swarm` with `workspace: "share"`/`"branch"`) MUST begin its prompt with `ROLE: <role-id>` on line 1 so `write-guard.mjs` and `office-telemetry.mjs` enforce department boundaries and visualize live studio activity:

```text
ROLE: <narrative|designer|balance|level|art-audio|architect|engineer|research|qa>
ISSUE: #<id> — <concise deliverable>
SKILLS TO READ: .agent/skills/roles/<role>/SKILL.md, .agent/skills/general/sync/SKILL.md, .agent/skills/general/hygiene/SKILL.md
CONTEXT FILES: <PROJECT.md, STYLE_ANCHOR.md, registry.yaml, relevant specs>
ALLOWED WRITE PATHS: <strictly bounded to department scope>
LANGUAGE RULE: Living docs in Vietnamese (keep tech/schema IDs in English); code & 1-line comments in English.
STOP WHEN: <deliverable complete and verified>
```

## 3. Independent QA & Standardized MR

1. After workers complete, `producer` runs `node <workspace>/.agent/tools/check-sync.mjs --project <project-root> --json`.
2. Dispatch an independent read-only `qa` subagent (`ROLE: qa`) to run Cross-GDD + Two-Stage Diff Review and post the verdict + **Playtest Checklist** to the GitHub Issue/PR via `gh-studio.mjs comment`.
3. Update `departments/MOC.md`, commit cleanly (`git` skill), and open a standardized MR (`mr` skill) into `main`.
