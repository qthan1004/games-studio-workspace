---
name: planning-and-task-breakdown
description: Turn a requested feature or specification into ordered implementation tasks with clear completion checks.
---

# Planning and task breakdown

Goal: produce a plan a developer or agent can execute without guessing important dependencies.

Constraints:
- Start from the actual requirement, codebase, and known dependencies.
- Carry the spec's acceptance and regression scenarios into test-first implementation tasks; do not defer all testing to a final cleanup step.
- Keep tasks sized for meaningful implementation and verification. State required ordering only where a dependency exists.
- Distinguish required work from optional improvements. Avoid speculative refactors and invented deadlines.
- Include migration, rollback, or release work only when the scope requires it.

DoD: each task has a concrete outcome, relevant dependency, and observable completion check; the full list reaches the requested goal.
