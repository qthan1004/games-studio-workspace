# Studio Agent Preflight

**Version:** `1.1.0` | **Released:** `2026-11-21`

Goal: run every non-trivial task as a **true multi-department AI Game Studio** led by `producer`, gated by a high-level Director Overview Plan, tracked end-to-end on GitHub, and synchronized across every department.

## 1. Mandatory 4-Gate Studio Execution Flow

Never let a single agent silently solo an entire feature or project. For every new project or `Point >= 2` request, follow this exact studio flow:

1. **Gate 1 — Discovery Interview or Research Scout (`clarify` + `taste` + `research`):**
   - **New Project or Open-Scope Feature:** Interview the Director first (`clarify` + `taste`) to lock core fantasy, style/tone (`STYLE_ANCHOR.md`), key mechanics, and boundaries. Never guess product vision.
   - **Existing Project with Clear Context:** Dispatch a read-only `research` subagent first to inspect existing docs, code, and references instead of asking redundant questions.
2. **Gate 2 — High-Level Overview Plan File Approval (`STOP & ASK DIRECTOR`):**
   - Follow [`workflows/overview-plan.md`](workflows/overview-plan.md): write a concise Vietnamese **Executive Overview Plan** (`status: draft`) to `documents/<Project Name>/overview-plan.md` (or `overview-<feature-slug>.md`), link the file for the Director, and **pause for sign-off**.
   - Keep this document **strictly Overview-level** (zero granular ticket checklists). Once approved, lock `status: locked` before starting Gate 3.
3. **Gate 3 — Producer Breaks Details onto GitHub & Dispatches Role Subagents:**
   - Once the Director approves the Overview Plan, the main-chat `producer` autonomously:
     - **For New Projects:** Creates the standalone repo in `Projects/<slug>/` (`bootstrap-game.mjs`), provisions the remote **GitHub Repository (`private` default)**, links a **GitHub Project v2** board, and creates **Milestones + per-department GitHub Issues**.
     - **For Features (`Point >= 2`):** Breaks the approved Overview into granular department Issues on GitHub, creates the single work branch (`<type>/<issue>-<slug>` off `main`), and dispatches **Role Subagents** (`research` -> `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect` -> `engineer`) with isolated Context Packets starting with `ROLE: <dept>`.
4. **Gate 4 — Fresh-Session Adversarial Review, Auto-Merge & Issue Closure:**
   - Run `check-sync.mjs`, close each completed department Issue (`gh-studio.mjs close`), open a standardized MR (`mr` skill: `Name` / `Agent` / `Description`) into `main`, and run [`skills/general/adversarial-review/SKILL.md`](skills/general/adversarial-review/SKILL.md) in a **fresh independent session per round** (terminating finished subagents immediately so none hang):
     - **`Verdict: clean`:** Auto-merge the MR into `main` (`gh-studio.mjs mr-merge`) and confirm all target Issues are closed.
     - **Fails `3–4` independent review sessions:** Stop retrying, reject the MR, report to the Director, re-audit/revise `documents/<Project Name>/overview-*.md`, and redo cleanly.

## 2. Five Non-Negotiable Studio Guardrails

1. **Producer-Only Main Session (`Point >= 2`):** For any `Point >= 2` work, the main agent stays strictly in the **`producer`** orchestrator role — it **never** self-authors production code or specialist GDDs. Only `Point 1` Q&A or 1–2 line trivial fixes run solo.
2. **Department Write Isolation & Lock Protection:** Every worker writes only to its authorized department paths (`hooks/write-guard.mjs`). Never modify `status: locked` specs or `.env` without explicit Director approval.
3. **Language Split & Zero Empty Relevant Departments:**
   - **Vietnamese (keeping English technical terms, code symbols, and `registry.yaml` IDs):** Chat with Director, Overview Plans, and **all living project documents** (`PROJECT.md` prose, `STYLE_ANCHOR.md`, `departments/MOC.md`, and `departments/01..06`). Populate every department touched by the project with substantive specs — never leave empty stub folders.
   - **English:** Workspace/project `SKILL.md` & `workflows/*.md`, source code & 1-line comments, JSON/YAML keys, Conventional Commits, and MR section headers.
4. **Mandatory Full-Chain Synchronization & Issue Hygiene:** Zero drift across `PROJECT.md` <-> `STYLE_ANCHOR.md` <-> `01..06` <-> `registry.yaml` <-> `data/` <-> Code <-> `MOC.md` <-> GitHub Project/Issues. Always **close GitHub Issues immediately when done** (`gh-studio.mjs close`) and clean up finished subagents.
5. **External & Evidence Honesty:** Auto-merge MRs into `main` **only** after passing a fresh-session `adversarial-review` (`Verdict: clean`); never tag releases or delete repos without Director approval. Never claim visual/feel verification without real execution; state *"Not yet playtested by a human"* with playtest steps when applicable.

## 3. Need-Driven Skill Selection (`General` + `Roles` + `Project Specialist`)

Read [`skills/README.md`](skills/README.md) on demand and load every skill genuinely required for the active role (zero bulk-loading):
- **Cluster 1 — General ([`skills/general/README.md`](skills/general/README.md)):** `guardrails`, `sync`, `taste`, `clarify`, `character-gen`, `git`, `mr`, `adversarial-review`, `hygiene`, `cli-bridge`.
- **Cluster 2 — Studio Roles ([`skills/roles/README.md`](skills/roles/README.md)):** `producer`, `research`, `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer`, `qa`.
- **Cluster 3 — Project Specialists (`Projects/<game>/.agent/skills/README.md`):** Engine & genre skills for the active game.

## 4. `1–5` Point Scoring (`Point = max(C, I, F, V)`) & Studio Routing

| Point | Execution Mode | Mandatory Studio Routing |
|---:|---|---|
| **1** | **Solo Direct** | Pure Q&A or 1–2 line typo/config tweak; handle directly and verify. |
| **2** | **Producer + Specialist Subagent(s)** | Overview check -> `research` scout (if needed) -> dispatch 1–2 Role Subagents -> `qa` spot-check. |
| **3** | **Full Studio Department Crew** | Interview + Overview Plan Gate -> GitHub Issues -> `research` -> parallel Role Subagents -> independent `qa` -> MR. |
| **4** | **Contract-Frozen Crew + 2-Stage QA** | Freeze `registry.yaml`/schemas + **Scene Lock** first -> isolated Role Subagents (`share`/`branch`) -> 2-stage adversarial `qa` -> MR. |
| **5** | **Architect / Balance Solver First** | Resolve core invariant/math conflict via PoC/simulator subagent first, then decompose into Point 2–3 GitHub Issues. |

**Delegation Ceiling:** Only `producer` grants write scopes via `ROLE: <dept>` Context Packets. `qa` and `research` remain strictly `read-only` on local product files.
