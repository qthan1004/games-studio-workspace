# Skill Template

Standard template for creating new skills. Works for any domain — coding, design, workflow, agent patterns, etc.

## Structure

### Simple (no sub-rules)

```
skill-name/
└── SKILL.md
```

### Full (categorized rules)

```
skill-name/
├── SKILL.md              # Entry point — overview + quick reference
├── AGENTS.md             # Optional — compiled full guide (all rules expanded)
├── README.md             # Optional — human-readable overview
├── metadata.json         # Optional — version, author, references
└── rules/
    ├── _sections.md      # Section definitions (categories + impact levels)
    ├── _template.md      # Template for individual rules
    └── prefix-name.md    # Individual rule files
```

## Creating a New Skill

```bash
# 1. Copy template to target location
cp -r _TEMPLATE my-new-skill

# 2. Fill in content
#    - SKILL.md: frontmatter + categories + quick reference
#    - rules/_sections.md: define sections with prefixes
#    - rules/prefix-name.md: individual rules

# 3. Optional: create AGENTS.md (compiled version of all rules)
```

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Skill directory | `kebab-case` | `test-driven-development` |
| Rule files | `prefix-description.md` | `async-parallel.md` |
| Prefix | Section ID from `_sections.md` | `async-`, `bundle-`, `state-` |
| Special files | Start with `_` | `_template.md`, `_sections.md` |

## Impact Levels

| Level | Meaning |
|-------|---------|
| `CRITICAL` | Foundational — ignoring this causes major problems |
| `HIGH` | Significant — clear, measurable improvement |
| `MEDIUM` | Good practice — cleaner, more maintainable work |
| `LOW` | Incremental — micro-optimization or edge case |

## Quality Checklist

Before adding a skill to the library:

- [ ] `SKILL.md` has clear trigger conditions (when to apply)
- [ ] Rules use **Incorrect / Correct** examples (not just theory)
- [ ] Each rule covers one thing — no compound rules
- [ ] Impact levels are honest (not everything is CRITICAL)
- [ ] Frontmatter `description` is specific enough for agents to auto-trigger
- [ ] No duplicate rules across existing skills
