param(
    [string]$Repo = '.'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (& git -C $Repo rev-parse --show-toplevel 2>$null)
if ($LASTEXITCODE -ne 0 -or -not $repoRoot) {
    throw 'Repo is not a Git repository.'
}

$branch = (& git -C $repoRoot branch --show-current)
$statusLines = @(& git -C $repoRoot status --short)
$stagedPaths = @(& git -C $repoRoot diff --cached --name-only)
$untrackedPaths = @(& git -C $repoRoot ls-files --others --exclude-standard)
$agentConfigCandidates = @($stagedPaths + $untrackedPaths | Where-Object {
    ($_ -replace '\\', '/') -match '^(\.agent/|\.agents/|\.kiro/|\.claude/|\.codex/|AGENTS\.md$|CLAUDE\.md$|GEMINI\.md$)'
} | Sort-Object -Unique)
$diffCheck = @(& git -C $repoRoot diff --cached --check 2>&1)
$diffCheckExit = $LASTEXITCODE

[pscustomobject]@{
    repo = $repoRoot
    branch = $branch
    status = $statusLines
    stagedPaths = $stagedPaths
    agentConfigCandidates = $agentConfigCandidates
    stagedDiffCheckPassed = ($diffCheckExit -eq 0)
    stagedDiffCheckOutput = $diffCheck
} | ConvertTo-Json -Depth 4 -Compress
