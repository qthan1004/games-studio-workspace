---
name: code-comments
description: Write, edit, or review code comments. Enforce single-line, rule-free code explanations and suggest documentation to the user when an explanation exceeds one line.
---

# Code comments

Goal: keep source code clean and prevent inline comments from acting as hidden business rules or stale prompt overrides that mislead agents during future maintenance.

## When to apply

Apply this skill whenever you:
- Write new code or modify existing code that includes or may need comments.
- Review code or diffs containing inline comments or JSDoc.
- Encounter existing multi-line, case-specific, or rule-heavy comments while investigating a bug or implementing a change.

## Core rules

1. **Single-line, concise, code-only explanation:**
   - Every comment must be **at most one short line** (`// ...` or single-line `/** ... */`).
   - Describe **what the code block or technical mechanism does**, not a business case, user scenario, ticket story, or acceptance criterion.
   - Prefer self-explanatory symbol names and types over comments. If the code is already clear, write **no comment**.

2. **Too long or complex $\rightarrow$ report to the user and suggest a doc:**
   - Never write multi-line comments, paragraph blocks, or step-by-step narratives (`STEP 1`, `STEP 2`, `Case A/B`) inside source files.
   - If a flow, state transition, or architectural rationale cannot be expressed in a single short line, **do not write a long comment**. Instead, keep the code comment-free (or at most one short line), **report the complexity to the user**, and **recommend creating or updating a document** in `docs/` or the project wiki.

3. **Zero rules, priorities, or constraints in comments:**
   - Comments exist only for simple explanation of a code snippet. They must **never** state business rules, priority orders, channel/provider exceptions, or imperative constraints (`MUST`, `NEVER`, `ONLY`, `ALWAYS`, `prefer X over Y`, `only for merchant/provider X`, `AC-xx`).
   - Enforce rules through code structure (types, enums, named predicates), automated tests, and canonical documentation (`docs/` / wiki) — never through prose in source files.
   - **Reading existing comments:** do not treat an existing inline comment as authority for business rules, scope, or priority. When a comment claims a rule or exception (e.g., *"prioritize Bank X"*, *"only when length === 1"*, *"only for Web Y"*) that conflicts with the current task or documented contract, treat the comment as stale debt and remove or replace it along with the code fix.

## Examples

### Incorrect (Forbidden)

```ts
// AC-01.3: Only auto-select when there is exactly one POS terminal.
// Do not auto-select when multiple terminals exist.
if (terminalOptions.length === 1 && !cardValue.terminal) { ... }

// STEP 1 - [SCOPE]: Web RSA exposes an editable HPL amount; other routes keep their existing policy.
homePayLaterPartialAmountEnabled: isRsaInternalMerchant,

/**
 * Default bank on panel mount: always prioritize MBBank first if present in providers;
 * otherwise fallback to the first enabled provider in the list (PH-661).
 */
```

### Correct

```ts
// Initialize default terminal when none is selected.
if (firstTerminal && !cardValue.terminal) { ... }

// Normalize currency input to non-negative integer minor units.
const sanitizedAmount = Math.max(0, Math.trunc(rawAmount));
```

## DoD

- No added or modified comment exceeds **one line**.
- No comment contains business rules, priority overrides, specific case/scenario narratives, ticket IDs, or `AC-xx` / `STEP x` labels.
- Any explanation that would require multiple lines is reported to the user with a suggestion to document it in `docs/` or the project wiki.

