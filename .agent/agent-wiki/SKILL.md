---
name: agent-wiki
description: Read and manage domain wiki knowledge exclusively through Wiki MCP, with MCP-managed versions and history for changes.
---

# Agent wiki

Goal: reuse verified domain knowledge and keep every wiki operation traceable through a single MCP workflow.

Applies to workspace and repository wiki vaults, including `<workspace>/.agent-wiki/` and `<repo>/.agent-wiki/`.

## Mandatory access and versioning

- All wiki CRUD must use callable Wiki MCP tools: listing/search, reading, draft creation, updates, approval, retirement/deletion and management of indexes, registry, versions, archives and changelogs.
- Never access or change wiki content through direct filesystem reads/edits, Git content reads/restores, `wiki.mjs`, shell/Node/Python scripts or an alternative offline workflow. Changing a version field by hand is not versioning.
- Discover the relevant Wiki MCP tools and inspect their schemas before use. Do not invent tool names or route wiki operations through an unrelated document connector.
- Every creation or content-changing operation must use MCP-managed version/history metadata: identify the previous version when present, the resulting version and the change reason. Confirm the result through MCP before claiming success.
- If Wiki MCP is unavailable, fails, or cannot provide version/history for the requested mutation, stop the dependent wiki operation and report the missing capability. Continue independent code/document work. Do not silently fall back, edit the vault or claim a versioned update.
- Authorization to update a wiki does not authorize a different access path. Reuse explicit user authorization; otherwise obtain approval for the concrete proposed mutation before applying it through MCP.

## Read

1. Use MCP to load a small set of relevant domain notes, then search/open only the notes needed for the task.
2. Treat verified and current notes as evidence to check against current code. Stale, missing-source, observed or hypothetical notes are leads, not confirmed contracts.
3. If a note conflicts with code or the user contract, report and investigate the mismatch. Do not silently choose either one.
4. Ordinary ticket documents outside wiki vaults remain documents; read only the needed sections. Read test logs through the test-driven-development log digest.

## Create or update

Placement: cross-project behavior belongs in personal-behavior or an entrypoint; procedures belong in skills; long-form ticket material and execution evidence belong in documents/reports. Capture only durable domain facts in the wiki.

Capture triggers include user corrections, confirmed root causes, sourced domain decisions and reusable contract quirks. Do not automatically turn task chronology into a wiki note.

1. Read the current note and its version through MCP, or confirm that the note does not exist.
2. Prepare a concrete draft through MCP using supported fields: concise summary, tags, source pointer, confidence, tier and verified product branch/tag/commit. Keep the body focused on Fact / Why it matters / Evidence / How to apply.
3. Apply the authorized change through the MCP versioning workflow with a change reason. Preserve history; use MCP retirement/supersession for outdated notes.
4. Confirm content, resulting version and history through MCP. Report the note identifier and version. Clearly distinguish pending proposals or failed changes from completed updates.

Never store secrets, real customer data, unverified claims as facts, copies of code/long documents, or skill instructions in the wiki.

## Maintain

Use MCP for freshness checks, indexing and registry/history maintenance. Report stale sources and unresolved notes; do not use a local CLI as a fallback. If earlier changes bypassed MCP, disclose their known scope and reconcile through MCP when available, without another direct file edit.
