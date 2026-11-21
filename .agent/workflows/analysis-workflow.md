---
name: analysis-workflow
description: Route an explicitly requested analysis, interview, specification, or implementation plan to the relevant skill without forcing a full pipeline.
---

# Analysis workflow

Resolve common skills from `<workspace>/.agent/`; follow the active repository's preflight and specialist rules. For workspace-only work, use `.agent/PREFLIGHT.md`.

- Requested analysis/design or a behavior change: read `analyze-requirements/SKILL.md` and inspect available evidence.
- A material product decision remains unresolved: read `interview-me/SKILL.md`, ask the focused question, and hold its dependent edit until answered. Continue independent authorized work.
- Requested specification or needed shared contract: read `spec-driven-development/SKILL.md`.
- Requested implementation plan: read `planning-and-task-breakdown/SKILL.md`.

An analysis request does not automatically authorize implementation. An implementation request does not require repeated approval of an already clear contract. Honor an explicitly requested review checkpoint; do not infer one from this workflow.

Use observable acceptance criteria and sources for intended behavior. No confidence-score threshold, mandatory question count, or automatic interview → spec → plan sequence. Default to the conversation; save documents only when requested or needed as a durable artifact.
