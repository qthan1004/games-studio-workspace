# Launching crew in different IDEs and CLIs

Every launcher uses the same contract: the crew reads `brief.md` and `crew/SKILL.md` and nothing else is IDE-specific. `fleet.mjs spawn` prints a `launch_line` that works anywhere. Add `--clip` to copy it to the clipboard.

## A. IDE window per worktree (opt-in, semi-automatic)

| IDE | Open the worktree | Start the crew |
|---|---|---|
| Antigravity | `--open antigravity` if its CLI is on PATH, otherwise File > Open Folder `<repo>-wt/<id>` | New agent conversation. Run `/crew <run>/<id>` if the workflow is installed, or paste the `launch_line` |
| VS Code + Codex extension | `--open code` | Codex panel: paste the `launch_line`, or use a custom prompt `crew` (copy `workflows/crew.md` into `~/.codex/prompts/`) |
| Kiro | `--open kiro` | Agent chat: paste the `launch_line`. Optionally keep `crew/SKILL.md` as a manual steering file |
| Cursor | `--open cursor` | Agent chat: paste the `launch_line` |
| Claude Code (IDE or terminal) | open the folder | `/crew` if the commands folder is installed, otherwise paste the `launch_line` |

Notes:

- Use this route only when the user requests IDE windows; do not open or move their workspace view by default. Never point two crews at one worktree.
- The shared workflow and [task scoring/model mapping](delegated-workflow.md#task-model-selection) apply to both Codex and Antigravity. Verify the chosen runtime's delegation and model/effort controls before launch; an open-folder command is not proof of automated subagent dispatch. Record unavailable controls instead of pretending Codex flags work in AG.
- The project-scoped MCP (for example `ts-checkout`) must be bound to the worktree path, or the crew states the limitation and falls back as `personal-behavior` allows.
- Each worktree needs its own install (for example `npm ci`) before tests. The crew does this as its first step only if the brief allows it; worktrees share git objects, not `node_modules`.

## B. Agent CLI in a Windows Terminal tab (optional, automatic)

Workspace requirement confirmed by the user: launch Codex workers and dedicated reviewers interactively so the user can observe their work, including when only one agent is requested. "Sub-agent" and concurrency changes do not select the native adapter; an explicit user choice is required to override interactive CLI. Use the real `codex` TUI with an initial prompt referencing the filled brief; showing `codex exec` output in a window is still non-interactive. Visible terminal tabs/windows are authorized for these requested runs; keep the existing IDE workspace unchanged. An already-running batch may finish before switching launch mode; never launch a duplicate writer to change presentation.

Before launch, record the adapter and actual CLI command, captain preflight receipt, selected model/effort and existing permission/stop boundaries. The crew's first checkpoint records its own entrypoint/PREFLIGHT reads and completed applicable skill routing before dependent edits. If the required interactive CLI cannot launch, preserve the checkpoint and report the concrete failure; do not fall back to native agents or headless CLI without an explicit adapter change from the user.

The interactive process may remain open after a task finishes. Watch an explicit crew checkpoint/report with task ID, scope, verification and completion state; process exit is not the completion signal. Use code-based event/file waiting instead of waking an LLM on every heartbeat. Preserve the actual session ID for targeted follow-up and obtain usage only from telemetry supported by that runtime. Do not assume the `exec --json` interface applies to the TUI.

The user requests automatic terminal cleanup after each worker/reviewer finishes. Once its terminal checkpoint is complete and writes have stopped, close only the run-owned CLI and its tab/window, using the recorded launcher identity and verifying process ownership. Keep reports, logs, checkpoints and session identity for review/resume. Never terminate all Windows Terminal instances, unrelated user shells, or an active writer. Remove idle launcher shells too; avoid `-NoExit` for future task launchers. Terminal cleanup does not authorize branch/worktree/file deletion. If a tab cannot be identified safely, leave it and report the limitation.

Honor the user's configured full-access/no-prompt CLI defaults for these runs; do not silently override them with a read-only sandbox. Reviewers remain read-only by task instructions. Technical access does not grant unrelated edits, external mutations, push or merge. Keep credentials out of prompts/logs, and respect managed restrictions.

After preparing and filling the brief, launch the selected CLI in a visible terminal when authorized. Do not use `fleet.mjs spawn --cli`: spawn creates a TODO brief, so it must not also start a worker. The CLI forms are:

| Preset | Interactive (default) | `--headless` |
|---|---|---|
| claude | `claude "<launch_line>"` | `claude -p "<launch_line>"` |
| codex | `codex "<launch_line>"` | `codex exec "<launch_line>"` |
| gemini | `gemini -i "<launch_line>"` | `gemini -p "<launch_line>"` |

Verify flags with `<cli> --help` because they change between releases. Headless runs need the CLI's own permission settings. They still obey the brief's permissions; the CLI never gains push or merge authority.

## C. Overnight

There is no separate tool. Use the away posture ([away-mode](away-mode.md)) with A or B. Crews work in capped slices, and the captain verifies each one.
