# Studio Director Profile

> **Version:** `1.0.0` | **Updated:** `2026-11-21`
> Context about the Studio Owner read by agents across all projects. Written as objective directives ("Prefers...", "Ask before...", "Never..."), never as a role-play persona. Run [`workflows/distill-taste.md`](workflows/distill-taste.md) to refine or merge new cross-project rules (capped at 50 rules).

## Always-on summary

- **Communication:** Converse in **Vietnamese** (concise, direct, zero flattery or filler); write all code, `SKILL.md` files, technical specs, and commit messages in **English**.
- **Autonomy vs. Ask:** Give agents tactical freedom inside guardrails (no rigid step-by-step ceremony for routine work), but **always ask** with 2–3 trade-off options before altering core game vision, locked specs (`status: locked`), save compatibility, or external Git/GitHub state (push, merge, release tags).
- **Architecture & Scope:** Favor modular, pragmatic, lean systems; keep workspace generic across all genres/engines; isolate engine/genre skills inside `Projects/<game>/`; push work/QA tracking to GitHub Projects/Issues so local repos hold only living product files.
- **Game Design Bar:** Demand end-to-end synchronization across every department (narrative, mechanics, balance math, data, code, VFX/audio timing, and `MOC.md`); reject flat mechanics lacking meaningful trade-offs and generic "AI slop" aesthetics/writing.
- **Tooling & Git Discipline:** Enforce 100% single-language tooling (**Node.js ESM `.mjs`**), single-branch workflow (`<type>/<issue>-<slug>` off `main`), Conventional Commits / SemVer, and strict staging hygiene.
- **Never:** Never bulk-load all skills; never silently overwrite `status: locked` files or `.env`; never claim unrun visual/feel checks passed; never adopt bloated trend tools without distilling only what fits.

## Craft & Engineering Preferences

- Keep `SKILL.md` files short, sharp, and operational (`<= 120` lines); extract multi-step flows to `workflows/` and deterministic checks to `tools/*.mjs`.
- Maintain a fast-scan `README.md` roadmap inside every skill cluster so agents orient in one read.
- Use relative file links inside all repository Markdown documents (never machine-specific absolute paths or `file://` URIs).

## Game & Aesthetic Taste

- Project-specific tone, North-Star game references, and Golden Samples live in each project's `Projects/<game>/STYLE_ANCHOR.md` (`scope: project`) so genre rules never contaminate other games.
- Promote a rule here (`scope: studio`) only when it reflects the Director's studio-wide taste across 2+ projects or an explicit global preference.

## Sources

| Fact / Preference | Source | Date |
|---|---|---|
| Vietnamese chat, English technical docs/skills/commits, zero filler | user file (`personal-behavior`) | 2026-11-21 |
| Rule-bounded autonomy; dynamic catalog skill picking without fixed count cap | interview | 2026-11-21 |
| Mandatory bi-directional end-to-end sync across all game stages | interview | 2026-11-21 |
| Cloud-first work & QA tracking on GitHub Projects/Issues; lean local game repos | interview | 2026-11-21 |
| Short skill names, unified Node.js `.mjs` tools, `README.md` roadmaps per cluster | interview | 2026-11-21 |
