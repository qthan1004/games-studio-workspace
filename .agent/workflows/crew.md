---
description: Crew mode - run one briefed task inside its git worktree (args - <run>/<task> or the brief path)
---

# /crew

1. Locate the brief: `.agent-runs/<run>/<task>/brief.md` under the workspace root, or use the path given.
2. Load the `crew` skill (`<workspace>/.agent/crew/SKILL.md` when deployed); execute the actual entrypoint/PREFLIGHT routing and exact isolation assertion before dependent actions.
3. Apply relevant routed skills and the brief's scope; named skills never override PREFLIGHT. All `personal-behavior` gates apply.
4. Record checkpoints in the assigned artifacts and send questions/results directly to the captain in the main chat. Never address the user or create a bridge/coordinator yourself.
