---
name: jira-ticket-create
description: >
  Create Jira tickets (Epic/Story/Task/Bug/Sub-task/Improvement) on the PH project
  using MCP RAI tools, following the embedded PaymentHub description template.
  Use when user says "tạo ticket", "create Jira issue", "mở task cho yêu cầu này",
  "làm ticket từ mô tả", or wants to turn a ticket-less request into a Jira ticket
  (often as the first step before running an RAI build flow).
  Reuse an existing task ticket. When none exists, create and verify one; return to
  the enclosing authorized RAI build task, or finish if creation was requested alone.
metadata:
  author: kiro-agent
  version: "1.1.0"
  chain_id: PHARMACY
  project_key: PH
  mcp_tools:
    - jira_list_project_fields
    - jira_create_issue
    - jira_get_issue
    - jira_search
    - jira_add_comment
---

# Jira Ticket Create

Create a Jira ticket on project **PH** from a user request, filling fields per the PaymentHub
convention and the embedded description template below. Inspect MCP capabilities, confirm
the composed content in chat, create and verify the ticket, then return to the enclosing task.

## When to Apply

Reference this skill when:

- User asks to create a ticket from a description: "tạo ticket cho yêu cầu hiển thị phí..."
- An authorized RAI coding/fix request has no existing ticket and needs one for its build flow
- User wants to batch-create related tickets (one Epic + sub-tasks)

**Do NOT apply when:**

- User asks for a status change on an existing ticket → use [jira-ticket-transition](../jira-ticket-transition/SKILL.md)
- The coding/fix task already has a ticket → reuse it; do not create another to start RAI
- Code/branch/MR/deploy work itself → the enclosing build/ship workflow owns those actions;
  this skill only supplies its missing-ticket step
- User only wants to read/analyze/list tickets → use `jira_get_issue` / `jira_search` directly, no skill

## Scope (HIGH)

Execute ticket creation (+ optional audit comment). Creating a ticket is a WRITE to Jira —
confirm the composed content with the user before calling the create tool.

**Chaining into build:** This skill is often the "no ticket yet" entry step of a RAI build task.
- If the enclosing task requests coding/fixing and already chose **RAI**, after creation and verification,
  continue straight into the RAI build flow with the new `issue_key` — do NOT ask the RAI/No-RAI
  question again, and do NOT stop to hand off. Follow [jira-rai-build](../workflows/jira-rai-build.md).
- If this skill was invoked on its own (just "tạo ticket", no build intent), stop after create +
  report the new key/URL. Do not start a flow.

Before composing, extract an existing key/URL from the task and read it when present. If an
existing ticket is mentioned but unresolved, resolve its key/access rather than create a
replacement. Search likely duplicates via callable Jira search when the task suggests prior
work; a similar ticket is a lead to check with the user, not an automatic substitution.
An explicit request for a distinct follow-up ticket is separate creation scope; keep its
relationship clear. Build phases remain owned by the enclosing workflow, not this skill.

## Rules

### 1. Pre-Execution (CRITICAL)

#### `pe-read-skill-first`
Read this SKILL.md fully before creating anything. Knowing the name is not execution.

#### `pe-verify-mcp-tools`
Confirm these RAI tools are callable before proceeding; if any required one is missing, report and stop:
- `jira_create_issue` (preserve the approved summary/description and parent fields)
- `jira_list_project_fields` (to validate required fields)
- `jira_get_issue` (verify result after create)
- `jira_add_comment` only if an audit comment was requested; its absence does not block creation

If an RAI call fails with connection/authentication error → run [rai-token-refresh](../rai-token-refresh/SKILL.md) once, reconnect, then retry before reporting a blocker.

#### `pe-gather-required-input`
User fills **basic fields only**; agent writes the rest.
- Basic fields: **summary**, **issue_type**, and **parent_key** for a Sub-task. Reuse explicit task
  inputs; propose a summary from the request rather than making the user repeat it. Ask for an
  unclear type or missing parent; never invent them. **epic_key** is a separate optional association.
- Agent writes the **description** itself from the embedded template (do not ask the user to write it).
- Optional fields (components, labels, priority) use PH defaults below unless the user overrides.

This skill's default project/template is `PH`. For an explicit other project, validate its
available fields and use the requested project; do not silently create in PH. Gather any
additional mandatory fields returned for the actual project/type before requesting approval.

#### `pe-confirm-before-write`
Show the user the composed ticket (summary + type + description + key fields) and get an OK
before calling the create tool. Do not create silently.

### 2. MCP Tool Usage (HIGH)

#### `mcp-validate-fields-first`
Before `jira_create_issue`, call `jira_list_project_fields(project_key=<actual project>, issue_type=<type>)`.
Validate required fields, allowed values, and supported tool parameters. Gather missing required
assignee/component/custom fields as needed; do not invent IDs or treat a configured default as
proof the project accepts it. Include all gathered fields in the draft for approval.

#### `mcp-choose-create-tool`
- Draft from the user's intent locally using the template; `jira_create_from_intent` creates a
  real issue, so it is not a read-only drafting tool.
- Use `jira_create_issue` for the approved draft, passing the exact summary, description and
  supported fields. A Sub-task requires `parent_key`; an Epic association is not a substitute.
- If exact-field creation is unavailable, report the missing capability before writing; do not
  silently switch to a tool that can rewrite the approved content or omit its required parent.

#### `mcp-verify-after-create`
After create, call `jira_get_issue(<new key>)` and compare the returned summary/description and
required fields/parent with the approved draft. For omitted fields, use a supported exact-key
read/search, e.g. JQL `key = <new key> AND parent = <approved parent>` for a Sub-task, when available.
If the field still cannot be verified, report that limit instead of claiming it matched.
Report the new key + Jira URL.
Do not start the dependent build on an unverified or mismatched ticket.
After a timeout/unknown create result, inspect returned keys or search for the approved issue
before retrying. Do not create duplicates or silently update mismatched content.

#### `mcp-optional-audit-comment`
Add an audit comment only when requested/authorized; ticket creation does not require one.

### 3. Defaults for PH project

Use these unless the user overrides:

| Field | Default |
|-------|---------|
| project_key | `PH` |
| components | `["Payment Hub"]` |
| priority | `Medium` |
| assignee | ask, or the current developer's Jira username if creating their own task |
| labels | infer from scope; leave empty if unclear |

Common label groups seen on PH: `Hub_NT`, `Hub_ICT`, `Hub_Core`, `Hub_VAC`, `Hub_LAB`,
`AIN`, `AI_Native`, `bug`, `improvement`, `web-rsa`, `webNB`, `webcustomer`.

Common issue types: `Story`, `Bug`, `Task`, `Sub-task`, `Improvement`, `Epic`.

## Description Template (PaymentHub wiki-markup)

Fill this into the `description` field. Keep headings; drop sections that genuinely do not apply.
Jira PH uses wiki-markup `h4.` headings and `*` bullets.

```
h4. Mục tiêu
<one or two lines: what outcome this ticket delivers>

h4. Nội dung công việc
* <concrete task 1>
* <concrete task 2>
* <concrete task 3>

h4. Quyết định áp dụng
* <any agreed decision / constraint — omit if none>

h4. Output
<deliverables expected when done>

h4. Exit gate
* <condition 1 that marks this done / acceptance criterion>
* <condition 2>

h4. Dependency
<blocking ticket(s) or external dependency — omit if none>

*Ref:* <link to doc / Confluence / Figma, if any>
```

### Template variants by issue type

- **Bug**: replace `Mục tiêu` with `h4. Mô tả lỗi` + add `h4. Steps tái hiện`, `h4. Expected`, `h4. Actual`.
- **Improvement**: keep `Mục tiêu` focused on the UX/behavior change and why.
- **Sub-task**: keep it short — `Nội dung công việc` + `Exit gate`; always set a verified
  `parent_key`. Pass `epic_key` only as a separate supported association when applicable.

## Examples

<Correct>
User: "tạo ticket: hiển thị khoản phí và tooltip tổng tiền ở trang thanh toán web nội bộ"

Agent:
1. Reads this SKILL.md
2. jira_list_project_fields(project_key="PH", issue_type="Story")
3. Drafts ticket:
   - project_key: PH
   - issue_type: Story
   - summary: "[Web NB] Hiển thị khoản phí và tooltip tổng tiền trong trang thanh toán"
   - components: ["Payment Hub"], priority: Medium, labels: ["Hub_NT"]
   - description: (template filled)
4. Shows draft to user → gets OK
5. jira_create_issue(...) with the exact approved fields
6. jira_get_issue(new_key) → report key + URL
</Correct>

<Correct>
User requests coding/fixing without a ticket and selects RAI for that task.
Agent: prepares the missing ticket, validates fields, gets draft approval in chat, creates and
verifies it, sends its URL, then resumes jira-rai-build using the new key and existing mode/scope.
</Correct>

<Incorrect>
User: "fix PH-1234 bằng RAI"
Agent creates another issue instead of reusing PH-1234.
Also incorrect: starting a build after a standalone "tạo ticket" request with no coding intent.
</Incorrect>

## Execution Checklist

- [ ] Read this SKILL.md completely
- [ ] Reuse an existing task ticket; resolve a referenced ticket before considering creation
- [ ] Verify exact-field create/list/get MCP tools are callable (refresh token if auth fails)
- [ ] Gather summary + issue_type + parent_key for Sub-task, and any additional required fields
- [ ] Validate fields via `jira_list_project_fields`
- [ ] Compose description from the embedded template
- [ ] Apply PH defaults (components / priority / labels)
- [ ] Confirm the composed ticket with the user before writing
- [ ] Create via `jira_create_issue` using the exact approved fields
- [ ] Verify with `jira_get_issue`, report new key + **Jira URL**
- [ ] Add audit comment only if authorized
- [ ] If this is a RAI build task: continue straight into [jira-rai-build](../workflows/jira-rai-build.md) with the new issue_key (no re-ask). If stand-alone create: stop here.

---

**Version:** 1.1.0
**Author:** kiro-agent
**Chain:** PHARMACY
**Project:** PH
**Status:** Production Ready
