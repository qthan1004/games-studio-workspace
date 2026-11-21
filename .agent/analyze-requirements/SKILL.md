---
name: analyze-requirements
description: Establish an evidence-backed behavioral contract before implementing a feature, behavior fix, or review-driven change, and for requested requirements analysis.
---

# Analyze requirements

Goal: turn the user's request and available evidence into a testable behavioral contract that can guide implementation.

Constraints:
- Match the requested deliverable. SDD shapes the analysis, but does not require a separate spec file, interview, or task plan for every request.
- Inspect relevant code, tickets, or documents before asserting current behavior.
- Distinguish current behavior from intended behavior, scope from non-goals, and facts from assumptions. Identify affected actors, flows, contracts, invariants, and meaningful failure or boundary cases.
- Make acceptance criteria observable and derive test scenarios from them, including relevant negative paths and regressions. Do not leave product decisions to be invented during coding.
- For each material behavior rule, identify its source: user instruction, verified contract, or established invariant. Existing code proves current behavior; a reviewer suggestion, similar provider, or report is a hypothesis until checked.
- If clearing or disabling inputs, changing defaults, or adding provider-specific behavior, inspect all affected event paths and state owners. Separate switching a selection from typing in the selected state; include timeout, retry, and manual recovery when present.
- If a missing decision would change correctness, data retention, scope, or business behavior, read [interview-me](../interview-me/SKILL.md) and hold the dependent edit until answered. A routine reversible implementation choice may use a stated assumption.
- Save a document only when the user asks for a file or the task requires a durable artifact.

DoD: the result states the goal, scope, sources for intended behavior, and testable acceptance and regression scenarios. Analysis can report open decisions; implementation readiness requires that no material business decision remains unresolved. A compact contract in the conversation is sufficient for a small fix.

Use [spec-driven-development](../spec-driven-development/SKILL.md) when a shared or durable specification is needed, and [planning-and-task-breakdown](../planning-and-task-breakdown/SKILL.md) for a requested implementation plan. Do not automatically turn analysis into a three-phase approval workflow.
