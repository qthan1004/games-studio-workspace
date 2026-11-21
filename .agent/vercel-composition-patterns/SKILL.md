---
name: vercel-composition-patterns
description: Use React composition patterns when designing a reusable component API or simplifying a component with real variant complexity.
license: MIT
metadata:
  author: vercel
---

# React composition

Goal: give a reusable component a clear API without unnecessary branching or coupling.

Constraints:
- Inspect existing usage and preserve its behavior.
- Read only relevant examples in rules/, such as compound components, state ownership, or explicit variants.
- Entry point is `RULES_INDEX.md` (one line per rule); never load `AGENTS.md`. For a component API review, read the index as the checklist and open only rules the code plausibly violates. Regenerate with `node ../vercel-react-best-practices/scripts/rules-index.mjs build .` after rule edits.
- Prefer a small local component when there is only one use case. Do not introduce context or compound components by default.
- Verify React-version-specific advice against the project's installed version.

DoD: callers remain clear, the component's variants or state ownership are explicit, and relevant behavior is verified.
