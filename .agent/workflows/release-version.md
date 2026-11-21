---
name: release-version
version: "1.0.0"
released: "2026-11-21"
description: Cut a clean SemVer game or workspace release on main using Conventional Commits, CHANGELOG.md generation, and Git tags.
---

# Workflow: Standard Version Release Cut

Used by [`general/git`](../skills/general/git/SKILL.md) and [`roles/producer`](../skills/roles/producer/SKILL.md) when cutting a milestone release (`0.1.0` Prototype -> `0.2.0` Vertical Slice -> `0.5.0` Alpha -> `0.8.0` Beta -> `1.0.0` Gold).

## Prerequisites

- Explicit Director authorization to cut a version (and separate authorization if pushing tags/releases to GitHub).
- Working tree on `main` is clean, up to date with `origin/main`, and passes project tests + `check-sync.mjs`.

## Steps

1. **Verify Readiness:**
   ```bash
   node <workspace>/.agent/tools/inspect-staging.mjs --repo <repo-root> --json
   node <workspace>/.agent/tools/check-sync.mjs --project <repo-root> --json
   ```
2. **Preview Version Bump & Changelog (Dry Run First):**
   - Inspect commits since last tag (`git log <last-tag>..HEAD --oneline`):
     - `feat` -> bumps `MINOR`
     - `fix`, `perf`, `balance`, `art`, `audio` -> bumps `PATCH`
     - `!` / `BREAKING CHANGE:` -> bumps `MAJOR` (or `MINOR` while `0.x.y`)
   - If `commit-and-tag-version` / `standard-version` is configured in the project, run `--dry-run` first (`npx commit-and-tag-version --dry-run`); otherwise update `PROJECT.md` `version:` and prepend the grouped `CHANGELOG.md` section deterministically.
3. **Commit & Tag Release:**
   - Stage only `CHANGELOG.md`, `PROJECT.md` (and `package.json` / engine version manifest if present).
   - Commit as `chore(release): v<X.Y.Z>` and create annotated tag `git tag -a v<X.Y.Z> -m "Release v<X.Y.Z>"`.
4. **Publish (Only When Explicitly Authorized):**
   - `git push --follow-tags origin main` and optionally create a GitHub Release (`gh release create v<X.Y.Z> --notes-from-tag`) closing the corresponding GitHub Milestone.
