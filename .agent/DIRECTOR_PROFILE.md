# Studio Director Profile

> **Version:** `1.1.0` | **Updated:** `2026-11-21`
> Context about the Studio Owner read by agents across all projects. Written as objective directives ("Prefers...", "Ask before...", "Never..."), never as a role-play persona. Run [`workflows/distill-taste.md`](workflows/distill-taste.md) to refine or merge new cross-project rules (capped at 50 rules).

## Always-on summary

- **Language Split:** Chat, Overview Plans, and living project docs (`PROJECT.md` prose, `STYLE_ANCHOR.md`, `MOC.md`, `01..06`) in **Vietnamese** (keep English tech IDs/symbols). Write `SKILL.md`, `workflows/`, code, comments, Conventional Commits, and MR bodies in **English**.
- **2-Stage Kickoff Gate:** Interview first (`clarify` + `taste`) on new/open scope, or send `research` on existing repos. Write the **Overview Plan** (`status: draft`) to `documents/<Project Name>/overview-plan.md` (or `overview-<slug>.md` via [`workflows/overview-plan.md`](workflows/overview-plan.md)), pause for Director approval (`status: locked`), then let `producer` decompose tasks onto **GitHub Issues & Project v2**.
- **True Multi-Agent Studio (`Point >= 2`):** Main chat stays strictly `producer` (`research` -> Role Subagents `narrative`, `designer`, `balance`, `level`, `art-audio`, `architect`, `engineer` -> `qa`). Populate every touched `01..06` folder with substantive Vietnamese specs synced via `registry.yaml` & `MOC.md`.
- **GitHub Labels, Issue Closure & Adversarial MR Gate:** Use clean labels (`Producer`, `Research`, `Narrative`, `Design`, `Balance`, `Level`, `Art-Audio`, `Architect`, `Engineer`, `QA` — **never** `dept:*`), **close Issues when done** (`gh-studio.mjs close`), and validate Markdown formatting before posting. Run [`adversarial-review`](skills/general/adversarial-review/SKILL.md) in a **fresh session per round** (killing finished bots): **auto-merge into `main` on `clean`**; after **`3–4` fails**, reject, report to Director, revise `overview-*.md`, and redo.
- **Multi-Angle Character Fidelity:** Reject primitive stick/mannequin approximations for stylized/anime characters; follow [`character-gen`](skills/general/character-gen/SKILL.md) (`1` front face -> `10–20` angles, then `1` front body -> `10–20` angles via Nano Banana, or open web rigs + retargeted animations).
- **Never:** Never solo-code `Point >= 2`; never skip `overview-*.md` sign-off; never overwrite `status: locked` or `.env` unasked; never merge without a fresh-session `clean` `adversarial-review`; never leave done Issues open, bots hanging, or broken Markdown on GitHub.

## Craft & Game Taste

- Keep `SKILL.md` `<= 150` lines, CLI tools/hooks in zero-dependency **Node.js ESM (`.mjs`)**, relative links inside repo Markdown, and per-game style anchors isolated in `Projects/<game>/STYLE_ANCHOR.md`.

## Sources

| Fact / Preference | Source | Date |
|---|---|---|
| Vietnamese chat, zero filler; English `SKILL.md`, code, commits, and `mr` template | interview | 2026-11-21 |
| Vietnamese living department docs (`01..06`, `MOC.md`, `STYLE_ANCHOR.md`) with English tech IDs | correction + interview | 2026-11-21 |
| Mandatory `producer`-only main agent from `Point >= 2` (`research` -> Role Subagents -> `qa`) | correction + interview | 2026-11-21 |
| Interview first -> High-level Overview Plan check -> Producer breaks details on GitHub | correction + interview | 2026-11-21 |
| Mandatory Day-1 `private` GitHub Repo + Project v2 + Milestones + Issues per game | correction + interview | 2026-11-21 |
| Write Gate-2 Overview Plans to `documents/<Project Name>/*.md` (`overview-plan` workflow) for review | correction | 2026-11-21 |
| Multi-angle character pipeline (`1` front -> `10–20` angles for face & body) + web rig retargeting skill | correction | 2026-11-21 |
| Fresh-session `adversarial-review` per round: auto-merge MR on `clean`, escalate & re-plan after `3–4` fails | correction | 2026-11-21 |
| Close GitHub Issues immediately when done and terminate finished subagents so none hang | correction | 2026-11-21 |
| Use clean capitalized GitHub labels (`Design`, `Engineer`, etc.) and validate GitHub Markdown formatting | correction | 2026-11-21 |
