# Delegated parallel task workflow

Read for execution or resume of a selected captain workflow. Document preparation does not launch it. This procedure uses the selected worker adapter with captain-side supervision; it is not a background scheduler or registered shell command.

Scope: execution-cost/wake policy, point-based dispatch/review and coordinator duties below govern that captain run only. The main chat is the captain; there is no separate captain subagent or bridge layer. Ordinary chat keeps its existing rule/skill routing and verification. Workflow discussion or maintenance is not execution/resume authorization, including while a run is paused.

## Roles

| Role | Responsibility | Boundary |
|---|---|---|
| Captain in main chat | User conversation, intent, authorization, dependencies, exclusive ownership, direct worker/reviewer dispatch, verification, checkpoints, next tasks and authorized delivery | No delegated application edits, separate supervisor/bridge, invented requirements, expanded permissions or IDE movement |
| Worker | One assigned brief and isolated worktree, implementation, tests and results; local commits when authorized | No shared checkout edits, unassigned files or shared-branch delivery |
| Reviewer | Independently inspect current diff, acceptance and test evidence | Read-only; worker claims alone cannot establish acceptance |

## Prepare in the main chat

1. Read the selected spec, plan, task results, repository entrypoint and current base/HEAD. Preserve local changes and prior answers. Resolve which plan the user means from context before asking.
2. Act as captain in this main chat; reuse recorded checkpoints and worker identities rather than launching a coordinator. When an older run used a captain subagent, confirm it is stopped before taking over, preserve its evidence and record the new owner; never run two supervisors. A status question is not a new run.
3. Persist a run record under `.agent-runs/<run>/`: verbatim intent, repository/base/work branch, document/task paths, execution mode, dependencies and exclusive ownership, concurrency cap, stop conditions, granted/pending permissions and no IDE changes. Record `coordinatorMode: main-chat-captain`, the current chat identity where available, task states, selected launcher and the instruction establishing it. Reconcile the persisted launcher choice on resume; role/count words do not change it. Do not guess authorization.
4. When required launch answers are missing, prepare the concrete assignment first and ask one grouped question directly. Reuse answers already granted for the same scope; do not launch on pending permission.
5. Before dispatch, verify actual captain preflight/skill-routing evidence and the interactive CLI requirement in `captain/SKILL.md`. Read `ide-adapters.md` for that launch. Do not infer a native-agent exception from available native tools. Require the crew's own concrete preflight receipt before dependent edits. Report the actual state: preparing, delegated, running, awaiting input or verified. Selecting captain mode alone does not mean implementation has started.

## Captain execution

1. Execute the actual repository/workspace PREFLIGHT yourself, record routing/scope/MCP evidence, then reconcile current HEAD and task results. Require the same evidenced preflight from each worker/reviewer; naming it in a brief is insufficient. Freeze shared contracts/fixtures before dependent tasks. Tasks can run together only when they write neither the same file nor the same model/function/contract. Serialize shared test orders, server configuration, ports and clock mutations.
2. Respect both the authorized crew cap (workers/reviewers only; default 2) and runtime capacity (all agents, including the single main-chat captain). Available crew slots are bounded by both; idle/unrelated agents may also occupy runtime slots. Queue review when slots are full; never skip it or raise concurrency silently. If no slot can become available without stopping unrelated work, report that concrete blocker directly to the user.
3. Select model/effort per the policy below. When worktrees are authorized, fork each worker branch from the recorded HEAD of the user's current feature/fix-bug/hot-fix work branch; use a compliant name such as `feature/PH-2468-T04`, record parent/base/child, and fill the brief before dispatch. These are temporary task branches, not new release work branches or CI branch pairs. Never pull CI code into the work branch.
4. Native agents share filesystem and working directory. Give each worker an absolute worktree path; require explicit command working directories and branch/root checks. A project MCP bound to the main checkout is not evidence about another worktree. Disclose that limitation and use an authorized scoped alternative.
5. Workers record changes, test cases/results, current HEAD and next task. A `done` claim triggers captain verification of the actual diff and relevant checks at that HEAD, followed by independent read-only review.
6. Send a bounded correction to the same worker, then re-verify/re-review. If the same causal issue returns twice, preserve evidence, hold dependent tasks and escalate directly to the user. Do not loop indefinitely, redo accepted work or weaken tests to pass.
7. Integrate, commit and push only at the boundaries authorized in the plan. Recheck the integrated HEAD and confirm remote state before claiming delivery. Missing delivery permission leaves a verified checkpoint pending delivery; it does not require reimplementation.
8. One assigned owner updates results, docs and tracking at authorized boundaries. Record next ready tasks and report evidence directly to the user; the main-chat captain does not become a second implementation owner.

Use the selected adapter's supported communication and event waits while the session is active; interactive CLI uses checkpoint files and supported session follow-up. Keep `inbox.md`, notes and checkpoints durable; a file watcher alone cannot dispatch or review. If the runtime ends, preserve a resumable checkpoint rather than promising autonomous continuation.

## Execution cost and wake policy

- The single main-chat captain owns user decisions, reports, scheduling and authorized delivery; one worker owns each write set. Do not add a separate captain/bridge agent or a second supervisor investigating the same task.
- Read task/skills once per assignment, plus the spec/plan sections needed for its contract. Keep paths to the full sources available for real gaps; do not copy full chat history, historical appendices or every downstream task into each prompt. Re-read only changed instructions or unresolved evidence.
- Captain handles launch, actual completion/failure, material questions, bounded corrections and delivery. While a crew is working, wait on an event or a blocking code watcher. Do not repeatedly poll Git/logs, generate status-only messages, re-score the task or plan downstream work merely to fill waiting time. Respect runtime communication requirements without inventing progress.
- A checkpoint includes task/session ID, branch/HEAD and file fingerprint, changed files, commands/exit codes/counts, evidence paths, findings, missing source and next step. Keep raw logs in artifacts; open only the relevant range when investigating a failure. Interactive CLI completion comes from that checkpoint, not from the TUI exiting.
- Validate fresh evidence at the actual HEAD/fingerprint. A baseline already recorded for unchanged files remains evidence. Re-run affected checks for a changed diff or new finding; expand to broader checks when shared behavior changed or the task's DoD requires them. Never reuse stale evidence, drop required tests or call a worker's claim verification.
- Independent review still applies to each Ship task. For point 1/2, captain performs the single independent read-only review with adversarial-review after worker completion; it is a different agent from the author. Do not add a third model session by default. For point 3/4 (and exceptional 5), dispatch one dedicated reviewer; captain validates scope/evidence/delivery rather than repeating that review. Re-score to the heavier profile if the actual diff changes shared contracts/state.
- Correction review examines the correction and its affected contracts; unchanged portions retain the original review and matching fingerprints. Do not restart the whole review/spec/baseline ladder for a scoped attributes or launcher fix. For point 1/2, target one worker pass and one captain review/delivery checkpoint. This never permits hiding findings or skipping task-required checks. The same causal finding twice still stops downstream work and escalates.
- Record actual model/effort, model-call/round counts where available, and usage by phase. Separate cached input from fresh input and avoid counting reasoning twice. Count the current main-chat captain once, include separate coordinator/bridge usage in historical comparisons, and never hide overhead or infer quota savings from raw tokens.
- CLI/auth/permission/MCP startup checks belong to runtime setup. Reuse successful evidence until configuration, checkout binding or runtime changes. Do not repeat setup probes inside every implementation assignment or change global settings while another launch is using them.
- If a runtime cannot wait without periodically returning control to a model, record that limitation. A prompt saying “sleep” does not create a scheduler or guarantee zero waiting overhead. Do not claim an autonomous callback after the main session ends unless the adapter actually provides it.

## Task model selection

The user authorizes the captain to choose worker/reviewer model and effort per task in this workflow, without asking for each dispatch. This does not launch a run or expand task, delivery or spending permissions. Respect explicit model pins and budget ceilings; check the current tool's supported models and efforts instead of assuming names remain available.

Read [task-scoring](task-scoring.md) before assigning worker/reviewer models. It defines the user's **1–5 scale**, evidence-based criteria, the normal ceiling of 4, the exceptional level-5 gate, examples and runtime fallbacks. Do not reuse the superseded summed 0–10 scheme.

### Platform mapping and launch

| Runtime | Mapping policy |
|---|---|
| Codex | Use the user's scale: 1 Luna, 2 Terra/medium, 3 Terra/high, 4 Sol/high, 5 Sol/max or Astra/high. Resolve actual exposed IDs/efforts and apply only documented fallbacks; never invent a Terra alias. |
| Antigravity (AG) | Model mapping is pending the user's later input. Score tasks, retain the quality-first preference as context, but do not choose or infer a mapping yet. |
| Other models/runtimes | Mapping is pending the user's later input; do not extend the Codex mapping by assumption. |

- Detect launch and model/effort controls for the **selected adapter**; nested-agent support is not required. Available native tools do not override the workspace interactive CLI requirement. If effort cannot be set, record `effortControl: unavailable` and the requested reasoning depth in the brief; this does not establish an enforced effort setting. If model selection is unavailable, record the inherited/configured model when known and report the limitation. Hold launch if a required pin cannot be honored.
- Only when the user explicitly selects Codex's native adapter, pass both `model` and `reasoning_effort` at spawn. Overrides require `fork_turns: "none"`; a full-history fork inherits the parent and cannot accept overrides. For interactive CLI, verify supported model/effort flags with local `--help` and use `ide-adapters.md`. Prefer a self-contained brief with relevant evidence, document paths and permissions over copying the whole chat.
- If a preferred choice is unavailable, record an allowed fallback within the user's constraints; escalate when none exists. Quality-first does not imply unlimited quota, higher concurrency or permission to change plans/account settings. The user's pool preference is not a verified claim about subscription capacity.
- Record the score and dispatch fields defined in `task-scoring.md`. Keep requested settings distinct from confirmed settings; do not claim a model or effort ran from a role label or prompt alone.
- Concrete failure/review findings can justify rescoring within the user's constraints; fix missing evidence/brief first. Level 5 requires its defined gate, not an automatic upgrade after failure. Preserve bounded retry/stop rules; a stronger model does not answer unresolved requirements.
- Do not assume a follow-up changes an existing agent's model; Codex's current follow-up cannot. If replacement is needed, stop the old worker, confirm it no longer writes, and continue with the same worktree/checkpoint. Do not create competing writers or redo accepted work. Report the escalation directly to the user.

## Questions and user steering

- Workers send questions to the captain. The captain resolves factual or already-decided points from the brief, code and recorded answers first.
- For an unresolved material decision, the captain in the main chat loads `<workspace>/.agent/interview-me/SKILL.md`, checks existing answers and asks the user the smallest resolving question directly. Include inspected evidence, the exact uncertainty and affected/held tasks. Continue independent authorized work; silence is not a decision.
- Persist the user's answer in acceptance criteria and the run checkpoint, then send it directly to affected workers and update their briefs. Resume affected tasks only within existing authorization. No repeated confirmation or second interview for an answered point.
- User messages and scope changes travel user → main-chat captain → affected workers; questions/results return worker → main-chat captain → user when needed. Record changed dependencies/checkpoints. Routine conversation or status requests do not cancel or resume a paused run.

## Resume and stop

- After the task is verified, merge its worker branch into the recorded parent work branch, verify the integrated result, then delete the merged worker branch under recorded cleanup authorization. Confirm no writer/dirty/unmerged work remains; use safe deletion, never force. If a linked worktree still holds the branch and directory removal is not authorized, preserve it by detaching at the landed commit before deleting the local branch. Remote branch deletion applies only to published worker branches with cleanup authorization; never retire the parent work branch or merge-ci. Do not integrate or clean up during a user pause.

- On explicit resume, the main-chat captain reads the artifacts and reconciles workers/worktrees before dispatch. Follow up existing workers where appropriate; do not resume a legacy captain subagent or create duplicate supervisors/task worktrees.
- Reuse verified checkpoints whose recorded HEAD, artifacts and delivery state still match. Run fresh checks only when changes or unresolved findings justify them; continue from the next ready task.
- An explicit stop goes directly from the main-chat captain to workers/reviewers. Preserve/report their checkpoints. Teardown/discard is separate authorization.
- If the required worker adapter cannot launch workers, report that limitation and hold delegated execution. Do not silently substitute another adapter or implement tasks in the main chat.
