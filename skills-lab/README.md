# Experimental Skills Lab (`skills-lab/`)

Isolated staging and cooking directory for **experimental / project-specific Agent Skills**.

## Why This Directory Lives Outside `.agent/skills/`

1. **Zero Auto-Discovery Pollution:** Antigravity automatically scans `.agent/skills/` and `.agent/skills.json` (`general/` and `roles/`) on every session. Keeping experimental cooked skills here prevents unfinished or project-specific toolbooks from polluting standard studio conversations.
2. **Canonical Skill Protection:** Standard workspace skills under `.agent/skills/general/` and `.agent/skills/roles/` remain untouched while experimental workflows (`VRoid`, `Blender MCP`, custom SRPG validators) are tested and iterated.
3. **Explicit On-Demand Pointer Routing:** Departments do **not** read `skills-lab/` during routine work. Only when `producer` dispatches a task requiring an experimental skill does the Context Packet include its explicit path under `SKILLS TO READ:`.

## Active Project Sandboxes

- [`project-1001/`](./project-1001/README.md) — Pre-production & Pilot-driven skill slots for **Project 1001** (*Covenant of Ashes*).
