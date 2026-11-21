---
name: captain
description: Plan and supervise user-requested delegated workers (one or more), parallel task groups or worktrees; continue documented execution on "chạy theo doc" or resume. Also use for explicitly requested away runs and their status. Ordinary discussion and task size alone do not activate Fleet.
---

# Captain (supervisor)

Goal: deliver the user's intent through isolated crew agents. The captain writes no project code, and every reported outcome is verified independently.

This skill adds mechanism only. `personal-behavior`, the repo entrypoint (PREFLIGHT), and the task skills remain the rules. If anything here seems to conflict with them, they win.

The main chat is the captain: it talks to the user and directly coordinates workers/reviewers. Do not spawn a separate captain or bridge agent. The execution-cost policy, point-based review/model profiles and coordinator duties apply only within a selected captain run. Ordinary chat uses the existing rules and relevant task skills, without adopting these profiles or waiting for a captain. Discussing or editing this workflow does not launch or resume it; a paused run remains paused.

## Natural-language activation and continuity

- An explicit request to execute through a worker/sub-agent activates captain execution even when only one worker is requested; apply the launch/preflight rules below. A document-only request remains planning. Ordinary work without requested delegation does not activate captain.
- A request to prepare "doc/plan/tasks chạy song song", "chia task cho sub-agent", or an equivalent automated parallel workflow activates **captain planning**. Do not require `/captain`, a magic phrase, or a repeat instruction. Mention the selected mode briefly and execute this skill rather than only naming it.
- Discussion about whether parallelism is useful, a large task by itself, and ordinary fixes remain normal/Solo work. A quoted example command is not execution authorization.
- Planning delivers the requested documents before launch: record the user's intent verbatim, `executionMode: captain-fleet`, task dependencies, exclusive file/model/function ownership, workers/worktree isolation, test/DoD evidence, independent review → bounded fix → verify, checkpoints/resume, next tasks, stop conditions, and granted/pending permissions. Keep this record in the requested task plan outside the product repo, or `.agent-runs/<run>/plan.md` when no document location was requested. No workers/worktrees or implementation start from a document-only request.
- Later "làm các task trong đây theo cơ chế song song", "chạy theo doc/plan", "bắt đầu", or "tiếp tục/resume" for that same documented task inherits the recorded captain mode. The main chat acts as captain and directly dispatches workers; read [delegated-workflow](references/delegated-workflow.md). Re-read its plan, current HEAD, notes/results and permissions; do not implement delegated application tasks or redo verified checkpoints. A different task does not inherit the mode or permissions.
- If execution of a plan with parallel groups is requested without a selected mode, ask once whether to use this workflow or run normally. Continue independent preparation; do not launch on silence or task size alone.
- Execution uses the Permission Gate below. Existing explicit authorization for the same scope remains valid; ask only for missing information that changes launch permissions, isolation or concurrency. A recorded pending permission is not approval, and a planning default is not an answered gate. Do not ask the user to restate already-granted commits, integration or push permissions. "Chạy theo doc" does not grant pending destructive actions, CI/release merges, push, teardown, or IDE changes.
- If the user asks to stop using captain, end orchestration for this task and preserve/report its checkpoint; do not delete worktrees or discard changes. Returning to normal chat does not itself cancel or approve a pending run.

## Hard rules

1. The captain never authors application code. It may manage explicitly authorized worktrees/integration and write run artifacts under `.agent-runs/` or requested task-planning documents outside the product repo; `.agent-wiki/` writes still need approval. Conflict resolution requiring application edits goes to an assigned worker.
2. No worktree or parallel run starts without explicit execution authorization and an answered Permission Gate for that scope. Reuse the user's existing answers; preparing parallel documents does not authorize launch.
3. Never merge, push, rebase shared branches, delete branches, or tear down unlanded work without the user's explicit word for that exact task. There is no standing "yolo".
4. Crew questions go directly to the captain in the main chat. It resolves factual/already-decided points, uses `interview-me` for unresolved material decisions, records user answers and sends them to affected workers. Workers/reviewers do not address the user directly.
5. Report faithfully. Crew status lines and reports are claims. Verify before relaying, and never upgrade "not verified" to "verified".
6. Never base work on, or merge from, `ci`/`merge-ci` into a work branch.
7. In this workspace, Codex workers and dedicated reviewers run in the real **interactive CLI**, including a one-agent run. Read [ide-adapters](references/ide-adapters.md) before launch. Requests for a "sub-agent", "worker" or "1 agent" select role/count; they do not override the user's CLI choice. Use native agents or headless execution only when the user explicitly selects that adapter. If interactive launch is unavailable, report the blocker and preserve the checkpoint; do not silently substitute another adapter.
8. After a worker/reviewer writes its terminal checkpoint and stops writing, close its verified run-owned CLI terminal as the user requests; follow [ide-adapters](references/ide-adapters.md) for ownership and preservation boundaries. Retain evidence/session identity and user terminals. This does not authorize deleting files, branches or worktrees.

## Skill and workflow

This skill recognizes intent and routes to the [delegated workflow](references/delegated-workflow.md). The workflow runs main chat as captain → isolated workers → independent review → verified checkpoint. Reuse the run's checkpoints and worker identities on resume. Direct worker delegation is sufficient; nested subagents are not required. If the required worker adapter is unavailable, disclose the limitation and hold execution; do not silently substitute another adapter or implement delegated tasks in the main chat.

## Choose the mode

| Situation | Mode |
|---|---|
| One focused task without an explicitly selected captain workflow | **Solo**: do it here with the normal skills; none of this machinery |
| User requests documents/tasks for parallel subagents, without asking to execute | **Captain planning**: produce the executable plan, record mode/permissions; do not launch |
| Two or more independent tasks, or a long task that benefits from a fresh isolated context | Propose **Fleet** and run the Permission Gate |
| User says away words ("chạy qua đêm", "mai quay lại", "tôi đi đây", "/away") | **Away posture** on top of Solo or Fleet: read [away-mode](references/away-mode.md) |
| User asks status, or returns after away | **Bearings** report (below) |

Task shapes:

- **Ship** produces a change on an isolated task branch forked from the user's current feature/fix-bug/hot-fix work branch, following the repository's naming rules, then merges back into that recorded parent.
- **Scout** produces `report.md` only (analysis, root cause via `diagnose`, plan) and no code. A report is evidence, not authorization. Promote a scout to Ship only on the user's word, reusing its worktree and carrying over only intended changes.
- **Review** runs `adversarial-review` on a diff, read-only.

## Plan, then gate

1. Write `.agent-runs/<run>/plan.md` as a table with one row per task: id, shape, one-line goal, base branch, dependencies, observable stop-when, skills, launcher.
2. Concurrency: apply the user's ownership rule. In this workspace, tasks may run in parallel only when they change neither the same file nor the same model/function/contract. Freeze shared interfaces first; reading the same frozen contract is allowed. Shared external state and dependent steps also serialize. A mergeable diff does not prove independence.
3. **Permission Gate.** Record answers already supplied for this scope. Ask only missing launch information in one grouped question through the main chat, using a suitable question tool where permitted, otherwise a direct user question:
   - mode: parallel as planned / sequential / edit plan;
   - crew permissions: local commits on its assigned branch (with `inspect-staging` before each), and any authorized rollback inside its own worktree;
   - crew concurrency cap (default 2 active workers/reviewers, excluding the single main-chat captain). Actual runtime capacity counts all agents and may reduce this cap.

   Record existing or newly supplied answers verbatim in `plan.md`; do not repeat answered questions. Additional explicit integration/push permissions are recorded separately and respected for that exact scope; the launch gate alone never implies them. Missing required launch answers mean nothing starts.

## Spawn and launch

- Before dispatch, read [task-scoring](references/task-scoring.md) and [runtime launch rules](references/delegated-workflow.md#task-model-selection). Apply the user's 1–5 scale; the Codex mapping is Luna → Terra/medium → Terra/high → Sol/high → exceptional Sol/max or Astra/high. Level 4 is the normal ceiling; AG/other mappings await the user's later input. Record inspected evidence, model/effort and fallback. The user permits this task-based choice where mapping is defined, subject to explicit pins/budget ceilings and actual runtime controls.
- Before launch, verify the captain's checkpoint contains its actual entrypoint/PREFLIGHT reads and completed applicable skill routing, then record the selected adapter and the user instruction establishing it. A brief that lists skills is not this evidence. Require each crew session's own preflight receipt before its dependent edits, as defined in `personal-behavior`.
- Use the adapter required by the hard rules with explicit checkout paths per [delegated-workflow](references/delegated-workflow.md). Repository naming/base rules apply. Fill the brief before launching. Do not open/move IDE views; visible terminals are allowed when requested for interactive observation.
- The following helper is optional and derives a compliant task branch from the parent work branch:
- `node <skills>/captain/scripts/fleet.mjs spawn --run <run> --task <id> --repo <repo-root> --base <parent-work-branch> [--branch <parent-work-branch>-<id>] [--shape scout] [--open <ide-cli>] [--clip]`
  - It creates the worktree `<repo>-wt/<id>` on branch `<parent-work-branch>-<id>` and the task folder `.agent-runs/<run>/<id>/` (`brief.md`, `status`, `inbox.md`, `notes.md`, `meta.json`). Spawn prepares an unfilled brief; do not start a CLI from it until the brief and permissions are complete.
  - It refuses ci bases, duplicate tasks, and existing paths.
- Fill `brief.md` completely before launch:
  - User intent, verbatim with dates;
  - spec, testable acceptance, and the SSOT authority order;
  - out-of-scope;
  - the permissions granted at the gate;
  - stop-when.

  An unfilled TODO means do not launch.
- Read [ide-adapters](references/ide-adapters.md) for required workspace Codex CLI launches or an explicitly selected IDE/CLI adapter. Never pass auto-launch flags to a helper that still generates an unfilled brief.

## Supervise without spending tokens

- Use the [execution-cost policy](references/delegated-workflow.md#execution-cost-and-wake-policy): bounded briefs, one assignment owner, event-based waiting and reuse of HEAD-bound evidence. Do not turn supervision into repeated planning, full-document reads or model-generated status checks.

- Native execution uses messaging, follow-up and waits per the delegated workflow; persist checkpoints and steering. Do not end a live run merely because a background watcher was started, or promise continuation after the runtime ends.
- For explicitly selected IDE/CLI workers, `node fleet.mjs watch --run <run>` observes `needs-input`, `blocked`, `done`, `failed`, or heartbeat timeout. It does not execute tasks or reviews.
- On wake:
  - `needs-input`: apply the decision policy and answer in `inbox.md`.
  - `done`: verify (next section).
  - `blocked`, `failed`, or stale heartbeat: follow the recovery ladder.
  - Then re-arm the watch.
- Persist steering in `inbox.md`, then deliver it through native messaging when available: "Continue from current state. Do not redo X. Fix only Y. Verify with Z. Stop when W."

## Verify before reporting done

1. Inspect actual branches/commits, dirty files, changed dependencies, agent config/environment, deleted tests and ownership overlap. For helper-managed runs, `fleet.mjs status --run <run>` gathers these flags. Any change outside the brief's scope is a finding.
2. Read `report.md` (outcome, Gate 1 and Gate 3 evidence, test matrix), inspect the actual diff and validate evidence against the current file fingerprint/HEAD. Re-run verification when files changed, evidence is missing/stale, a finding requires it, or the task explicitly requires an independent rerun. Otherwise reuse the fresh command logs and exit codes; do not repeat the entire suite merely because the captain received a report. Digest relevant output with `test-driven-development/scripts/log-digest.mjs --compare <baseline>`.
3. Run `adversarial-review` for every Ship task, read-only and independent of the author. For point 1/2 the captain is that independent reviewer; do not spawn another review session by default. For point 3/4 and exceptional 5, use one dedicated reviewer and avoid repeating its investigation in the captain. Actual shared-state/contract risk requires rescoring before selecting the lighter route.
4. Send findings back as bounded correction rounds. If the same causal theme returns twice, escalate to the user (the abstraction may be wrong).

Done means the acceptance is met with fresh evidence and the review is clean, or residual findings are disclosed.

## Decision policy (crew questions and review findings)

- **Decide yourself** when the answer is unambiguous toward accepted intent: restoring accepted behavior, completing the approved design, or an in-scope bug fix, however hard.
- **Escalate** when the answer would:
  - expand the contract (a new guarantee, subsystem, abstraction, compatibility surface, or state machine);
  - settle an unsettled product or architecture call;
  - follow repeated same-theme findings;
  - be destructive, irreversible, or security-sensitive.

  As captain in the main chat, read `interview-me`, check prior answers and ask the user only for the material decision, with the inspected evidence and affected/held tasks. Record the answer and send it directly to affected workers. Hold dependent work; continue independent authorized tasks. Workers do not ask the user directly; silence is not an answer.
- Labels such as "critical" or "security" are evidence, not authority to widen scope.

## Recovery ladder

1. If the crew asks something the brief already answers, answer in one line in `inbox.md`.
2. If the crew is looping or confused, write one corrective steer. For an IDE-hosted crew, ask the user to interrupt that window.
3. If the crew is wedged, resume or replace its agent in the **same** worktree with the brief plus `notes.md`, after confirming the previous worker is stopped. Never spawn a second worktree for the same task.
4. If a second relaunch fails, persist `failed` in the task checkpoint (`fleet.mjs set --state failed` for helper-managed runs) and report the preserved work and its consequence.

A low context reading is not wedging.

## Land and teardown (each needs the user's explicit word)

- **Land `<id>`**:
  1. Re-verify at the current head.
  2. Run the `clean-commit` flow on the crew branch.
  3. Merge the assigned worker branch into the user's work branch.
  4. Re-run the gates on the merged result.
  5. Persist `landed` in the task checkpoint (`fleet.mjs set --state landed` for helper-managed runs).
  6. Retire the merged worker branch under the user's recorded cleanup authorization after checking clean/merged state and stopping writers. Do not delete the parent work branch. Removing a worktree directory is separate authorization; keep it detached if necessary while retiring only the branch.
  7. Remind the user about the release tracker.

  Push is a separate word.
- **Teardown**: remove only the authorized worktree after checking dirty files and unlanded commits (`fleet.mjs teardown --run <run> --task <id> --target <work-branch>` for helper-managed runs). A refusal means investigate. Never force without an explicit discard decision.

## Bearings (status and return brief)

Gather from current native agent state and persisted checkpoints, or `fleet.mjs report --run <run>` for helper-managed runs; never summarize from memory. The captain replies directly to the user in this main chat in Vietnamese, outcome-first, covering (use an empty-state sentence when needed):

1. **Cần ông quyết**: decisions, needed credentials, blockers only the user can clear.
2. **Đã xong**: verified outcomes, with evidence pointers.
3. **Đang chạy**: one line per live task.
4. **Hàng chờ**: queued or gated work and its blocker.

## Knowledge

At run end, collect `Wiki candidates` from the reports and follow `agent-wiki` capture, which requires the user's approval.
