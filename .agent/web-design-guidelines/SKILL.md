---
name: web-design-guidelines
description: Review a specified web UI for accessibility, interaction, and design issues when the user requests a UI or UX review.
metadata:
  author: vercel
---

# Web design review

Goal: report actionable issues in the UI the user selected.

Constraints:
- Inspect the actual component and styles. Use browser tooling when it materially helps verify behavior.
- Fetch current guidelines from https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md when available; do not rely on a stale copied checklist.
- Report findings with file and line evidence, ordered by impact. Avoid speculative nits.
- If the target is ambiguous, infer from the request or ask for the missing target.

DoD: findings identify a user-visible issue, its location, and a concrete correction; say when no issue was found.
