---
name: spec-driven-development
description: Write or refine a feature specification when the user requests a spec or the change requires a shared product and technical contract.
---

# Spec-driven development

Goal: make the intended behavior and acceptance criteria clear enough for implementation and review.

Constraints:
- Ground current behavior and technical claims in inspected code or provided sources.
- State scope, user-visible behavior, data and API contracts, invariants, meaningful edge and failure cases, and acceptance criteria only to the depth the change needs.
- Make each acceptance criterion testable; cover relevant success, rejection, boundary, state-transition, and regression scenarios rather than listing only the ideal flow.
- Link material behavior rules to user instructions, verified contracts, or established invariants. Similarity to another provider and reviewer suggestions do not confirm intended behavior.
- Mark unresolved decisions clearly. Use [interview-me](../interview-me/SKILL.md) when a missing choice changes correctness, data retention, scope, or business behavior; hold only the dependent implementation until answered.
- For stateful UI, distinguish events and transitions from persistent states. Cover recovery/manual entry and unchanged callers when shared handlers or defaults change.
- Do not make a spec or user sign-off a mandatory gate for every coding task.

DoD: the spec lets another engineer derive a substantive test suite and implement the intended change without inventing product decisions.
