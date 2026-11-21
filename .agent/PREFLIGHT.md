# Studio Agent Preflight

**Version:** `1.0.0` | **Released:** `2026-11-21`

Goal: empower agents with maximum tactical freedom inside strict studio guardrails, dynamic role-based skill selection, and mandatory full-chain game synchronization.

## 1. Rule-Bounded Autonomy (5 Hard Guardrails)

Never force a rigid waterfall step sequence (`interview -> spec -> ticket -> code`) onto simple or exploratory work. Choose the shortest verified path to the outcome while obeying five non-negotiable rules:

1. **Department Write Isolation & Lock Protection:** Every role writes only to its authorized paths (enforced by [`hooks/write-guard.mjs`](hooks/write-guard.mjs)). Never overwrite any file carrying `status: locked` or `.env` without explicit Director approval.
2. **External & Git Boundaries:** Never push, merge, tag releases, delete branches, or close/mutate external GitHub milestones without explicit task authorization. Single-branch trunk flow (`<type>/<issue>-<slug>` off `main`) applies everywhere.
3. **Verified Evidence Only:** Run logic/simulation checks for deterministic rules and data. Never claim visual, physics, or game-feel verification without actual execution/observation; state *"Not yet playtested by a human"* and hand off concrete playtest steps.
4. **Director Owns Material Decisions:** Inspect project context (`PROJECT.md`, `STYLE_ANCHOR.md`, `departments/MOC.md`, code) first. If an unresolved choice alters core gameplay feel, win/lose rules, canon lore, or save compatibility, load [`skills/general/clarify/SKILL.md`](skills/general/clarify/SKILL.md) and present 2–3 options with trade-offs.
5. **Mandatory Full-Chain Synchronization:** Game production tolerates zero drift across *Vision <-> Narrative <-> Design <-> Balance <-> Data <-> Code <-> Art/VFX/Audio <-> MOC.md <-> GitHub Project*. Both top-down spec edits and bottom-up playtest code/data tuning MUST synchronize across [`departments/registry.yaml`](skills/general/sync/SKILL.md) and `MOC.md` before reporting `Done`.

## 2. Need-Driven Skill Selection (`General` + `Roles` + `Project Specialist`)

Do **not** bulk-load skills, and do **not** obey an arbitrary numeric skill cap. Read the fast-scan roadmaps at [`skills/README.md`](skills/README.md) when needed and load **every skill genuinely required** for the active task (and zero unrelated ones):

- **Cluster 1 — General ([`skills/general/README.md`](skills/general/README.md)):** Mandatory cross-role standards whenever touching that activity (`guardrails`, `sync`, `taste`, `clarify`, `git`, `mr`, `hygiene`, `cli-bridge`).
- **Cluster 2 — Studio Roles ([`skills/roles/README.md`](skills/roles/README.md)):** Load the department playbook matching your active role (`producer`, `research`, `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer`, `qa`).
- **Cluster 3 — Project Specialists (`Projects/<game>/.agent/skills/README.md`):** When working inside a game repository, also read its `PROJECT.md`, `STYLE_ANCHOR.md`, `departments/MOC.md`, and the matching engine/genre skills.

## 3. `1–5` Point Scoring (`C/I/F/V`) & Subagent Dispatch

Score assignments before delegating via `Point = max(C, I, F, V)` on a `1–4` scale (`C`: Technical/Design Reasoning, `I`: Cross-Department Contract Impact, `F`: State/Frame/Async Lifecycle, `V`: Verification/Simulation Complexity). Reserve `Point 5` strictly for irreducible conflicting invariants backed by a concrete counterexample (`C=4` plus another `4`).

| Point | Execution Mode | Delegation & Review Rule |
|---:|---|---|
| **1** | **Solo Direct** | Handle directly in the active session; run direct check. Spawn zero subagents. |
| **2** | **Solo or Focused Helper** | Handle directly, or invoke one targeted helper (`research`, `image-generator`, `browser`). |
| **3** | **Scoped Role Subagent** | Dispatch role subagent(s) with isolated Context Packets; Producer verifies spec + quality. |
| **4** | **Isolated Crew + Independent QA** | Freeze contracts & enforce **Scene/Binary Lock** first; run isolated worker + dedicated read-only `qa` reviewer. |
| **5** | **Architect Solver First** | Resolve core invariant/math conflict via PoC or simulator first, then decompose into Point 2–3 tasks. |

**Delegation Ceiling:** Only `producer` (main-chat Captain) grants write scopes to workers. Read-only agents (`qa`, `research`) have a strict `read-only` delegation ceiling and can never escalate write permissions.

## 4. Unified Tooling & Cloud-First Work Storage

- **Single Tool Language:** All workspace and project scripts under `tools/` and `hooks/` use zero-dependency **Node.js ESM (`.mjs`)**.
- **Lean Local Repos:** Keep roadmaps, task briefs, bug triage, QA reviews, and playtest handoffs on **GitHub Projects v2, Issues, and PRs**; keep only living product specs, `data/`, code, assets, and `tests/` inside `Projects/<game>/`.
