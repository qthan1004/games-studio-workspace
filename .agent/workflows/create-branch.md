---
name: create-branch
description: Create or reuse the work and CI integration branch pair, and update the workspace release tracker.
---

# Workflow: Create work and CI branch pair

Apply when branch creation is requested or included in an explicitly authorized build-delivery
outcome. A ticket supplied only for reading/review is not a branch request. Workspace/user branch
instructions take precedence; preserve existing local changes and reuse an existing pair.

## Resolve the pair

- Verify the repository and inspect `git status` before branch operations. Do not stash,
  discard, move, or overwrite local changes unnecessarily; do not create worktrees without an
  explicit request. If checkout would overwrite changes, hold that checkout and explain why.
- Work name: `<task-type>/<branch-suffix>`, with type `feature`, `fix-bug`, or `hot-fix` from the
  user's explicit choice or verified ticket type. Ask if the type remains unclear.
- CI name: `merge-ci/<branch-suffix>`, never `merge-ci/feature/...` or another nested work prefix.
- Use an explicitly named work branch unchanged. Extract a suffix from a ticket URL. For multiple
  same-project tickets, deduplicate and keep the project prefix once, e.g. `PH-1977-1978`;
  retain each full project key for mixed-project tickets.
- Check local/remote branches first. Reuse the task's existing pair without resetting or
  recreating it, and preserve any existing commits. Do not move existing branch tips just to
  make them match a fresh base.
- If a task branch exists only on origin, check it out as a tracking branch; do not replace it
  with a new branch from main/ci. Distinguish this reuse from creation of a genuinely missing branch.

## Create missing branches

1. Switch to `main` and update it from `origin/main` with a fast-forward pull before creating
   a new work branch from that latest HEAD. If it diverged, inspect/report instead of resetting.
2. Switch to `ci` and update it from `origin/ci` with a fast-forward pull before creating a
   missing `merge-ci/<suffix>` from that latest HEAD. Preserve divergence rather than resetting.
3. Immediately record the pair in the workspace tracker below. Return to the work branch
   unless the user asked to work on merge-ci.

If an existing work branch is reused, do not recreate it from main. If only its CI companion
is missing, create only that companion from updated ci. Branch creation alone does not commit,
push, merge work into CI, create an MR, or authorize deployment.

## Maintain the existing release tracker

Keep the tracker under `<workspace>/documents/` (or `documents/` inside a standalone repository),
preferring an existing `CI_RELEASE_BRANCH_TRACKER.md` or equivalent team release tracker already in
use. If none exists, create `CI_RELEASE_BRANCH_TRACKER.md` in UTF-8.

Use the work/merge-ci branch as a deduplication key. Preserve the existing schema and history;
record the repository, pair, ticket(s), current state, and necessary release note in the available
columns. Keep notes brief: dated timeline/status, related ticket keys and unresolved release
dependencies. Do not paste workflow logs, long implementation descriptions, or test reports.
Update the same record after push/MR/CI/release changes. Keep CI-merged records until release/main
presence is verified, then mark complete and move to the completed section if that format exists.

## Later CI synchronization, only when requested

Update `merge-ci/<suffix>` from latest `ci` first, then merge its work branch into it. Never
merge `ci`/merge-ci into the work branch or merge the work branch directly into `ci`.
Resolve conflicts using CI for unrelated scope and the work change for task scope; combine
both intentions when they overlap. Check conflict markers, scope and relevant verification
before any authorized push. Apply [clean-commit](../clean-commit/SKILL.md) for commit/push and
MR target rules. Do not merge an MR without an explicit request.

Report the active branch, pair, tracker path, and actual results or any blocked checkout.
