---
name: rai-token-refresh
description: Refresh the RAI MCP access token, reconnect, and resume after expired tokens, HTTP 401, Authentication required tool errors, or connection failures, including read-only discovery calls.
---

# RAI token refresh

This skill is an authentication and connection recovery utility for the RAI MCP server; it does not require choosing a RAI task workflow.

## Run

From the repository or workspace root containing `.agent/`, run [refresh-token.ps1](scripts/refresh-token.ps1):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".agent/rai-token-refresh/scripts/refresh-token.ps1" -Force
```

Without `-Force`, a JWT with more than 120 seconds remaining is reused. `-MinValiditySeconds` adjusts that margin. Normal output is JSON containing status and expiry only; exit code 1 means failure.

- Credentials live in `.agent/rai-token-refresh/.env` (created locally from [.env.example](.env.example)): `KEYCLOAK_USERNAME` and `KEYCLOAK_PASSWORD`. Edit this local `.env` when your password changes; each refresh reads it again, independently of the current working directory. Never print credentials or token-bearing MCP configuration, or embed them in scripts, reports, or commands.
- Keep the local `.env` excluded from version control via [.gitignore](.gitignore). Deploy or share scripts and instructions without including or overwriting `.env`.
- By default, the script inspects `%USERPROFILE%/.kiro/settings/mcp.json` or `%USERPROFILE%/.gemini/config/mcp_config.json` for server `rai`, updates its `Authorization` header (syncing both files when both define `rai`), waits 1s, and triggers `RefreshMcpServers` on any running `agy.exe` (Antigravity) instance, reporting `mcp_reloaded`. `-EnvFile`, `-ConfigPath`, and `-ServerName` support an explicitly selected configuration. The script accepts only trusted RAI HTTPS hosts (`rai.frt.vn` / `ai-dlc.frt.vn`) and updates only the selected server's `Authorization` header, preserving all other headers (`X-Jira-Token`, `X-Confluence-Token`, etc.) and servers.
- A failed request or invalid token leaves the existing config intact. Report missing credential names or the sanitized error; do not invent credentials or loop on rejected authentication.

## Codex automatic headers

For a local HTTP MCP connection in Codex, configure `mcp_servers.rai.http_headers_helper` to invoke this script with `-AsHeaders`. The helper returns the selected RAI server's headers, including the fresh `Authorization` and existing Jira/Confluence headers. This output contains credentials and must go directly to the MCP client; never run `-AsHeaders` into conversation output, transcripts, or log files.

`-AsHeaders` always renews the token, including when a still-unexpired JWT was rejected. Codex caches the returned headers and can rerun the helper once after an authentication failure. Remove competing RAI `env_http_headers` mappings and explicit static `Authorization` sources when installing the helper, while preserving unrelated MCP configuration and approval settings.

## Recover and continue the interrupted task

Whenever an attempted RAI MCP operation cannot connect or authentication fails, perform this recovery without asking for refresh permission or another workflow choice. This includes read-only tool discovery/metadata requests, expired-token errors, HTTP 401, and a tool result containing `Authentication required` (including `isError: true` even when HTTP succeeds). Merely describing the refresh command or immediately asking the user to refresh does not complete recovery; run [refresh-token.ps1](scripts/refresh-token.ps1) first.

1. Preserve the pending operation, ticket, existing flow `session_id`, and current checkpoint. Run the refresh script above with `-Force` once. It reads the local `.env`, updates the RAI `Authorization` header in MCP configuration, waits 1s, and automatically calls Antigravity's local `RefreshMcpServers` endpoint (`mcp_reloaded: true`); do not rebuild unrelated MCP settings.
2. After a successful refresh (`mcp_reloaded: true`), immediately retry a safe read or resume the interrupted operation. If `mcp_reloaded` is false and the client has no other reconnect operation, report the exact reconnect/restart needed and retain the pending task for continuation.
3. On a successful connection, continue the original unfinished task from its existing session/checkpoint. Retry the interrupted safe read; do not create another flow session or restart completed phases. For a Jira/Confluence write or workflow mutation with an unknown outcome, first read its status and reconcile the result rather than blindly replaying it. Continue to honor blocking HITL checkpoints.
4. If refresh or the single reconnect attempt still fails, report the sanitized error and pending operation; stop the dependent RAI work without a retry loop or a silent switch to direct mode. Do not claim authentication was repaired from a token request alone.

## Verify script behavior offline

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".agent/rai-token-refresh/scripts/test-refresh-token.ps1"
```

The tests mock HTTP and use temporary fixture credentials. They verify token expiry/force behavior, header output, failure preservation, secret-free normal output, isolation from other servers, default local `.env` discovery, and password changes on the next refresh.
