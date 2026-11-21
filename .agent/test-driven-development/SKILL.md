---
name: test-driven-development
description: Implement behavior changes and bug fixes with test-first feedback and risk-appropriate regression coverage.
---

# Test-driven development

Goal: deliver the requested behavior with executable evidence that the change works and nearby behavior remains intact.

Constraints:
- Derive tests from the requirement or spec before implementation. For a bug, capture the failing regression; for a feature, make the expected behavior fail for the right reason before coding. Then make it pass and refactor without weakening assertions.
- Resolve material product decisions before encoding an expectation. A test derived from an unconfirmed guess cannot establish correctness; use `analyze-requirements` and `interview-me` when needed.
- Choose the smallest test level that proves the behavior, and add integration or interaction coverage where unit tests cannot expose cross-component failures. Do not skip tests merely because a module has none yet.
- Cover meaningful alternatives, not just the happy path: boundaries, invalid or missing inputs, error and recovery paths, state transitions, and affected callers or side effects as the change warrants. Prioritize the paths most likely to break or harm users; do not add arbitrary cases solely to reach a count.
- Assert observable behavior and important invariants. Avoid tautological mocks, snapshots that cannot detect a regression, and tests tailored only to the implementation shape. Preserve existing tests; do not silence or weaken failures to reach green.
- For a shared form change handler, test a sequence: select/switch, type repeatedly in the same selection, and exercise recovery/manual entry when present. Assert retained values and ability to complete the flow, not only reset calls or a provider predicate. Test unchanged providers/callers where the handler is shared.
- Run the focused tests and relevant broader checks after the change. If a true red phase or automated test is infeasible, state the concrete reason, use the closest meaningful verification, and report the remaining risk rather than claiming full TDD.

## Batch mode (default for multi-slice, doc-driven, or crew work)

Batch mode changes the rhythm, not the rules above. It is stricter about evidence.

1. **Test matrix first.** Before production code, write a table: test id → acceptance criterion or regression → level (unit/integration/UI) → file → exact observable expectation.
   - Every acceptance criterion has at least one test.
   - Every test traces to a criterion, a regression, or an affected caller.
   - Include negative, boundary, error/recovery, state-transition, and caller cases the change warrants.
   - Keep the matrix in notes or the task's TDD doc.
2. **Baseline.** Before writing tests, run the suites the repo requires and save a digest.
3. **Write the batch, then prove red.** Write all tests for the slice (or the whole batch), then run them once.
   - Each new test must fail for the intended behavioral reason. A failure caused by an import, compile, setup, or fixture error is not red.
   - A test that passes before the change is invalid unless it is labeled as a guard or characterization test.
   - Record the red digest.
4. **Freeze.** After red, the matrix and its assertions are frozen. Adding tests is allowed. Deleting, skipping, or loosening a test requires the user's approval with a reason. Loosening includes: exact to partial matching, truthiness checks, wider tolerances, dropped awaits or expectations, snapshot updates, and replacing behavior assertions with call counts.
5. **Green minimally, slice by slice.** After each slice, run the focused tests and the full suite the repo requires. Compare with the baseline using `log-digest.mjs --compare`. New failures block the next slice.
6. **Anti-deflection before done:**
   - For each criterion's primary test, show that it would fail without the production change (temporarily revert or stub when cheap, otherwise reason concretely from the assertion).
   - Assertions check exact payloads, state, or DOM, not only that something was called.
   - Mocks sit only at boundaries; never mock the unit under test.
   - No test-only branches in production code.
7. **Quiet execution.** No per-micro-step narration. Record the matrix, red digest, green digest, and baseline comparison in notes or the report.

Logs: save raw output as UTF-8 files (`<cmd> 2>&1 | Out-File -Encoding utf8 <file>.log`). Read them only through `node <skills>/test-driven-development/scripts/log-digest.mjs <file> [--compare <baseline>]`. Never open a raw log over 200 lines.

DoD: relevant tests failed for the intended reason before implementation, pass afterward, cover the significant success and failure paths, and broader relevant checks pass or have an explicit limitation.
