param([string]$ScriptPath = (Join-Path $PSScriptRoot 'refresh-token.ps1'))

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $ScriptPath)) {
    throw 'Refresh script is not implemented yet.'
}

$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('rai-refresh-test-' + [guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($testRoot) | Out-Null
$envFile = Join-Path $testRoot '.env'
$configFile = Join-Path $testRoot 'mcp.json'
$fixtureScriptDirectory = Join-Path $testRoot 'scripts'
[IO.Directory]::CreateDirectory($fixtureScriptDirectory) | Out-Null
$fixtureScript = Join-Path $fixtureScriptDirectory 'refresh-token.ps1'
Copy-Item -LiteralPath $ScriptPath -Destination $fixtureScript
$utf8 = [Text.UTF8Encoding]::new($false)
$global:RaiRefreshTestRequests = 0
$global:RaiRefreshTestFailure = $false
$global:RaiRefreshTestResponse = $null

function New-TestToken([int]$Lifetime, [string]$Id = 'test') {
    $payload = @{ exp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + $Lifetime; jti = $Id } | ConvertTo-Json -Compress
    $encoded = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($payload)).TrimEnd('=').Replace('+','-').Replace('/','_')
    return 'eyJhbGciOiJub25lIn0.' + $encoded + '.test-signature'
}

function Assert-Test([bool]$Condition, [string]$Message) {
    if (-not $Condition) { throw $Message }
}

function Reset-Fixture([string]$Token) {
    $config = @{
        mcpServers = @{
            rai = @{
                url = 'https://rai.frt.vn/mcp'
                headers = @{ Authorization = 'Bearer ' + $Token; 'X-Jira-Token' = 'jira-canary'; 'X-Member-Id' = 'member-canary' }
                autoApprove = @('read-only-tool')
            }
            unrelated = @{ url = 'https://other.example/mcp'; headers = @{ Authorization = 'Bearer unrelated-canary' } }
        }
        powers = @{ enabled = $false }
    }
    [IO.File]::WriteAllText($configFile, ($config | ConvertTo-Json -Depth 20), $utf8)
    [IO.File]::WriteAllText($envFile, "# fixture`nKEYCLOAK_USERNAME = 'test-user'`nKEYCLOAK_PASSWORD=`"password-canary=with=equals`"`n", $utf8)
    $global:RaiRefreshTestRequests = 0
    $global:RaiRefreshTestFailure = $false
    $global:RaiRefreshTestPassword = 'password-canary=with=equals'
    $global:RaiRefreshTestResponse = @{ access_token = New-TestToken 600 'new' }
}

# No HTTP request or real credential is used in this suite.
function global:Invoke-RestMethod {
    param($Method, $Uri, $ContentType, $Body, $TimeoutSec, $MaximumRedirection)
    $global:RaiRefreshTestRequests++
    if ($Uri -ne 'https://keycloak.frt.vn/realms/ain-prod/protocol/openid-connect/token') { throw 'Unexpected credential destination' }
    if ($global:RaiRefreshTestFailure) { throw 'password-canary=with=equals response-canary' }
    if ($Body.password -ne $global:RaiRefreshTestPassword -or $Body.username -ne 'test-user') { throw 'Credential parsing failed' }
    if ($Body.grant_type -ne 'password' -or $Body.client_id -ne 'portal') { throw 'Authentication contract changed' }
    return $global:RaiRefreshTestResponse
}

function Invoke-Fixture([switch]$Force, [switch]$AsHeaders) {
    $global:LASTEXITCODE = 0
    $output = @(& $ScriptPath -EnvFile $envFile -ConfigPath $configFile -Force:$Force -AsHeaders:$AsHeaders 2>&1)
    return @{ Code = $LASTEXITCODE; Text = ($output | ForEach-Object { $_.ToString() }) -join "`n" }
}

try {
    Reset-Fixture (New-TestToken 600 'existing')
    $before = [IO.File]::ReadAllText($configFile)
    $result = Invoke-Fixture
    Assert-Test ($result.Code -eq 0 -and $global:RaiRefreshTestRequests -eq 0) 'Valid cached token should not log in again.'
    Assert-Test (($result.Text | ConvertFrom-Json).status -eq 'valid') 'Expected valid status.'
    Assert-Test ([IO.File]::ReadAllText($configFile) -ceq $before) 'Cached config should be byte-for-byte unchanged.'
    Write-Output 'PASS: valid token is reused without network or config writes'

    Reset-Fixture (New-TestToken -30 'expired')
    $result = Invoke-Fixture
    $updated = Get-Content -Raw -LiteralPath $configFile | ConvertFrom-Json
    Assert-Test ($result.Code -eq 0 -and $global:RaiRefreshTestRequests -eq 1) ('Expired token should refresh exactly once. Code=' + $result.Code + '; requests=' + $global:RaiRefreshTestRequests + '; result=' + $result.Text)
    Assert-Test ($updated.mcpServers.rai.headers.Authorization -eq ('Bearer ' + $global:RaiRefreshTestResponse.access_token)) 'RAI token was not updated.'
    Assert-Test ($updated.mcpServers.unrelated.headers.Authorization -eq 'Bearer unrelated-canary') 'Unrelated server credentials changed.'
    Assert-Test ($updated.mcpServers.rai.headers.'X-Jira-Token' -eq 'jira-canary' -and $updated.mcpServers.rai.autoApprove[0] -eq 'read-only-tool' -and $updated.powers.enabled -eq $false) 'Other config fields changed.'
    Assert-Test ($result.Text -notmatch 'password-canary|jira-canary|eyJ') 'Normal output leaked credentials.'
    Write-Output 'PASS: expired token refreshes only RAI and preserves unrelated config'

    Reset-Fixture (New-TestToken 600 'existing')
    $result = Invoke-Fixture -AsHeaders
    $headers = $result.Text | ConvertFrom-Json
    Assert-Test ($result.Code -eq 0 -and $global:RaiRefreshTestRequests -eq 1) 'Header helper must renew even after a valid JWT is rejected.'
    Assert-Test ($headers.Authorization -eq ('Bearer ' + $global:RaiRefreshTestResponse.access_token) -and $headers.'X-Jira-Token' -eq 'jira-canary') 'Header helper returned incorrect auth headers.'
    Assert-Test (@($headers.PSObject.Properties).Count -eq 3) 'Header output contains status/log fields.'
    Write-Output 'PASS: MCP helper returns only headers and renews on auth retry'

    Reset-Fixture (New-TestToken 600 'existing')
    $result = Invoke-Fixture -Force
    Assert-Test ($result.Code -eq 0 -and $global:RaiRefreshTestRequests -eq 1) 'Force refresh did not bypass cached expiry.'
    Write-Output 'PASS: explicit force bypasses cached token'

    Reset-Fixture (New-TestToken -30 'expired')
    [IO.File]::WriteAllText($envFile, 'KEYCLOAK_USERNAME=test-user', $utf8)
    $before = [IO.File]::ReadAllText($configFile)
    $result = Invoke-Fixture
    Assert-Test ($result.Code -ne 0 -and $global:RaiRefreshTestRequests -eq 0) 'Missing password should fail before HTTP.'
    Assert-Test ([IO.File]::ReadAllText($configFile) -ceq $before) 'Missing credential damaged config.'
    Write-Output 'PASS: missing credentials fail without network or writes'

    Reset-Fixture (New-TestToken -30 'expired')
    $global:RaiRefreshTestFailure = $true
    $before = [IO.File]::ReadAllText($configFile)
    $result = Invoke-Fixture
    Assert-Test ($result.Code -ne 0 -and [IO.File]::ReadAllText($configFile) -ceq $before) 'HTTP failure damaged config.'
    Assert-Test ($result.Text -notmatch 'password-canary|response-canary|eyJ') 'Failure output leaked response or credentials.'
    Write-Output 'PASS: HTTP failure is sanitized and preserves old config'

    Reset-Fixture (New-TestToken -30 'expired')
    $global:RaiRefreshTestResponse = @{ access_token = 'invalid-token' }
    $before = [IO.File]::ReadAllText($configFile)
    $result = Invoke-Fixture
    Assert-Test ($result.Code -ne 0 -and [IO.File]::ReadAllText($configFile) -ceq $before) 'Malformed token overwrote config.'
    Write-Output 'PASS: malformed token cannot overwrite the existing token'

    Reset-Fixture (New-TestToken -30 'expired')
    $config = Get-Content -Raw -LiteralPath $configFile | ConvertFrom-Json
    $config.mcpServers.rai.url = 'https://unrelated.example/mcp'
    [IO.File]::WriteAllText($configFile, ($config | ConvertTo-Json -Depth 20), $utf8)
    $before = [IO.File]::ReadAllText($configFile)
    $result = Invoke-Fixture
    Assert-Test ($result.Code -ne 0 -and $global:RaiRefreshTestRequests -eq 0 -and [IO.File]::ReadAllText($configFile) -ceq $before) 'Unrelated endpoint was accepted.'
    Write-Output 'PASS: refresh refuses an unrelated endpoint'

    Reset-Fixture (New-TestToken -30 'expired')
    $global:LASTEXITCODE = 0
    $result = @(& $fixtureScript -ConfigPath $configFile -Force 2>&1) -join "`n"
    Assert-Test ($LASTEXITCODE -eq 0 -and ($result | ConvertFrom-Json).status -eq 'refreshed' -and $global:RaiRefreshTestRequests -eq 1) 'Default credentials must come from the skill-local .env.'
    Write-Output 'PASS: default credential file is adjacent to the skill scripts directory'

    $global:RaiRefreshTestPassword = 'rotated-password-canary'
    [IO.File]::WriteAllText($envFile, "KEYCLOAK_USERNAME=test-user`nKEYCLOAK_PASSWORD=rotated-password-canary`n", $utf8)
    $global:LASTEXITCODE = 0
    $result = @(& $fixtureScript -ConfigPath $configFile -Force 2>&1) -join "`n"
    Assert-Test ($LASTEXITCODE -eq 0 -and ($result | ConvertFrom-Json).status -eq 'refreshed' -and $global:RaiRefreshTestRequests -eq 2) 'The next refresh must read the edited password from .env.'
    Write-Output 'PASS: editing .env takes effect on the next refresh'

    Assert-Test (@(Get-ChildItem -Force -LiteralPath $testRoot -Filter '*.tmp').Count -eq 0) 'Temporary files containing credentials remain.'
    Write-Output '10/10 refresh-token checks passed (mocked HTTP; no real credentials used).'
} finally {
    Remove-Item -LiteralPath Function:\Invoke-RestMethod -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $fixtureScript
    [IO.Directory]::Delete($fixtureScriptDirectory, $false)
    foreach ($file in Get-ChildItem -Force -File -LiteralPath $testRoot) { Remove-Item -LiteralPath $file.FullName }
    [IO.Directory]::Delete($testRoot, $false)
    Remove-Variable -Name RaiRefreshTestRequests,RaiRefreshTestFailure,RaiRefreshTestResponse,RaiRefreshTestPassword -Scope Global -ErrorAction SilentlyContinue
}
