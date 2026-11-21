---
name: git
version: "1.0.0"
released: "2026-11-21"
description: >
  Enforces single-branch Git flow, clean staging hygiene, engine/LFS safety, Conventional
  Commits, and Standard Version (SemVer) game releases. Use whenever creating branches,
  staging files, committing, pushing, opening PRs, or bumping versions. Not for GitHub
  Project task triage (use producer).
---

# Git, Clean Staging & Standard Version

Keep version history clean, single-branch, and machine-parseable for automated SemVer changelogs while protecting repositories from engine cache bloat and un-tracked binaries.

## When to Use

- Creating a work branch, staging files, committing, pushing, or cutting a SemVer release.
- **Not for:** formatting Merge Request / Pull Request descriptions ([`../mr/SKILL.md`](../mr/SKILL.md)), decomposing milestones on GitHub Projects (`producer`), or syncing GDD registries (`sync`).

## Single-Branch Trunk Flow

- **Canonical branch:** `main` (always buildable). Never create legacy dual `merge-ci` or `ci` branch pairs.
- **One branch per task:** Update `main` (`git pull --ff-only`), then branch once:
  - Format: `<type>/<issue-id>-<kebab-slug>` (or `<type>/<kebab-slug>` when issue-less).
  - Examples: `feat/14-parry-window`, `fix/22-save-slot-null`, `balance/19-wave-gold`, `docs/combat-gdd`.

## Conventional Commits & Game SemVer

Format every commit in English:

```text
<type>(<scope>): <imperative summary <= 72 chars, no trailing dot>

[Optional concise body: WHY and design/balance context]
[Optional footer: Closes #<issue> | BREAKING CHANGE: <save/schema break>]
```

- **Types & SemVer impact:**
  - `feat` -> **MINOR** (`0.1.0 -> 0.2.0`) | `fix`, `perf`, `balance`, `art`, `audio` -> **PATCH** (`0.2.0 -> 0.2.1`)
  - `docs`, `refactor`, `test`, `chore`, `build` -> no version bump
  - `<type>!` or `BREAKING CHANGE:` (save-file or core schema break) -> **MAJOR** (post-`1.0.0`) or **MINOR** (`0.x.y`)
- **Production version milestones:** `0.1.x` Prototype · `0.2.x–0.4.x` Vertical Slice · `0.5.x–0.7.x` Alpha · `0.8.x–0.9.x` Beta/Polish · `1.0.0` Gold Launch. For cutting releases, follow [`../../../workflows/release-version.md`](../../../workflows/release-version.md).

## Mandatory Pre-Commit Check

1. Stage explicit task paths (`git add <path1> <path2>`); avoid blind `git add .` when untracked scratch files exist.
2. Run the studio staging inspector before every commit:
   ```bash
   node <workspace>/.agent/tools/inspect-staging.mjs --repo <repo-root> --message "<type>(<scope>): <summary>" --json
   ```
3. Commit only when exit code is `0` and task authorization covers committing. Merge MRs into `main` automatically once a fresh-session [`../adversarial-review/SKILL.md`](../adversarial-review/SKILL.md) returns `Verdict: clean`; SemVer tag creation and repository deletion always require explicit Director authorization.

## Gotchas

- **Engine cache & secret leaks.** Never stage `.env`, `project.local.yaml`, `Library/`, `Temp/`, `.godot/`, `Intermediate/`, `Saved/`, `Binaries/`, or `node_modules/`.
- **Un-LFS'd heavy binaries.** If `.psd`, `.blend`, `.fbx`, `.wav`, `.mp4`, or large textures are staged without Git LFS tracking in `.gitattributes`, stop and configure LFS before committing.
