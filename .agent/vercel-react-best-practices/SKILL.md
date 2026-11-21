---
name: vercel-react-best-practices
description: Apply relevant React or Next.js performance guidance when diagnosing, reviewing, or implementing a performance-sensitive change.
license: MIT
metadata:
  author: vercel
---

# React performance guidance

Goal: improve the measured or likely performance bottleneck without changing unrelated behavior.

Constraints:
- Inspect the actual framework and code path first. Apply Next.js server rules only to applications that use those features.
- Select only rule files in rules/ that match the task. Filenames describe the concern; search that directory instead of reading every rule.
- Access path: `RULES_INDEX.md` (about 3k tokens, one line per rule) is the entry point. Never load `AGENTS.md` (about 27k tokens); it is the compiled human copy of the same rules.
  - Targeted fix: grep `RULES_INDEX.md` for the section prefix (`async-`, `bundle-`, `server-`, `client-`, `rerender-`, `rendering-`, `js-`, `advanced-`) or a keyword, or run `node scripts/rules-index.mjs find . <words>`; open 1-3 matching rule files.
  - Review or audit: read `RULES_INDEX.md` fully as the checklist so no rule is skipped; open a rule file only when the code plausibly violates it, and cite the rule id in the finding.
  - After adding or editing a rule, run `node scripts/rules-index.mjs build .` (and for `../vercel-composition-patterns`); `check` exits 1 when the index is stale.
- Treat each rule as guidance, not an automatic refactor mandate. Preserve current product behavior and avoid speculative memoization or caching.
- If an optimization is not justified by the code path or observed cost, leave it alone.

DoD: the targeted performance concern is addressed, behavior remains correct, and the relevant measurement or verification is reported.
