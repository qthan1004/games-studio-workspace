---
name: overview-plan
version: "1.0.0"
released: "2026-11-21"
description: Mandatory Gate-2 workflow writing high-level Vietnamese Overview Plans to documents/<Project Name>/ for Director review and sign-off before GitHub decomposition or execution.
---

# Workflow: Executive Overview Plan File & Sign-Off Gate

Mandatory Gate-2 procedure for every new project kickoff and every `Point >= 2` feature or milestone. Agents never rely on ephemeral chat-only summaries — write the Overview Plan to `documents/<Project Name>/` so the Director can inspect, annotate, and approve it as a durable review artifact.

## Steps

1. **Step 1 — Complete Gate-1 Discovery or Scout First:**
   - **New project or open-ended scope:** Run [`clarify`](../skills/general/clarify/SKILL.md) + [`taste`](../skills/general/taste/SKILL.md) to resolve product vision, aesthetic targets, and hard constraints in one concise pass.
   - **Existing project with documented context:** Dispatch a read-only [`research`](../skills/roles/research/SKILL.md) subagent first to gather repo facts without re-asking known answers.
2. **Step 2 — Write the Vietnamese Overview Plan Markdown File (`status: draft`):**
   - Target path inside the studio workspace:
     - **New project kickoff:** `documents/<Project Name>/overview-plan.md`
     - **Subsequent feature / milestone (`Point >= 2`):** `documents/<Project Name>/overview-<feature-slug>.md`
   - Include YAML frontmatter (`project_name`, `slug`, `repo`, `engine`, `rigor`, `point_estimate`, `status: "draft"`, `created`, `updated`).
   - Keep prose in **Vietnamese** (preserving English technical terms, paths, and schema IDs) and strictly **Overview-level** (zero granular ticket dumps):
     1. **Project Identity & Locked Choices** (summary table)
     2. **Core Objective & Experience Loop**
     3. **Architectural Pillars & Hard Constraints**
     4. **Key Trade-offs**
     5. **Participating Studio Departments** (`producer`, `research`, `01..06`, `engineer`, `qa`)
     6. **GitHub Milestone & Deliverable Scope**
     7. **Director Sign-Off Status**
3. **Step 3 — Pause for Director Review (`MANDATORY STOP`):**
   - Link the generated `documents/<Project Name>/*.md` file in chat without duplicating its full contents, highlight only open confirmation points, and **wait for explicit Director approval**.
4. **Step 4 — Lock Plan & Trigger Producer Execution (`Gate 3`):**
   - Upon Director sign-off, update the Overview Plan frontmatter to `status: "locked"` (`updated: YYYY-MM-DD`).
   - Hand off to [`bootstrap-project.md`](bootstrap-project.md) (new game) or [`parallel-dispatch.md`](parallel-dispatch.md) (existing game) so `producer` autonomously creates the GitHub Repo/Project/Issues and dispatches `ROLE:`-tagged department subagents.
