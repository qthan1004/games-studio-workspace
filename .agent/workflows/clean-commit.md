---
name: clean-commit
description: Git hygiene workflow to ensure clean commits without AI artifacts
triggers: ["commit", "clean commit", "git hygiene", "push code"]
---

# Clean Commit Workflow

This workflow ensures that when the user wants to commit and push code, no AI agent artifacts (like `.agent/`, `GEMINI.md`, `CLAUDE.md`, etc.) are accidentally committed or pushed.

## Pipeline

### Step 1: Revert `.gitignore`
Run `git checkout origin/main -- .gitignore` to revert any changes made by AI tools to the `.gitignore` file.

### Step 2: Verify Tracked Files
Check if any AI artifacts have been accidentally tracked:
`git ls-files .agent GEMINI.md CLAUDE.md`
If any of these files are listed, remove them from tracking using `git rm --cached -r <file>`.

### Step 3: Stage Valid Code Files
Unstage all files first with `git restore --staged .`.
Then, manually `git add` only the relevant source code files modified in the current branch. DO NOT use `git add .` unless you have strictly verified every single modified and untracked file.

### Step 4: Commit and Push
Ask the user for a commit message (or generate one based on the changes and ask for confirmation).
Execute `git commit -m "<message>"` and `git push origin <current-branch>`.

### Step 5: Verification
Run `git diff origin/main...HEAD --name-only` to double-check that no unrelated files were pushed.
Notify the user of the successful, clean push.
