# Workflow: RAI build task

Goal: carry an authorized coding/fix task through `b5_build` to its requested delivery outcome.
The agent operates RAI from this chat; the user never needs to open the RAI site to confirm.
This is the coding route of [task-workflow](task-workflow.md), not a route for ticket reading,
reviews, documentation, skill settings, or Git housekeeping alone.

## 1. Mode and delivery scope

Reuse the task's explicit RAI choice. When asking for a new choice, explain the delivery scope:
RAI build through MR includes the existing branch-pair workflow, commit, push, and MR creation.
A user selecting that explicitly described outcome authorizes those steps; respect narrower
instructions such as analysis only, local implementation only, or send a create-MR link only.
A previous bare mode choice does not retroactively authorize unrequested external writes.
Do not ask again for actions already covered by the task. No automatic MR merge or deployment.

## 2. Resolve the existing ticket first

- If a key/URL is provided, read and reuse it. Do not create another ticket for the same task.
- If the user mentions an existing ticket but its key is missing, resolve it from available
  task context or ask for the key. A failed read is not evidence that no ticket exists.
- For a coding/fix request genuinely without a ticket, activate
  [jira-ticket-create](../jira-ticket-create/SKILL.md). Gather the required fields, compose the
  description, and get approval of the proposed Jira write in chat. After creation, verify and
  send its key/URL, then continue this build with that key and the existing mode/scope.
- If the user declines ticket creation, check whether the supported flow can use the available
  context without a ticket. If a ticket is mandatory, explain that input blocker and ask for an
  existing key or an explicit mode change. Do not silently switch to No RAI.

## 3. Resolve repository identity and callable schema

Follow task-workflow's tool/version discovery and bounded authentication recovery. Derive
`chain_id` from verified project/repository context; `PHARMACY` applies to verified PH context,
not every repository using this common workflow.

Resolve a candidate `source_id` from read-only catalog/context tools or the task's prior flow
evidence. Completed-ticket comments and historical sessions are leads, not an authoritative
repository mapping. Compare the candidate's repository URL/namespace with the active Git remote;
use `trace_source` and `get_repo_structure` where supported. A high retrieval score or
`sufficient_to_edit_code=true` does not establish that the selected repository is correct.
Record the verified identity and evidence in the existing task artifact when one is used.
Do not keep project-specific source IDs as defaults in this common workflow.

Inspect the callable schema before starting/resuming. The current `execute_flow` accepts
`flow`, `issue_key`, `chain_id`, `session_id`, `phase`, `action`, `user_input`, and `confirmed_by`;
it has no `source_id` argument. Do not invent it. Where a context tool actually accepts
`source_id`, use the verified ID there. A repository hint in `user_input` is context only and
does not guarantee that the server binds the flow to it. Verify the flow's returned repo too.

If the flow cannot use the right source, hold the affected operation and report the mismatch.
An explicitly approved context override may allow verified local/project-MCP context for the
current task, but does not change the catalog identity or authorize writes to the wrong repo.
Continue independent authorized work and report the RAI limitation accurately.

## 4. Start or resume the actual flow

Before creating a session, reuse its recorded `session_id` or inspect active flows for this
ticket. Verify the selected session belongs to the same task/repo; do not attach to another
person's work just because the issue key matches. Read `get_flow_status` on resume.
Use `classify_intent` and the supported build flow. For a new supported build session:

`execute_flow(flow="b5_build", issue_key=<verified key>, chain_id=<verified chain>)`

For later steps, pass the existing `session_id` and only actions/inputs supported by the
returned phase and actual schema. Do not replay completed phases. After timeout or an unknown
write outcome, read flow/repository state before retrying. Respect returned rate-limit timing.

Before the first production edit, ensure the task's work branch is active. When branch-pair
creation is included in delivery, run [create-branch](create-branch.md) at that point; do not
wait until the final delivery phase and implement on main/ci. Reuse existing task branches.
Respect explicit local-only limits rather than creating/pushing branches outside that scope.

The following are responsibilities, not a fixed server phase order:

| Phase | Agent responsibility |
|---|---|
| context | Verify ticket, repository identity, available source and business context. |
| change_points | Check files/functions against the requested scope and local evidence. |
| code_generation | Apply repository preflight/implementation skills; submit the actual required payload/format. Apply [code-comments](../code-comments/SKILL.md) to comments and any compatible returned format rules. |
| quality_gate | Analyze the current scoped diff and actual checks. Fix CRITICAL/HIGH or failed required checks before proceeding. Review WARN findings individually; WARN alone is not approval. |
| impact_analysis | Review shared callers, alternate paths, and regressions using the correct repo. Missing graph/context is a limitation, not proof of zero impact. |
| branch_commit_mr | Use the existing Git skills below within the authorized delivery scope. |

Stop before `code_review`; another reviewer owns that approval. Do not run verify/ship/deploy
or change Jira status unless separately requested.

## 5. Confirm in chat or continue automatically

The owner authorizes agent confirmation of routine build checkpoints when the returned
contract permits an agent decision, scope/context are verified, required checks pass, and no
material decision remains. Call the supported `confirm`/`submit` and briefly report the basis.
Do not make the user approve every routine step or use the RAI site.

Ask in this chat when the checkpoint explicitly requires a human/role approval, the tool
rejects agent confirmation with a human-only requirement, a material scope/business decision
remains, or an override is needed. Present the returned message, evidence and supported actions;
wait for the answer and forward it to the same session. An override requires explicit approval
of the stated limitation; explaining a blocker is not approval to override it.

For agent decisions, record the actual agent actor where supported. For user decisions, use the
actual confirmer. Never label an agent decision as a human approval, fabricate a Skip action,
continue on silence at a human gate, or treat a technical bypass as a passed quality check.
Fix an understood in-scope failure and rerun its checks without asking permission for the fix;
ask only when the remedy changes the approved scope or requires a human decision.

## 6. Reuse Git workflows for delivery

Read and execute [create-branch](create-branch.md) for creating/reusing the work + CI branch pair
and updating the workspace release tracker. Read and execute
[clean-commit](../clean-commit/SKILL.md) for scoped staging, commit, push, and MR target rules.
Do not implement a parallel branch/commit policy inside RAI or use the legacy
`workflows/clean-commit.md` in place of that skill.

Work only on the work branch. When CI delivery is authorized, update its matching merge-ci
with latest `ci` first, then merge the work branch, review conflicts/scope, and verify before
push. Use the existing workspace instructions; never merge the work branch directly into `ci`.
Update the existing tracker record with concise timeline/status and related tickets.

Do not call a server delivery operation that would write before honoring the required branch,
base, scope, and MR target. The current `create_feature_branch` uses `features/...` and exposes
no branch-name/base argument; use the existing local branch workflow instead. Before advancing
a flow action that may automatically deliver, verify that it can consume those prepared
branches/commits. If it cannot, complete already-authorized Git delivery through the existing
skills and hold/report that RAI phase as pending. This is not a silent switch to No RAI, and
external Git completion is not evidence that RAI completed its own phase.

For actual MR creation, reuse an existing matching open MR or create one only when requested
and with explicit source/target via a capable connector. A create-MR URL is only a link;
report it as such when the user asked for a link. Do not label it an existing MR.

## 7. Report observed outcomes

Send the ticket URL, delivered branch/commit information, actual MR URL or requested create-MR
link, verification results, and tracker path as relevant. Separate completed RAI phases from
pending/limited phases and any Git delivery completed outside the flow. Report a complete build
only when its required phases and requested deliverables are verified; retain session/context
for continuation when a capability is blocked.
