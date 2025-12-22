Param(
    [string]$ClientId = $null,
    [string]$ClientSecret = $null,
    [string]$BaseUrl = $null,
    [switch]$CallSync
)

# Helper to write and exit
function Fail([string]$msg, [int]$code = 1) {
    Write-Error $msg
    exit $code
}

# If any values are missing, try to load them from .env.local in the repo root
$envFile = Join-Path $PSScriptRoot '..\.env.local'
if (Test-Path $envFile) {
    Write-Host "Loading environment variables from $envFile"
    $lines = Get-Content $envFile | Where-Object { $_.Trim() -ne '' -and -not ($_.TrimStart().StartsWith('#')) }
    foreach ($line in $lines) {
        if ($line -match '^\s*([^=]+)=(.*)$') {
            $k = $matches[1].Trim()
            $v = $matches[2].Trim()
            # Remove surrounding quotes if present
            if ($v.StartsWith('"') -and $v.EndsWith('"')) { $v = $v.Trim('"') }
            switch ($k) {
                'CLIENT_ID' { if (-not $ClientId) { $ClientId = $v } }
                'CLIENT_SECRET' { if (-not $ClientSecret) { $ClientSecret = $v } }
                'BASE_URL' { if (-not $BaseUrl) { $BaseUrl = $v } }
                'NEXT_PUBLIC_BASE_URL' { if (-not $BaseUrl) { $BaseUrl = $v } }
                default { }
            }
        }
    }
}

if (-not $ClientId) { Fail "ClientId is required (provide -ClientId or set CLIENT_ID in .env.local)" }
if (-not $ClientSecret) { Fail "ClientSecret is required (provide -ClientSecret or set CLIENT_SECRET in .env.local)" }
if (-not $BaseUrl) { Fail "BaseUrl is required (provide -BaseUrl or set BASE_URL or NEXT_PUBLIC_BASE_URL in .env.local)" }

Write-Host "Requesting token from $BaseUrl/api/oauth/token..."

$body = @{ grant_type = 'client_credentials'; client_id = $ClientId; client_secret = $ClientSecret } | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "$BaseUrl/api/oauth/token" -Method Post -ContentType 'application/json' -Body $body -ErrorAction Stop
}
catch {
    Write-Error "HTTP request failed: $_"
    exit 2
}

Write-Host "Token endpoint response (JSON):"
Write-Host ($resp | ConvertTo-Json -Depth 5)

if ($null -eq $resp.access_token -or $resp.access_token -eq '') {
    Fail "No access_token in response" 3
}

Write-Host "Access token retrieved (first 8 chars): $($resp.access_token.Substring(0,8))..."

if ($CallSync) {
    Write-Host "Calling /api/admin/sync-payments with Bearer token..."
    try {
        $syncResp = Invoke-RestMethod -Uri "$BaseUrl/api/admin/sync-payments" -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer $($resp.access_token)" } -ErrorAction Stop
        Write-Host "sync-payments response:"
        Write-Host ($syncResp | ConvertTo-Json -Depth 5)
    }
    catch {
        Write-Error "sync-payments HTTP request failed: $_"
        exit 4
    }
    try {
        $syncResp = Invoke-RestMethod -Uri "$BaseUrl/api/admin/sync-orders" -Method Post -ContentType 'application/json' -Headers @{ Authorization = "Bearer $($resp.access_token)" } -ErrorAction Stop
        Write-Host "sync-orders response:"
        Write-Host ($syncResp | ConvertTo-Json -Depth 5)
    }
    catch {
        Write-Error "sync-orders HTTP request failed: $_"
        exit 5
    }
}

Write-Host "Done."