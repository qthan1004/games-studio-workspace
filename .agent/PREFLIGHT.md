# Agent preflight

Goal: route the task to the smallest relevant set of skills and require evidence before changing behavior. This is a portable template; repositories add their own boundaries and specialist routing.

## Boundaries

- Identify the target and preserve local changes. Inspect Git status before edits or branch operations when the target is a Git repository; do not stash, reset, or overwrite uncommitted work without asking.
- Stay within the user's scope and authorization. Follow the workspace/repository branch workflow. Commit, push, MR creation, ticket writes, status transitions, merge, deployment, and external writes require authorization from the task.
- Do not start parallel agents, worktrees, or overnight runs without the user's authorization and the relevant orchestration procedure.
- Read [personal-behavior](personal-behavior/SKILL.md). For a behavior change, Gate 1 needs a supported intended behavior, an inspected causal path and affected callers, and resolved material product decisions. Self-rated confidence is not evidence.
- Triage all inputs and observe live behavior before deep code tracing: (1) check every supplied input (videos, screenshots, URLs/query params, payloads, steps, env) and briefly exercise/observe the real flow when callable tools/environments exist; (2) predict candidate failure modes (code/logic vs external caller/iframe/data/params); (3) if a code/logic fault is indicated, give the user a concise preliminary status update first and then trace the narrowed path; (4) if not caused by code, state the external cause and evidence clearly to the user and stop without tracing healthy code.
- Inspect factual gaps first. If an unanswered choice changes correctness, data retention, scope, or business behavior, read `interview-me`, ask the focused question, and hold the dependent edit. Continue independent authorized work. Routine reversible implementation choices may use a stated assumption.

## Mandatory task workflow choice (RAI vs No RAI)

Apply [workflows/task-workflow.md](workflows/task-workflow.md) **only** when a new task requests a bug fix or writing/changing application code or tests:

- Obtain the user's **RAI** or **No RAI** choice before starting dependent coding/fix work, or reuse an explicit mode already chosen for the same task.
- Code reviews, reading/analyzing tickets, Q&A, documentation, agent configuration, running existing checks, and routine Git housekeeping proceed directly **without** asking this question and without starting an automatic RAI build flow, even when a ticket key is mentioned.
- Explicit requests to read data through RAI MCP (e.g., reading a Jira ticket or searching context) call the read-only tool directly without asking for a workflow mode.

## Required task-to-skill routing

Read and execute the applicable `SKILL.md` or workflow file before the dependent action, including when the user only says "fix" or "address review". Briefly identify used skills and Gate 1 evidence before a nontrivial production change. Knowing a skill name is not execution. Reuse skills already read; load references only when needed. A mechanical documentation or formatting edit does not require a behavior workflow.

| Task | Skill |
|---|---|
| Choose **RAI** vs **No RAI** for a new coding / bug-fix request | [workflows/task-workflow.md](workflows/task-workflow.md) |
| Execute an authorized coding / bug-fix task through RAI `b5_build` | [workflows/jira-rai-build.md](workflows/jira-rai-build.md) |
| Create a Jira ticket explicitly, or supply a missing ticket for a RAI build task | [jira-ticket-create](jira-ticket-create/SKILL.md) & [workflows/jira-ticket-create.md](workflows/jira-ticket-create.md) |
| Change status / transition an existing Jira ticket | [jira-ticket-transition](jira-ticket-transition/SKILL.md) |
| RAI MCP connection error, HTTP 401, expired JWT, or `Authentication required` | [rai-token-refresh](rai-token-refresh/SKILL.md) |
| Feature or behavior fix, review-driven behavior change, or requirements analysis | [analyze-requirements](analyze-requirements/SKILL.md) |
| Reported bug, regression, or proposed root cause | [diagnose](diagnose/SKILL.md) |
| MR review feedback | [mr-review-fix](mr-review-fix/SKILL.md) |
| Explicit interview or a material product decision unresolved after investigation | [interview-me](interview-me/SKILL.md) |
| Behavior implementation or bug fix | [test-driven-development](test-driven-development/SKILL.md) |
| Requested specification or needed shared behavioral contract | [spec-driven-development](spec-driven-development/SKILL.md) |
| Requested implementation plan | [planning-and-task-breakdown](planning-and-task-breakdown/SKILL.md) |
| Known domain, earlier decisions, or ticket documents | [agent-wiki](agent-wiki/SKILL.md) |
| Independent/adversarial review or an assigned validation workflow | [adversarial-review](adversarial-review/SKILL.md) |
| Requested technical-debt scan, architectural drift audit, or debt prioritization | [tech-debt-audit](tech-debt-audit/SKILL.md) |
| Requested parallel doc/plan/tasks (planning only), delegated execution/resume of that plan, or authorized parallel/away runs | [captain](captain/SKILL.md) |
| Worker launched with a captain brief | [crew](crew/SKILL.md) |
| UI, accessibility, or UX review | [web-design-guidelines](web-design-guidelines/SKILL.md) |
| React performance work | [vercel-react-best-practices](vercel-react-best-practices/SKILL.md) |
| React component API or composition refactor | [vercel-composition-patterns](vercel-composition-patterns/SKILL.md) |
| Write, edit, or review inline code comments | [code-comments](code-comments/SKILL.md) |
| Create or reuse work + CI integration branch pair and release tracker | [workflows/create-branch.md](workflows/create-branch.md) |
| Requested commit, push, or MR creation links | [clean-commit](clean-commit/SKILL.md) |
| Requested reusable collaboration preferences | [working-style](working-style/SKILL.md) |

Combine routes that apply; do not automatically run interview → spec → plan for every task. Missing optional tools do not block independent work. Disclose a missing required skill or evidence before its dependent edit.

## Automatic RAI connection recovery

Whenever any attempted RAI MCP call fails to connect or returns an authentication error (including read-only calls, expired tokens, HTTP 401, or tool-level `Authentication required`), immediately execute [rai-token-refresh](rai-token-refresh/SKILL.md):

1. Preserve the pending task, ticket key, active `session_id`, and current checkpoint.
2. Run [refresh-token.ps1](rai-token-refresh/scripts/refresh-token.ps1) with `-Force` once to renew the Keycloak token and reload MCP configuration.
3. Verify a safe read and resume the interrupted session from its current phase without re-asking the **RAI / No RAI** question or restarting completed phases.

## Shared common and repository specialist

In this workspace, edit `<workspace>/local-skills/` and deploy skill folders to `<workspace>/.agent/`. Repositories read common directly from that workspace directory, without a common copy or junction inside the repository. `.agent/specialist/` stays inside the repository. Read the repository's entrypoint and preflight for local boundaries and specialist triggers. Do not copy project rules into this general template.

This file's common links are relative to the workspace's `.agent/PREFLIGHT.md`. A repository preflight one directory below the workspace must use `../../.agent/`; specialist links remain local. Portable installations may use another configured shared path. Verify relative references after deployment. A repository using workspace common requires that workspace to be available.

For semantic navigation, use the relevant project-scoped MCP first when callable, as defined by `personal-behavior`. Disclose unsupported queries or observed failures before targeted fallback. Diagnostics check types and symbols; tests or observations establish behavior.
