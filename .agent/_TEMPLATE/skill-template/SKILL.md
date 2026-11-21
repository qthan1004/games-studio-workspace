---
name: example-skill
version: "1.0.0"
released: "YYYY-MM-DD"
description: >
  Concise action statement of what this skill does and what artifacts it governs.
  Use when <concrete user phrases, file signals, or symptoms>. Not for <adjacent skill
  name and what that neighbour owns>.
---

# Skill Title

One-sentence outcome statement. Keep the entire `SKILL.md` concise (`<= 120` lines); move multi-step pipelines to `.agent/workflows/` and deterministic checks to `.agent/tools/*.mjs`.

## When to Use

- Concrete scenario 1.
- Concrete scenario 2.
- **Not for:** nearby concern owned by `<other-skill>`.

## Core Rules

1. **Rule 1:** Clear operational heuristic explaining *why* it matters.
2. **Rule 2:** Deterministic verification command or output contract.

## Verification

```bash
node <workspace>/.agent/tools/<tool>.mjs --json
```

## Gotchas

- **Symptom / trap:** Concrete cause -> smallest reliable fix.
