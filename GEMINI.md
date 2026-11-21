# Workspace personal context

@./.agent/PREFLIGHT.md
@./.agent/personal-behavior/SKILL.md

Before starting any task in this workspace or any repository within it, ALWAYS read and follow the workspace [.agent/PREFLIGHT.md](.agent/PREFLIGHT.md) and [.agent/personal-behavior/SKILL.md](.agent/personal-behavior/SKILL.md) first.

Common skills and preflight routing are centralized in the workspace's `.agent/` directory; specialist skills stay in each repository's `.agent/specialist/`. If the active repository also defines its own `GEMINI.md` or `.agent/PREFLIGHT.md`, read it after the workspace preflight. Do not recursively preload the workspace steering directory or unrouted legacy workflows; consult [workflow-router.md](.agent/steering/workflow-router.md) only when the user explicitly asks for a legacy workspace workflow. Execute applicable skill and workflow routing from `.agent/PREFLIGHT.md` before any dependent action.
