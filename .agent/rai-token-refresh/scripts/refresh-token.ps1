[CmdletBinding()]
param(
    [string]$EnvFile,
    [string]$ConfigPath = (Join-Path $env:USERPROFILE '.kiro/settings/mcp.json'),
    [string]$ServerName = 'rai',
    [ValidateRange(0, 1800)][int]$MinValiditySeconds = 120,
    [switch]$Force,
    [switch]$AsHeaders
)

$ErrorActionPreference = 'Stop'
$failureMessage = 'Unable to read the RAI MCP configuration.'
$temporaryPath = $null

function Get-RaiTokenExpiry([string]$Token) {
    try {
        $parts = $Token.Split('.')
        if ($parts.Length -ne 3) { return $null }
        $payload = $parts[1].Replace('-', '+').Replace('_', '/')
        $payload = $payload.PadRight($payload.Length + ((4 - $payload.Length % 4) % 4), '=')
        $decoded = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload)) | ConvertFrom-Json
        if ($null -eq $decoded.exp) { return $null }
        return [long]$decoded.exp
    } catch { return $null }
}

function Sync-SecondaryRaiConfig([string]$TargetPath, [string]$ServerKey, [string]$BearerValue) {
    $resolved = (Resolve-Path -LiteralPath $TargetPath).Path
    $raw = [IO.File]::ReadAllText($resolved)
    $parsed = $raw | ConvertFrom-Json
    $prop = $parsed.mcpServers.PSObject.Properties[$ServerKey]
    if (-not $prop) { return }
    $srv = $prop.Value
    $uri = [uri]$srv.url
    if ($uri.Scheme -ne 'https' -or $uri.Host -notin @('rai.frt.vn', 'ai-dlc.frt.vn') -or $uri.AbsolutePath.TrimEnd('/') -ne '/mcp') {
        return
    }
    if ($srv.headers -and $srv.headers.Authorization -ceq $BearerValue) { return }
    if (-not $srv.headers) { $srv | Add-Member -NotePropertyName headers -NotePropertyValue ([pscustomobject]@{}) -Force }
    if ($srv.headers.PSObject.Properties['Authorization']) {
        $srv.headers.Authorization = $BearerValue
    } else {
        $srv.headers | Add-Member -NotePropertyName Authorization -NotePropertyValue $BearerValue
    }
    $tmp = $resolved + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
    try {
        [IO.File]::WriteAllText($tmp, ($parsed | ConvertTo-Json -Depth 100), [Text.UTF8Encoding]::new($false))
        if ([IO.File]::ReadAllText($resolved) -cne $raw) { throw 'Concurrent config edit' }
        try {
            [IO.File]::Replace($tmp, $resolved, [NullString]::Value)
        } catch {
            [IO.File]::Copy($tmp, $resolved, $true)
            [IO.File]::Delete($tmp)
        }
    } finally {
        if ([IO.File]::Exists($tmp)) { [IO.File]::Delete($tmp) }
    }
}

function Invoke-AntigravityMcpReload {
    $procs = @(Get-CimInstance Win32_Process -Filter "Name = 'agy.exe'" -ErrorAction SilentlyContinue)
    $reloaded = $false
    foreach ($proc in $procs) {
        $cmd = [string]$proc.CommandLine
        if ($cmd -match '--hub-port=(\d+)') {
            $port = $matches[1]
            $csrf = if ($cmd -match '--csrf_token=([^\s"]+)') { $matches[1] } else { '' }
            $headers = @{ 'Connect-Protocol-Version' = '1' }
            if ($csrf) { $headers['x-codeium-csrf-token'] = $csrf }
            try {
                $resp = Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:$port/exa.language_server_pb.LanguageServerService/RefreshMcpServers" `
                    -Headers $headers -ContentType 'application/json' -Body '{}' -UseBasicParsing -TimeoutSec 30
                if ($resp.StatusCode -eq 200) { $reloaded = $true }
            } catch {}
        }
    }
    return $reloaded
}

try {
    $agyDefaultConfig = Join-Path $env:USERPROFILE '.gemini/config/mcp_config.json'
    if (-not $PSBoundParameters.ContainsKey('ConfigPath') -and (Test-Path -LiteralPath $agyDefaultConfig -PathType Leaf)) {
        if (-not (Test-Path -LiteralPath $ConfigPath -PathType Leaf)) {
            $ConfigPath = $agyDefaultConfig
        } else {
            try {
                $kiroCandidate = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $ConfigPath).Path) | ConvertFrom-Json
                if (-not $kiroCandidate.mcpServers -or -not $kiroCandidate.mcpServers.PSObject.Properties[$ServerName]) {
                    $ConfigPath = $agyDefaultConfig
                }
            } catch {
                $ConfigPath = $agyDefaultConfig
            }
        }
    }
    $configPathResolved = (Resolve-Path -LiteralPath $ConfigPath).Path
    $originalConfig = [IO.File]::ReadAllText($configPathResolved)
    $config = $originalConfig | ConvertFrom-Json
    $failureMessage = 'The selected MCP server is missing or is not a trusted RAI HTTPS endpoint.'
    $serverProperty = $config.mcpServers.PSObject.Properties[$ServerName]
    if (-not $serverProperty) { throw 'Invalid server' }
    $server = $serverProperty.Value
    $address = [uri]$server.url
    if ($address.Scheme -ne 'https' -or $address.Host -notin @('rai.frt.vn', 'ai-dlc.frt.vn') -or $address.AbsolutePath.TrimEnd('/') -ne '/mcp') {
        throw 'Invalid endpoint'
    }

    $currentToken = ''
    if ($server.headers -and $server.headers.Authorization -match '^Bearer\s+(.+)$') { $currentToken = $matches[1] }
    $expiresAt = Get-RaiTokenExpiry $currentToken
    $now = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $needsRefresh = $Force -or $AsHeaders -or -not $expiresAt -or ($expiresAt - $now -le $MinValiditySeconds)
    $status = 'valid'

    if ($needsRefresh) {
        $failureMessage = 'Unable to locate rai-token-refresh/.env; create the local credential file or pass -EnvFile explicitly.'
        if (-not $EnvFile) { $EnvFile = Join-Path (Split-Path -Parent $PSScriptRoot) '.env' }
        if (-not $EnvFile -or -not (Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw 'Missing environment file' }

        $failureMessage = 'Unable to read KEYCLOAK_USERNAME and KEYCLOAK_PASSWORD from the credential file.'
        $credentials = @{}
        foreach ($line in [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $EnvFile).Path)) {
            if ($line -match '^\s*(?:export\s+)?(KEYCLOAK_USERNAME|KEYCLOAK_PASSWORD)\s*=\s*(.*?)\s*$') {
                $name = $matches[1]
                $value = $matches[2]
                if ($value.Length -ge 2 -and (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'")))) {
                    $value = $value.Substring(1, $value.Length - 2)
                }
                $credentials[$name] = $value
            }
        }
        if ([string]::IsNullOrWhiteSpace($credentials['KEYCLOAK_USERNAME']) -or [string]::IsNullOrWhiteSpace($credentials['KEYCLOAK_PASSWORD'])) {
            throw 'Missing credential'
        }

        # Preserve the existing Kiro authentication contract; credentials never leave this endpoint.
        $failureMessage = 'Keycloak token request failed. Check connectivity and local credentials; the MCP config was not changed.'
        $response = Invoke-RestMethod -Method Post -Uri 'https://keycloak.frt.vn/realms/ain-prod/protocol/openid-connect/token' `
            -ContentType 'application/x-www-form-urlencoded' -TimeoutSec 20 -MaximumRedirection 0 -Body @{
                grant_type = 'password'
                client_id = 'portal'
                username = $credentials['KEYCLOAK_USERNAME']
                password = $credentials['KEYCLOAK_PASSWORD']
                scope = 'openid email profile offline_access'
            }
        $failureMessage = 'Keycloak returned no usable, unexpired access token; the MCP config was not changed.'
        $newToken = [string]$response.access_token
        $expiresAt = Get-RaiTokenExpiry $newToken
        if ([string]::IsNullOrWhiteSpace($newToken) -or -not $expiresAt -or $expiresAt -le [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()) {
            throw 'Invalid token response'
        }

        if (-not $server.headers) { $server | Add-Member -NotePropertyName headers -NotePropertyValue ([pscustomobject]@{}) -Force }
        if ($server.headers.PSObject.Properties['Authorization']) {
            $server.headers.Authorization = 'Bearer ' + $newToken
        } else {
            $server.headers | Add-Member -NotePropertyName Authorization -NotePropertyValue ('Bearer ' + $newToken)
        }
        $failureMessage = 'Unable to save the refreshed RAI token. No other MCP server was updated.'
        $temporaryPath = $configPathResolved + '.' + [guid]::NewGuid().ToString('N') + '.tmp'
        [IO.File]::WriteAllText($temporaryPath, ($config | ConvertTo-Json -Depth 100), [Text.UTF8Encoding]::new($false))
        # Refuse to overwrite a concurrent edit made while the token request was in flight.
        if ([IO.File]::ReadAllText($configPathResolved) -cne $originalConfig) { throw 'Concurrent config edit' }
        try {
            [IO.File]::Replace($temporaryPath, $configPathResolved, [NullString]::Value)
        } catch {
            [IO.File]::Copy($temporaryPath, $configPathResolved, $true)
            [IO.File]::Delete($temporaryPath)
        }
        $temporaryPath = $null
        $status = 'refreshed'
    }

    $mcpReloaded = $false
    if (-not $PSBoundParameters.ContainsKey('ConfigPath') -and -not $AsHeaders -and (Test-Path -LiteralPath $agyDefaultConfig -PathType Leaf)) {
        $agyResolved = (Resolve-Path -LiteralPath $agyDefaultConfig).Path
        if ($agyResolved -ne $configPathResolved -and $server.headers -and $server.headers.Authorization -match '^Bearer\s+.+$') {
            try { Sync-SecondaryRaiConfig $agyResolved $ServerName $server.headers.Authorization } catch {}
        }
        Start-Sleep -Seconds 1
        try { $mcpReloaded = Invoke-AntigravityMcpReload } catch {}
    }

    if ($AsHeaders) {
        # Secret-bearing output: only an MCP client should consume this mode. Never log it.
        $headers = [ordered]@{}
        foreach ($header in $server.headers.PSObject.Properties) {
            if ($header.Value -is [string]) { $headers[$header.Name] = $header.Value }
        }
        $headers | ConvertTo-Json -Compress -Depth 5
    } else {
        [ordered]@{
            status = $status
            server = $ServerName
            expires_at_utc = [DateTimeOffset]::FromUnixTimeSeconds($expiresAt).ToString('u')
            remaining_seconds = [Math]::Max(0, $expiresAt - [DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
            config_updated = ($status -eq 'refreshed')
            mcp_reloaded = $mcpReloaded
        } | ConvertTo-Json -Compress
    }
} catch {
    # Never expose raw exceptions, response bodies, usernames, passwords, or tokens.
    [ordered]@{ status = 'error'; message = $failureMessage } | ConvertTo-Json -Compress
    exit 1
} finally {
    if ($temporaryPath -and [IO.File]::Exists($temporaryPath)) { [IO.File]::Delete($temporaryPath) }
}
