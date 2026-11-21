---
name: sync
version: "1.0.0"
released: "2026-11-21"
description: >
  Enforces mandatory bi-directional synchronization across PROJECT.md, STYLE_ANCHOR.md,
  department GDDs, registry.yaml, data tables, game code, MOC.md, and GitHub Issues/Projects.
  Use whenever adding or changing gameplay rules, stats, flags, timing, schemas, or statuses.
  Not for Git commit formatting (use git).
---

# Full-Chain Synchronization

In game development, one desynchronized stat, flag, or frame timing breaks player experience across multiple departments. Full-chain sync is a **mandatory constitutional invariant** before any task is marked `Done`.

## When to Use

- Adding or editing entities, stats, formulas, story flags, asset/audio cues, or schemas.
- Tuning numbers directly in `data/` or code during playtesting (**Reverse Sync**).
- Closing a task or updating milestone progress across `MOC.md` and GitHub Projects.
- **Not for:** staging files or formatting commits (`git`).

## 5 Synchronization Axes

1. **Vision & Style (`PROJECT.md` + `STYLE_ANCHOR.md`):** Verify new content matches core pillars, rigor level, and Golden Samples.
2. **Canonical Registry (`departments/registry.yaml`):** Every entity, stat, formula, story flag, or timing cue referenced by **2+ departments** must have exactly one entry in `registry.yaml` (`id`, `owner`, `value_or_schema`, `data_path`, `consumers`). Never duplicate raw numbers across docs without citing the registry ID.
3. **Bi-Directional Ripple (`Design <-> Data <-> Code <-> Art/Audio`):**
   - **Top-Down (Spec changed):** Inspect all `consumers` in `registry.yaml` (`data/`, code, animation/VFX/SFX timing, UI, tests). Update in-scope files; if another department is outside your write scope, mark `sync-required` in `MOC.md` and post a follow-up item on GitHub immediately.
   - **Bottom-Up (Code/Data tuned in playtest):** Whenever numbers or mechanics change in `data/` or code during tuning, **reverse-sync** `registry.yaml` and flag/update the owning GDD/Balance spec in the same session.
4. **Save & Schema Continuity:** Schema or state changes must align loader code, UI bindings, save-version migration, and tests together.
5. **Operational State (`Git Branch == departments/MOC.md == GitHub Issue/Project`):** Keep system statuses (`idea -> draft -> locked -> in-progress -> playable -> polished`) consistent between `MOC.md` and the active GitHub Issue/Project card.

## Verification

Run the studio sync checker before closing work inside a game project:

```bash
node <workspace>/.agent/tools/check-sync.mjs --project <project-root> --json
```

Fix every reported broken link, unregistered cross-department conflict, or missing header before reporting completion.

## Gotchas

- **"Quick playtest tweak" left undocumented.** Code runs cooldown `1.2s` while the GDD still says `2.5s`, causing QA or Balance to overwrite the good feel later. Always reverse-sync.
- **Storing task logs locally.** Keep bug reports, QA verdicts, and session handoff notes as comments on the active GitHub Issue/PR, not as stray local Markdown files.
