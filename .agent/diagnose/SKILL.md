---
name: diagnose
description: Use before scoping or fixing a reported bug, regression, or unexplained behavior, and before acting on someone else's root-cause report.
---

# Diagnose

Goal: identify the real cause of a reported problem with evidence that explains both the failing path and a working path. This skill sharpens Gate 1 and does not replace it.

## Upfront input & boundary triage (mandatory first pass)

1. **Check all supplied inputs and observe hands-on:** inspect every provided input (videos, screenshots, URLs/query parameters, payloads, logs, environment/login steps) before reading internal source files or writing synthetic mocks. When a live/local environment and browser/API tools exist, briefly exercise the real flow and observe actual UI, URL/params, and network responses.
2. **Predict likely failure modes:** form bounded hypotheses covering both internal code/logic faults and external caller/iframe/param/data mismatches, then check the boundary that separates them.
3. **Branch on the triage result:**
   - **Code or logic fault:** give the user a brief preliminary status update (what was observed and which narrow module/path is implicated), then continue tracing the causal path in code.
   - **Not a code fault:** report clearly to the user why the code is intact and which external input, caller/iframe URL, test payload, or environment state caused the symptom, then stop without deep-tracing healthy code.

## Establish the observed behavior

- Start from the end user's experience, not an internal error string or a guess. Record expected vs observed behavior, setup, inputs, environment, and repeatability.
- Reproduce along the real user path when feasible and safe. If that is not feasible, state the limitation and use the closest path without calling it equivalent.
- Keep three facts separate:
  - **trigger**: the event, input, or transition that starts the fault;
  - **masking condition**: the state, timing, cache, config, or path that hides or exposes it;
  - **symptom**: what the user sees.

  Do not collapse them.

## Test the explanation

- Compare the failing path with a **proven path** where the behavior works. Find the earliest meaningful divergence in inputs, state transitions, ownership, timing, and control flow.
- Read the relevant history (blame, commits, MR, dated documents as hypotheses) when it explains which invariant was intended. A recent nearby change is not causal without evidence.
- Name the smallest **counterfactual** that should flip the outcome if the explanation is true, and run it, changing one condition at a time where practical.
- Seek **disconfirming evidence**. State what observation would falsify the leading explanation, check it, and keep contradictory results.
- Use the project-scoped semantic MCP for callers and ownership. If it is unavailable, state why before falling back to text search.

## Output (report or Gate 1 note)

- Reproduction (or its limitation), trigger / masking condition / symptom, failing vs proven path divergence, history, counterfactual result, disconfirming checks, and remaining uncertainty that could change scope.
- Mark facts and hypotheses separately.
- A diagnosis is evidence, not authorization to change code. When a fix is authorized, the reproduction becomes the first failing regression test.
