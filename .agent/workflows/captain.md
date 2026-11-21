---
description: Activate orchestration from parallel task documents or execution requests, with the main chat as captain, isolated workers, independent review and resumable checkpoints.
---

# /captain

Load [captain](../captain/SKILL.md). Ordinary chat retains normal rules/skills; discussion, workflow edits and task size do not launch or resume a run.

- **Plan:** record intent, dependencies, exclusive ownership, isolation, tests/DoD, checkpoints, stop conditions and permissions. Document-only requests do not launch workers.
- **Run:** the main chat is captain and dispatches workers/reviewers directly. No separate captain/bridge agent; no application implementation by captain. Reuse granted permissions; ask only unresolved launch decisions.
- **Preflight:** every participant reads and executes its actual entrypoint/PREFLIGHT and applicable skills, with evidence. Respect scope, branch rules and authorized concurrency/isolation.
- **Dispatch:** use [task scoring](../captain/references/task-scoring.md) and the selected native/CLI adapter. Workspace Codex crew use interactive CLI; preserve the IDE view. Hold launch if the required adapter/model is unavailable.
- **Questions:** worker → main-chat captain → user only for unresolved material decisions via `interview-me`. Record answers and return them directly to affected workers; hold dependent edits.
- **Wait/review:** use [execution-cost policy](../captain/references/delegated-workflow.md#execution-cost-and-wake-policy). Wait on events; inspect fresh HEAD-bound evidence. Point 1/2: captain reviews independently; point 3/4/5: dedicated reviewer. Keep required checks and bounded correction rounds.
- **Deliver:** integrate, push and retire branches/worktrees only under recorded authorization, with current verification and repository Git rules.
- **Resume/stop:** reconcile existing checkpoints/workers; legacy captain subagents stay stopped. Never duplicate supervisors or redo verified work. Preserve work on pause; report outcomes, decisions and next tasks directly to the user.

Full execution procedure: [delegated workflow](../captain/references/delegated-workflow.md). A watcher alone cannot dispatch, review or guarantee continuation after the chat runtime ends.
