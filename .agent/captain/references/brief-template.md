# Brief {{RUN}}/{{TASK}} ({{SHAPE}})

Created {{CREATED}} by captain in the main chat. Crew: follow this brief and `{{SKILLS}}/crew/SKILL.md`. Send questions/checkpoints directly to that captain; never address the user directly or create another bridge/coordinator.

## User intent (verbatim - this is the acceptance contract; never widen it)

> TODO captain: paste the user's exact words for this task, including later clarifications with dates.

## Spec (captain)

- Goal: TODO one observable outcome.
- Acceptance (testable, include negative/boundary/error paths):
  - AC1: TODO
  - AC2: TODO
- SSOT and authority order (highest first): TODO e.g. OpenAPI > confirmed-decisions doc > BA doc > current source. Read these before code.
- Out of scope: dependency changes, architecture changes, agent config, unrelated files, CheckoutPageNew-style parallel paths unless named here, push, merge, rebase of shared branches.
- Assigned skills after mandatory preflight routing: TODO e.g. analyze-requirements, test-driven-development (batch mode), diagnose. The list never overrides applicable PREFLIGHT routing.
- Point/profile: TODO score 1–5, actual risk rationale, model/effort and light (1/2) or dedicated-review (3/4/5) path.

## Mandatory preflight

Read the actual repo entrypoint, workspace personal-behavior and active `.agent/PREFLIGHT.md`; execute its applicable skills before dependent actions. Record paths read, routing, branch/scope rules and actual MCP result or supported fallback in the checkpoint. Read relevant source sections once; no full library/history load.

## Isolation assertion (check first, every session)

- `git rev-parse --show-toplevel` must equal `{{WORKTREE}}` and `git branch --show-current` must equal `{{BRANCH}}`.
- Parent work branch: `{{BASE}}` @ `{{BASE_SHA}}`. This task branch forks from that parent; captain integrates back into it and retires the worker branch after verified landing under recorded cleanup permission.
- If either differs: do nothing else; run `node {{FLEET}} set --run {{RUN}} --task {{TASK}} --state blocked --msg "isolation check failed"` and stop.

## Permissions granted at the Permission Gate

- Local commits on `{{BRANCH}}`: TODO yes|no. If yes: stage explicit paths only and run the clean-commit `inspect-staging.ps1` before every commit; never include agent config.
- Rollback inside this worktree (`git restore` / `git reset --hard` to your own last good commit): TODO yes|no.
- Never: push, merge, rebase onto or from shared branches, delete branches, touch the primary checkout `{{REPO}}`.

## Protocol

- Status (state changes only): `node {{FLEET}} set --run {{RUN}} --task {{TASK}} --state <running|needs-input|blocked|done|failed> --msg "<one line>"`.
- Inbox: read `{{TASK_DIR}}/inbox.md` at every checkpoint (after each slice, before declaring done). Mark handled items `[x]`.
- Notes: keep `{{TASK_DIR}}/notes.md` current (test matrix, red/green digests, decisions, next step) so a relaunch resumes without re-exploring.
- Questions: write them under `## Questions` in report.md, set `needs-input`, then continue any unblocked slice or stop.
- Logs: save raw logs under `{{TASK_DIR}}/logs/` as UTF-8 and read them only through `log-digest.mjs`.

## Stop when

- TODO observable condition, e.g. "AC1-AC3 tests green, full unit suite has no new failures vs baseline, typecheck clean, report written".
- Away posture rounds cap (if active): TODO n slices; stop after 3 consecutive failed slices.

## Report (`{{TASK_DIR}}/report.md`)

- Outcome: one line.
- Preflight evidence, point/profile and actual runtime identity.
- Changed files.
- Gate 1 evidence: required behavior, causal path/root cause, caller map (MCP used or fallback reason).
- Test matrix and red/green digests (batch TDD), baseline comparison.
- Gate 3 results: typecheck, MCP diagnostics, focused and full suites.
- Browser verified: yes (evidence) | no.
- Open risks and Questions.
- Wiki candidates (facts worth keeping; captain decides).

Base: `{{BASE}}` @ `{{BASE_SHA}}` · Repo: `{{REPO}}`
