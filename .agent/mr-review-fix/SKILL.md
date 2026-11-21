---
name: mr-review-fix
description: Evaluate and address MR review feedback with verified behavior, caller impact, and regression evidence before applying suggested edits.
metadata:
  author: thanhdq13
  version: "1.1.0"
---

# MR review fix

Goal: resolve valid review findings without introducing regressions in shared or adjacent flows.

1. Translate each finding into a behavior or contract claim. Verify it against current code and the requested scope; a reviewer snippet is a hypothesis, not a confirmed requirement. Use `analyze-requirements` for the contract and `diagnose` for a reported defect.
2. Before changing a shared symbol, default, or signature, inspect definitions, references, and relevant call paths with the project-scoped semantic MCP. Disclose an unavailable/unsupported operation before targeted text fallback. Check callers outside the MR diff, including alternate channels, providers, and recovery modes.
3. For a reset/disable/overwrite recommendation, establish the authorizing event and state. Separate a selection transition from repeated input while that selection stays active. Provider identity alone does not authorize discarding form data. Include timeout/manual entry and retry paths where present.
4. If a material intended behavior is unresolved, use `interview-me` and hold that edit until answered. Do not silently accept the reviewer interpretation or infer a new provider's behavior from its name.
5. Preserve existing defaults for unaffected callers. Derive context-specific flags at the caller/container that owns the context, and opt in explicitly when appropriate. Changing a default requires a confirmed requirement and inspected impact.
6. Use `test-driven-development` to prove the defect and meaningful alternatives: target behavior, unchanged callers/defaults, and affected event sequences. Include success, failure, and recovery where relevant. Do not weaken tests to fit the snippet.
7. Check diagnostics for every changed typed file, project type/lint checks as applicable, focused regressions, and a relevant broader suite. Review the final diff for unused symbols, duplicated copy, and unnecessary import/re-export indirection according to project conventions. Diagnostics do not prove the interaction works.

If the suggestion causes a regression, explain the concrete caller/event and offer the smallest supported correction with file/line evidence. Do not post an MR comment unless the task authorizes it.

DoD: each addressed finding has a supported behavioral contract, bounded caller impact, and verification against the final diff. Report held findings and missing evidence explicitly; a list of skill names is not proof.
