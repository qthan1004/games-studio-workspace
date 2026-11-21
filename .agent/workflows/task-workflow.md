# Task workflow: RAI or direct

Goal: let the user choose the execution mode only for bug-fix or coding requests across this workspace; other requests proceed directly.

## Mandatory choice

Ask only when a new task requests a bug fix or writing/changing application code or tests, with or without a ticket. A ticket, review, analysis, or request to run existing checks alone does not trigger this choice. Before the bug-fix/coding work, let the user select:

- **RAI**: use the RAI / AI-DLC build workflow from this chat. State whether the requested outcome
  includes branch-pair creation, commit, push and an MR, or is limited to local work/a create-MR link.
- **No RAI**: work directly using the active repository's preflight and applicable skills.

Use the client's interactive question tool when available; otherwise ask a concise question in the conversation. Neither option is consent until the user answers. Do not infer the choice from a ticket, task size, a preselected UI option, silence, or elapsed time. Reading entrypoints and checking tool availability to present an informed choice is allowed before the answer; hold dependent task work.

An explicit mode in the user's request already answers this question. Record the chosen mode in the conversation and an existing task artifact when one is used. Reuse it for follow-ups, corrections, status questions, resumed work, and authorized workers on the same task. Ask again only for a separate new bug-fix/coding task, or when the user asks to change mode; do not repeat the question at every phase or message. If a request bundles distinct bug-fix/coding tasks, name them in the question so one answer can explicitly cover the bundle.

All other tasks proceed directly without asking about RAI or automatically applying a RAI delivery workflow. This includes code reviews, reading/analyzing tickets, questions, documentation, agent behavior/settings updates, running existing checks, and routine Git/worktree housekeeping, even when linked to a ticket. If an initially ungated task later expands into a bug fix or writing/changing application code or tests, ask before that work unless a mode was already chosen. An explicit request to read data through RAI/MCP uses the requested read-only tool without asking for the workflow choice or starting an implementation flow. The mode choice never authorizes extra work, external writes, branch operations, agents, or deployment beyond the user's request.

## No RAI

Proceed directly with the repository/workspace preflight, task-to-skill routing, evidence gates, and authorized scope. RAI tools, version checks, and RAI checkpoints are not prerequisites for this mode, even when the task has a ticket. Other relevant project MCP tools remain available under their normal rules.

## RAI

1. Discover callable RAI / AI-DLC tools by capability, not server name. Inspect actual tool schemas; names in documentation are discovery leads, not proof of availability.
   If RAI cannot connect or authentication fails, execute [rai-token-refresh](../rai-token-refresh/SKILL.md): preserve the pending task/session, run the refresh script once to update MCP auth, reconnect the same server, verify a safe read, then continue the interrupted task. This also applies to read-only discovery/metadata calls and tool-level `Authentication required` results even when HTTP succeeds. Run the script before declaring a connection/authentication blocker; existing user authorization covers this recovery. Reuse a successful client-managed helper retry. Do not ask for the workflow choice again, restart completed phases, or replay writes with unknown outcomes. If tools are absent and the client cannot reconnect in place, report the required reconnect/restart and retain the task for continuation; a refreshed token alone does not prove tool availability.
2. At the first RAI task in the session, call `get_rai_config` with the locally recorded version when supported. The workspace RAI reference currently records `1.1.1`. Follow the returned supported procedure and version update instructions while preserving the user's mode choice, branch conventions, and authorization boundaries.
3. For authorized coding/fix tasks, read and execute [jira-rai-build](jira-rai-build.md), including
   its existing/missing-ticket routing, verified repository identity, resume procedure, chat/agent
   confirmations, and delivery through existing Git skills. Do not route a review, documentation,
   settings update, read-only MCP request, or Git housekeeping task into this build workflow.
   Use `classify_intent` to select the supported flow and then `execute_flow` for flow-backed work.
   Let the actual tool response drive phases and required context/quality gates. Do not invent
   flow parameters or claim to have executed a phase without a tool result.
4. Reuse an existing task ticket. For a coding/fix task genuinely without one, activate the
   missing-ticket step of jira-rai-build: compose/validate, get approval for the Jira write,
   create and verify, then continue with its key and the same mode. Do not create an extra ticket
   when one exists or infer that a failed read means it is missing. If creation is declined,
   use ticket-less context only if the supported flow permits it; otherwise ask for an existing
   key or explicit mode change. Never invent an issue key/chain or switch modes automatically.
5. For informational requests that RAI supports without a flow, use its appropriate read-only operations. Do not force implementation/deployment phases onto a review or question. Context tools such as `get_minimal_context`, `search_context_hybrid`, and `get_work_context` and quality gates such as `qge_analyze`, `qge_pre_ci_gate`, `qge_pre_uat_gate`, and `qge_pre_prod_gate` apply as required by the selected flow and actual schema.
6. Keep confirmations in this chat, without requiring the RAI site. The owner authorizes agent
   confirmation of routine build checkpoints when the returned contract permits an agent decision,
   evidence/checks support it, and no material decision remains. For a required human/role approval,
   a needed override, or unresolved scope/business decision, present the returned message and
   supported actions in chat and wait for the user. Forward that decision to the same session;
   never fabricate a Skip action, impersonate a human confirmer, or continue on silence at a human gate.
7. For connection/authentication failures, complete the bounded recovery in step 1 before declaring a blocker. If required RAI capabilities remain unavailable or fail, report the missing operation and hold the dependent RAI work. Continue independent authorized work only. Switching to direct mode requires the user's explicit choice; never silently emulate RAI with shell/HTTP calls or call a direct result a completed RAI flow.

## Branch and release conventions in both modes

The user's workspace branch workflow overrides RAI's generic branch examples:

- Work branch: `<task-type>/<branch-suffix>`, where task type is `feature`, `fix-bug`, or `hot-fix`, created from `main` after updating it from `origin/main`.
- CI integration branch: `merge-ci/<branch-suffix>`, created from `ci` after updating it from `origin/ci`. Never merge `ci` or `merge-ci` into the work branch.
- Follow the user's base branches, suffix rules, workspace release tracker, and authorization for checkout, push, MR, merge, and deployment. A ticket supplied for read-only review does not itself request branch creation.
- Reuse [create-branch](create-branch.md) for the branch pair/tracker and
  [clean-commit](../clean-commit/SKILL.md) for authorized staging/commit/push and MR target rules.
  Do not duplicate these workflows in RAI. If a RAI delivery operation cannot honor the convention,
  hold that operation instead of creating a differently named branch; continue already-authorized
  Git delivery with the existing skills and accurately report any RAI phase still pending.

Finish with the requested result, the chosen mode, verification evidence, and material limitations. In RAI mode, distinguish completed phases from pending checkpoints; in direct mode, report actual local checks.
