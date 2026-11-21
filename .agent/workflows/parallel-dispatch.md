---
name: parallel-dispatch
version: "1.0.0"
released: "2026-11-21"
description: Multi-agent orchestration procedure for Point 3-5 tasks using Context Packets, Contract Freeze, Scene Locks, and independent QA review without local tracking clutter.
---

# Workflow: Parallel Multi-Agent Dispatch

Used by [`roles/producer`](../skills/roles/producer/SKILL.md) when a feature or milestone involves independent Point 3–5 work across multiple departments or modules.

## 1. Score & Freeze Contracts First

1. Read `PROJECT.md`, `STYLE_ANCHOR.md`, `departments/MOC.md`, and active GitHub Issues (`node <workspace>/.agent/tools/gh-studio.mjs list --repo <owner/repo> --json`).
2. Score each slice via `Point = max(C, I, F, V)`. Keep Point 1–2 slices Solo; group independent Point 3–4 slices into rounds.
3. **Mandatory Contract Freeze:** Before spawning parallel writers, lock shared `data/` schemas, event signatures, and `departments/registry.yaml` entries on the base branch.
4. **Enforce Binary & Scene Exclusivity:** At most **one** active writer may touch `.tscn`, `.tres`, `.unity`, `.prefab`, `.uasset`, `.umap`, or engine project settings in any parallel round.

## 2. Build Isolated Context Packets

Never feed full chat transcripts to workers. Give each subagent (`invoke_subagent`, `define_subagent`, `swarm` with `workspace: "share"`/`"branch"`, or isolated Git worktree) a self-contained packet:

```text
ROLE: <department role from .agent/skills/roles/>
GENERAL SKILLS: sync, hygiene [, git if local commit granted]
PROJECT SPECIALISTS: <paths under Projects/<game>/.agent/skills/>
ISSUE / GOAL: #<id> — <exact outcome>
FILES TO READ: <only required specs, registry.yaml, schemas>
ALLOWED WRITE PATHS: <strictly bounded to role ownership>
SCENE LOCK: <explicitly forbidden binary/scene paths>
STOP WHEN: <deterministic test/check + sync check pass>
```

Confirm concurrency and branch/worktree permissions with the Director if not already granted for the milestone.

## 3. Supervise on Events & Run Two-Stage QA

1. Wait reactively for worker completion (do not poll in loops). Route unresolved material questions through `clarify` in the main chat.
2. When a worker reports completion:
   - Inspect `git status` and actual `git diff` to confirm zero out-of-scope edits.
   - Run `node <workspace>/.agent/tools/check-sync.mjs --project <project-root> --json`.
   - Spawn an independent read-only `qa` subagent to run **Stage 1 (Spec & Sync Compliance)** -> **Stage 2 (Engine/GC/Memory/Save Safety)**.
3. Post the consolidated QA verdict + **Playtest Checklist** to the GitHub Issue/PR via `gh-studio.mjs` and transition the card to `Review & Playtest`. Merge into `main` only upon Director approval.
