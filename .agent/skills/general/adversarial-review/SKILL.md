---
name: adversarial-review
version: "1.0.0"
released: "2026-11-21"
description: >
  Performs independent, read-only adversarial diff review in a fresh isolated session before
  merging any MR: hunts acceptance gaps, negative paths, blast radius, test integrity, and
  deflection, auto-merging on clean or escalating after 3-4 failed sessions. Not for authoring
  production fixes (use engineer).
---

# Independent Adversarial Review & Autonomous MR Gate

Find every way a finished change fails the accepted intent before the Director does. The reviewer is **strictly read-only** and **independent of the author**.

## Mandatory Session Isolation (`1 Round = 1 Fresh Session`)

- **Fresh session per round:** Every review attempt MUST spawn a **brand-new subagent session** (`invoke_subagent`, never `send_message` to reuse a prior reviewer). Never assume the author's or Producer's preflight transfers — read `PROJECT.md`, `STYLE_ANCHOR.md`, and `.agent/PREFLIGHT.md` directly.
- **No hanging reviewers:** As soon as a review session returns its verdict, `producer` terminates completed subagents (`manage_subagents`) so no review bot lingers in waiting state.
- **Proportional depth:** For `Point 1` trivial edits, `producer` may review directly if it did not author the change; for all `Point >= 2` MRs, spawn a dedicated read-only reviewer (`ROLE: qa`).

## Inputs

1. **Accepted Contract:** The Director's verbatim request, locked `documents/<Project Name>/overview-*.md`, and relevant `departments/01..06` + `registry.yaml` specs.
2. **Ground-Truth Diff:** `git diff <base>...HEAD` plus any uncommitted working-tree status (`git status -sb`).
3. **Author Report as Claims Only:** Treat every worker claim as a hypothesis to verify, never as proof.

## 8-Point Adversarial Hunt (Check Every Item)

1. **Acceptance Coverage:** Locate the concrete test or direct runtime observation proving each requirement. Missing or indirect proof is a finding.
2. **Negative & Boundary Paths:** Invalid/empty inputs, timeout/offline fallbacks, race conditions, stale async responses, mid-walk/mid-state transitions, and `F5` reload recovery.
3. **Blast Radius:** Trace changed symbols, shared types, `registry.yaml` consumers, WebSocket payloads, props, and DOM/scene hierarchy for silent caller breakage.
4. **Test Integrity:** Flag deleted/skipped tests, `.only`, loosened assertions, tautological mocks of the unit under test, or test-only branches in production code (`blocking` unless explicitly approved).
5. **Deflection Check:** Reason concretely (or spot-check) whether each primary test would genuinely fail if the production logic were reverted.
6. **Scope & Hygiene:** Catch out-of-brief files, unapproved dependency/lockfile drift, leaked `.env`/runtime caches, inline HTML styles/scripts, or files exceeding project line limits (`<= 300` lines when active).
7. **Rule & Evidence Honesty:** Verify typecheck, test suite, `check-sync.mjs`, and `inspect-staging.mjs` outputs (use `log-digest.mjs` on long logs). Never accept claims of visual/browser feel without real observation.
8. **Evidence Freshness:** Every verification result must match the exact current `HEAD` commit, never an earlier SHA.

## Output Format

```markdown
Verdict: clean | changes-required (Round <N>/4)

| id | severity | finding | evidence (file:line / command digest) | bounded correction |
|---|---|---|---|---|
```

- **Severity:** `blocking`, `major`, `minor`, or `nit` (`clean` requires zero `blocking`/`major` and zero unaccepted `minor` defects).
- Post the review report onto the GitHub MR via `node <workspace>/.agent/tools/gh-studio.mjs comment`.

## Autonomous Merge, Issue Closure & `3–4` Round Escalation (`Producer`)

1. **If `Verdict: clean`:** `producer` merges the MR into `main` automatically (`node <workspace>/.agent/tools/gh-studio.mjs mr-merge --repo <owner/repo> --pr <num> --delete-branch --json`) and verifies all completed GitHub Issues are **closed** (`gh-studio.mjs close --repo <owner/repo> --issue <id>`).
2. **If `Verdict: changes-required` (Rounds `1..3`):** Dispatch bounded fixes to the owning role (`engineer`/specialist), push to the MR branch, and spawn a **brand-new independent `adversarial-review` session** for the next round.
3. **Circuit-Breaker (`3–4` Failed Sessions):** Stop retrying and **do NOT merge**. Close/reject the broken attempt, report the recurring failure root cause to the Director, re-audit and update `documents/<Project Name>/overview-*.md` (`status: draft`) for Director sign-off, and trigger a clean re-implementation.

## Gotchas

- **Reusing the same reviewer chat across rounds.** Re-messaging Round 1's subagent biases Round 2 toward confirming only its previous notes while missing regressions introduced by the fix. Always spawn a fresh session.
- **Editing files during review.** Reviewers never touch repo files (`denyAll: true` in `write-guard.mjs`).
