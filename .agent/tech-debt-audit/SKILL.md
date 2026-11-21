---
name: tech-debt-audit
description: On-demand audit to discover, evaluate, and prioritize technical debt and architectural drift across docs and codebase. Use only when the user explicitly asks to scan, check, or prioritize technical debt.
---

# Technical debt audit

Goal: surface high-risk technical debt by comparing documented/established contracts (SSOT) against actual codebase usage, evaluate each item's risk and blast radius, and recommend a practical execution order. Every claim must be traceable to evidence; an unverified claim is labeled, never stated as fact.

## Boundaries

- **On-demand and read-only:** run only when the user explicitly requests a technical-debt scan or audit. Never edit, refactor, or delete code during the audit; present findings and wait for user authorization before fixing any item. Writing the report file is the only permitted write.
- **Git hygiene:** before any checkout, record the current branch, `HEAD` commit, and `git status`. Do not checkout with uncommitted changes (never stash/discard without authorization). After the audit, report the previous branch and ask before switching back. Audit the exact ref the user named; resolve "latest release/ci" by listing remote refs, and state the resolved ref and commit.
- **Exclusion is for findings, not for impact:** in `paymenthub-checkout-web`, do not report findings inside `src/pages/CheckoutPageNew/` (mirror of `src/pages/CheckoutPage/`) unless the user scopes it in. However, callers inside excluded directories **must** be counted in blast radius and in any delete/unexport/rename recommendation. A symbol with callers only in an excluded directory is not "0 callers".
- **Focus on behavioral and architectural risk, not cosmetic style:** prioritize split-brain invariants, incomplete migrations, silent failures, and contagious legacy exports over formatting or naming nits.

## Audit workflow

1. **Establish intended contracts (Docs & SSOT):**
   - Inspect repository documentation (`docs/`, `README.md`), `.agent-wiki` (via its MCP when callable, per `agent-wiki`), recent migration commits, and explicit user rules from the conversation to identify current Single Sources of Truth (e.g., `merchantType` from URL query vs legacy `merchantCode` arrays; `BillCheck` money authority; `PaymentRenderEngine` bindings).
   - Read the cited doc sections yourself; cite doc line anchors only for lines you actually read on the audited ref.
   - When a document and a user rule disagree (e.g., the doc lists a legacy exception the user calls debt), mark the item `Decision needed` and state both positions. Do not silently pick one.
2. **Scan codebase with Semantic MCP first, then close known gaps:**
   - Use the project-scoped semantic MCP (`ts-paymenthub`: `get_references`, `find`, `quality_report`, `calculate_metrics`, `find_indirection_hotspots`, `detect_duplication`) for symbols, references, metrics, and duplication.
   - **Empty result is not proof of absence.** If an MCP query returns 0 results for comments, strings, or text patterns, or errors/times out, disclose it and run a targeted text fallback (`git grep -n` / `rg`) on the audited ref. Comment markers are always cross-checked with text search: `TODO`, `FIXME`, `HACK`, `XXX`, `@deprecated`, `tạm`, `temporary`, `legacy`, `compat`.
   - Trace surviving references to legacy/transitional constants, flags, and helpers, including callers in excluded directories, tests, and re-export barrels (`src/constants/index.ts`).
   - Run expensive whole-project tools (`quality_report` ≈ minutes) at most once per audit and reuse the output.
3. **Verify each candidate before reporting:**
   - Read the actual code at each cited location on the audited ref. `file:line` comes only from tool output or a file read in this audit — never computed or estimated.
   - Before claiming a production bug or broken flow, check for existing mitigations (alternate resolvers, dynamic IDs, guards elsewhere, feature flags, BE config) and the actual trigger conditions. If not checked, label `Inferred` and list what would confirm it.
   - Production impact claims ("đang gây lỗi") require evidence: a user report/screenshot, a reproduced observation, or a test. Otherwise state "có thể gây lỗi khi …".
4. **Classify findings by risk category:**
   - **Incomplete Migration / Split-Brain Authority (`CRITICAL`):** a new SSOT exists, but legacy constants/helpers remain exported and are still used by a subset of callers—or worse, get imported by newly written features.
   - **Guard / Predicate Drift (`HIGH`):** a state transition (e.g., capacity deduction, lock state) applies to a broad profile (`isInternalMerchant`), while its UI/validation guard checks a narrow predicate (`isRsaInternalMerchant` / hardcoded `merchantCode`), causing bugs on non-default channels (`webar`, `webrsaecom`, etc.).
   - **Duplicated Business Rules & State Drift (`MEDIUM`):** the same domain rule, request payload, or status mapping is maintained in multiple places without a shared helper.
   - **Dead Scaffolding & Complexity Hotspots (`LOW`):** obsolete flags, unreachable fallback branches, or high-indirection modules that increase cognitive load.
5. **Evaluate & prioritize:**
   - Score each item on three axes:
     1. **Production Impact:** can it cause silent data/payment bugs or channel-specific regressions? (evidenced vs potential)
     2. **Contagion Risk (Nguy cơ lây lan):** does leaving the legacy symbol exported tempt future PRs/agents to reuse it? Cite concrete re-import history (commit/ticket) when claimed.
     3. **Blast Radius & Effort (`S` / `M` / `L`):** exact caller count from `get_references` (split into in-scope / excluded-dir / tests) and test coverage needed.
   - Remediation suggestions are **hypotheses**, not decisions. Each states the intended direction and that it requires Gate 1 (`analyze-requirements` / `diagnose`) before implementation. Do not prescribe a BE contract or new field that was not verified to exist.
6. **Self-check before delivering:** re-verify every `Verified` row's `file:line`, every caller count, and every delete/unexport recommendation against excluded-dir callers. Downgrade anything that fails to `Inferred` or remove it.

## Output format

Deliver in Vietnamese (identifiers in English). When saving to a file, write `documents/tech-debt-audit-<ref-slug>.md` in the workspace (or the path the user names), using **relative paths** (not `file:///` absolute paths) for all links inside the document. If a previous report for the same repository exists, add a delta section: new, resolved, and changed items.

0. **Header:** repository, audited ref + commit, previous branch (if switched), date, exclusions, MCP tools used, and fallbacks used with reason.

1. **Technical Debt Inventory:**

| ID | Category | Debt / Mismatch | Contract (Doc/SSOT) vs Code (`file:line`) | Impact & Contagion Risk | Blast Radius / Effort | Evidence |
|---|---|---|---|---|---|---|

   - `Evidence` is one of: `Verified` (code read + references traced + mitigations checked), `Inferred` (plausible, with listed missing checks), `Decision needed` (doc vs user rule conflict).

2. **Prioritized Action Plan (Đề xuất thứ tự xử lý):**
   - **Priority 1 — Quick Wins & Contagion Blockers (Làm ngay):** Low effort (`S`), high production or contagion risk (e.g., fixing mismatched guards and retiring legacy exported arrays/constants with few remaining callers so new code cannot import them). Only `Verified` items qualify.
   - **Priority 2 — Invariant Consolidation (Làm tiếp theo):** Medium effort (`M`), aligning feature modules/slices onto the canonical SSOT with focused regression tests.
   - **Priority 3 — Structural Cleanup (Dài hạn):** High effort (`L`), refactoring complexity hotspots or retiring large legacy flows when scheduled.

3. **Comment-marker inventory:** count and grouped list of `TODO`/`FIXME`/`HACK`/`@deprecated`/temporary markers (in scope), linking the ones tied to a finding.

4. **Limits / Not checked (Giới hạn):** queries that failed or returned suspicious empties, unverified claims, areas not scanned, and open decisions for the user.
