---
name: clean-commit
description: Stage and commit only task-related changes, and push only when the user requested a push.
---

# Clean commit

Goal: create the requested commit or push without including unrelated files.

Constraints:
- Inspect status and the staged diff first. The read-only [inspect-staging.ps1](scripts/inspect-staging.ps1) helper gives a compact summary and flags agent-configuration candidates for scope review.
- Preserve user changes. Do not revert .gitignore, clear the index, or remove tracked files just because they look like agent artifacts.
- Stage explicit task paths. Review the staged diff and run relevant checks before committing.
- Do not include agent entrypoints, skills, or local MCP configuration in an ordinary feature commit merely because they appear as untracked files. Include them only when the user's task explicitly scopes that configuration change.
- Before a requested push, inspect the branch's outgoing commit diff as well as the working tree. Push only the intended task-related code, documentation, and tests; do not assume a clean working tree makes earlier unrelated commits safe to push.
- Generate a concise commit message from the change if one was not supplied.
- Push only when the user's request includes pushing. Never infer permission to merge or deploy.
- When providing a GitLab MR creation link after pushing in branch-pair repositories, enforce the 2 strict target mappings without exception: (1) `<feature|fix-bug|hot-fix>/...` -> `release` (`&merge_request%5Btarget_branch%5D=<release-branch>`) and (2) `merge-ci/...` -> `ci` (`&merge_request%5Btarget_branch%5D=ci`). Never target `main` or copy the raw `git push` hint URL without `merge_request[target_branch]`.

DoD: the commit contains only intended changes; if push was requested, the intended branch is pushed and its result is reported.
