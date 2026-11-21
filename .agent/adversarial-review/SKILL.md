---
name: adversarial-review
description: Use to validate a finished change before calling it done - after a crew reports done, before landing a branch, or when the user asks for an independent or adversarial review of a diff.
---

# Adversarial review

Goal: find every way the change fails the accepted intent before the user does. The reviewer is read-only and independent of the author. Run it in a separate session or subagent so the author's context does not bias it.

Before reviewing, read the actual repository entrypoint, workspace personal-behavior and applicable `.agent/PREFLIGHT.md`; execute its routing and record preflight/MCP evidence. Do not assume the author's or captain's preflight transfers to this session. Within a selected captain workflow, keep the review proportional to actual risk and the scored assignment: for a point-1/2 change the captain can be the independent reviewer because it did not author the change; point-3/4 changes use a dedicated reviewer. Re-score when shared contracts/state raise the risk; a low score never waives acceptance or required checks. Outside captain, retain this skill's normal review procedure; do not introduce task scoring or captain delegation.

## Inputs

- The accepted contract: the brief's User intent (verbatim) and Acceptance, or the user's request.
- The diff: `git diff <base>...HEAD` plus uncommitted changes.
- The author's report as **claims to check**, not as evidence.

## Hunt (check each)

1. **Acceptance coverage.** For each criterion, find the test or observation that proves it. Missing or indirect proof is a finding.
2. **Negative and boundary paths.** Invalid or missing input, errors and recovery, races and stale responses, state transitions, multi-mode paths.
3. **Blast radius.** Re-trace changed symbols with the semantic MCP (references, call hierarchy). Look for unchanged callers whose behavior shifts, contract changes (props, return values, request bodies, DOM structure), and default changes that are not opt-in.
4. **Test integrity.** Look in the test diff for deleted or skipped tests, `.only`, loosened assertions (exact to partial, truthiness, wider tolerance), updated snapshots, mocks of the unit under test, and test-only branches in production code. Any of these without a stated, approved reason is blocking.
5. **Deflection check.** For each primary test, would it fail if the production change were reverted? Reason concretely, or spot-check by stubbing when cheap.
6. **Scope.** Look for files outside the brief, dependency or lockfile changes, agent config, env files, and parallel code paths the brief excluded.
7. **Rule compliance.** Gate 3 evidence present (typecheck, MCP diagnostics, focused and full suite vs baseline); no claim of browser verification without observation; `mr-review-fix` rules for review-driven edits; React rules via `RULES_INDEX.md` when relevant.
8. **Evidence freshness.** Results must match the current head, not an earlier one.

Run read-only checks (typecheck, tests) if the environment allows, and digest the logs with `log-digest.mjs`.

## Output

| id | severity | finding | evidence (file:line / command digest) | bounded correction |
|---|---|---|---|---|

- Severity is `blocking`, `major`, `minor`, or `nit`.
- Verdict: `clean` or `changes-required`.
- Findings are hypotheses. The author verifies each one before changing code, and the captain applies the decision policy to findings that would expand scope.
- Never edit code. Never pass a change whose proof you could not see.
