---
name: jira-ticket-transition
description: >
  Transition Jira tickets to a target status using MCP RAI tools.
  Use when user says "transition PH-XXX to status Y", "move ticket to", "change Jira status", 
  or "update ticket status". Enforces strict scope: ONLY transition + comment, no extra actions.
metadata:
  author: kiro-agent
  version: "1.0.0"
  chain_id: PHARMACY
  mcp_tools:
    - jira_get_issue
    - jira_get_transitions
    - jira_transition
    - jira_add_comment
---

# Jira Ticket Transition

Transition Jira tickets to a target status. Enforces strict execution scope: read MCP capabilities, use only existing tools, execute ONLY requested scope.

## When to Apply

Reference this skill when:

- User requests ticket status change: "transition PH-346 to Review Build"
- User provides ticket URL and target status
- Batch transitions requested: "move PH-346, PH-286, PH-389 to Review Build"

**Do NOT apply when:**

- User asks for code changes or branch creation -> follow [task-workflow](../workflows/task-workflow.md)
- User asks for MR creation or deployment -> follow [task-workflow](../workflows/task-workflow.md)
- User asks for ticket content modification beyond status (consult user first)

## Categories by Priority

| Priority | Category | Impact | Rule Prefix |
|----------|----------|--------|------------|
| 1 | Pre-Execution Rules | CRITICAL | `pe-` |
| 2 | MCP Tool Usage | HIGH | `mcp-` |
| 3 | Execution Scope | HIGH | `es-` |

## Rules

### 1. Pre-Execution Rules (CRITICAL)

#### `pe-read-skill-first`

**MANDATORY FIRST STEP:** Before executing ANY transition request:

1. Read this skill file completely
2. Verify all rules are understood
3. Confirm request aligns with scope
4. Check MCP tool availability

**Do NOT proceed without reading and confirming.**

#### `pe-verify-mcp-tools`

Check that required MCP RAI tools are available:

- `jira_get_issue` — fetch ticket details
- `jira_get_transitions` — list available transitions
- `jira_transition` — execute status change
- `jira_add_comment` — add transition comment

If an RAI call fails with connection/authentication error → run [rai-token-refresh](../rai-token-refresh/SKILL.md) once, reconnect, then retry before reporting a blocker. If any required tool remains unavailable → **REPORT IMMEDIATELY**, do not work around.

#### `pe-extract-issue-key`

Extract Jira issue key from user request. Accept formats:

- `PH-346` (ticket ID only)
- `https://reqs.frt.vn/browse/PH-346` (full URL)
- `PH-346, PH-286, PH-389` (comma-separated list)

If no issue key found → **ask user to provide it**.

#### `pe-clarify-target-status`

Ask user for target status if not provided:

```
User says: "transition PH-346"

Agent responds:
"What status should I move PH-346 to?
Examples: Review Build, In Progress, Done, Testing
Please specify."
```

Acceptable status names from RAI workflow:
- `Review Build` (Phase B3 — dev ready for CI)
- `In Progress`
- `Testing`
- `Done`
- (Others per project Jira configuration)

**Do NOT guess target status.**

### 2. MCP Tool Usage (HIGH)

#### `mcp-fetch-transitions-first`

Before calling `jira_transition()`, always fetch available transitions for the ticket:

```python
jira_get_transitions(issue_key="PH-346")
# Returns list of allowed status names per current ticket state
```

**Why:** Prevents invalid transitions. Different statuses allow different targets.

**Do NOT assume transition exists — verify it first.**

#### `mcp-use-exact-transition-name`

Use the EXACT transition name returned by `jira_get_transitions()`:

<Incorrect>
```python
# User says: "move to Review Build"
# Agent assumes transition name
jira_transition(issue_key="PH-346", transition_name="Review Build")
```
</Incorrect>

<Correct>
```python
# Step 1: Fetch available transitions
transitions = jira_get_transitions(issue_key="PH-346")
# Returns: [{"name": "Start Review", "id": "11"}, {"name": "Ready for CI", "id": "12"}, ...]

# Step 2: Find matching transition (may differ from user's wording)
target = next((t for t in transitions if "review" in t["name"].lower()), None)
if not target:
    # Report to user
    return f"No transition to Review Build. Available: {[t['name'] for t in transitions]}"

# Step 3: Use exact name from API
jira_transition(issue_key="PH-346", transition_name=target["name"])
```
</Correct>

#### `mcp-add-comment-after-transition`

After successful transition, add a comment documenting the change:

```python
jira_add_comment(
    issue_key="PH-346",
    comment_body="✅ Status transitioned to Review Build by AI agent.\n\nAutomated transition via MCP RAI tools."
)
```

**Why:** Audit trail — team can see automated changes in Jira history.

### 3. Execution Scope (HIGH)

#### `es-no-scope-expansion`

Execute ONLY what was requested. STOP if user asks for anything outside:

| Request | Execute? | Reason |
|---------|----------|--------|
| "Transition PH-346 to Review Build" | ✅ YES | Core scope |
| "Transition PH-346 AND create branch" | ✅ Transition ONLY | Branch belongs to build workflow scope |
| "Transition PH-346 AND write code" | ✅ Transition ONLY | Code belongs to build workflow scope |
| "Transition PH-346 AND create MR" | ✅ Transition ONLY | MR belongs to build workflow scope |
| "Transition PH-346 AND deploy" | ✅ Transition ONLY | Deploy is ship/deployment scope |

**If user bundles requests:**
- Execute transitions only
- List other requests separately
- Suggest user proceed via [task-workflow](../workflows/task-workflow.md) for remaining coding/delivery work

<Incorrect>
User: "transition PH-346 to Review Build and move forward with dev flow"

Agent: (creates branch, pushes code, creates MR automatically)
</Incorrect>

<Correct>
User: "transition PH-346 to Review Build and move forward with dev flow"

Agent:
1. Transition PH-346 to Review Build ✅
2. For next steps (branch/code/MR): route through [task-workflow](../workflows/task-workflow.md) (**RAI / No RAI**).
</Correct>

#### `es-single-concern-per-execution`

Each execution focuses on ONE concern: status transition.

Do NOT combine with:
- Code generation
- File editing
- Branch creation
- Testing
- Deployment
- Documentation updates (unless part of transition comment)

#### `es-report-missing-capabilities`

If required tool is unavailable or fails:

```
MCP tool unavailable: jira_get_transitions
Cannot proceed with transition.

Available tools:
- jira_get_issue ✅
- jira_transition ✗ (needs jira_get_transitions to verify first)
- jira_add_comment ✅

Action: Contact admin to verify MCP RAI server connectivity.
```

**Do NOT work around missing tools — report and stop.**

#### `es-batch-transitions-sequential`

When transitioning multiple tickets:

```python
issue_keys = ["PH-346", "PH-286", "PH-389"]

for issue_key in issue_keys:
    # Step 1: Fetch transitions for THIS ticket
    transitions = jira_get_transitions(issue_key=issue_key)
    
    # Step 2: Find target transition
    target = find_transition(transitions, "Review Build")
    if not target:
        print(f"⚠️ {issue_key}: No Review Build transition available. Skipping.")
        continue
    
    # Step 3: Execute transition
    jira_transition(issue_key=issue_key, transition_name=target["name"])
    
    # Step 4: Add comment
    jira_add_comment(issue_key=issue_key, comment_body="✅ Transitioned to Review Build")
    
    # Step 5: Report result
    print(f"✅ {issue_key}: Transitioned to Review Build")
```

**Why sequential:** Allows partial success — if PH-346 succeeds but PH-286 fails, user knows which ones passed.

## Execution Checklist

Before executing ANY transition:

- [ ] Read this SKILL.md completely
- [ ] Verify MCP tools available (jira_get_issue, jira_get_transitions, jira_transition, jira_add_comment)
- [ ] Extract issue key(s) from user request
- [ ] Clarify target status if not provided
- [ ] Confirm request scope = transitions ONLY
- [ ] Fetch available transitions via `jira_get_transitions()`
- [ ] Execute transitions using exact transition names from API
- [ ] Add audit comment to each ticket
- [ ] Report results

## How to Use

When user says: "transition PH-346 to Review Build"

```
1. Agent reads this SKILL.md ✅
2. Agent verifies MCP tools available ✅
3. Agent calls jira_get_transitions(issue_key="PH-346") ✅
4. Agent finds matching transition for "Review Build" ✅
5. Agent calls jira_transition(...) with exact transition name ✅
6. Agent calls jira_add_comment(...) with audit message ✅
7. Agent reports: "✅ PH-346 transitioned to Review Build"
```

## Full Compiled Document

For expanded examples and additional context: `AGENTS.md` (when available)

---

**Version:** 1.0.0
**Author:** kiro-agent
**Chain:** PHARMACY
**Last Updated:** 2026-06-29
**Status:** Production Ready
