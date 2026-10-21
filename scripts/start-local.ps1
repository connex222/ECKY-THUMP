# ECKY THUMP v1.8.2 — Windows launcher with dependency checks, health polling and an available port.
$ErrorActionPreference='Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
try {
    $node=(Get-Command node -ErrorAction Stop).Source
    $version=& $node -p 'process.versions.node'
    $parts=$version.Split('.')
    if ([int]$parts[0] -lt 20 -or ([int]$parts[0] -eq 20 -and [int]$parts[1] -lt 11)) {throw "Node.js 20.11+ required (installed: $version)"}
    if ((Test-Path package-lock.json) -and !(Test-Path node_modules)) {
        & npm ci
        if($LASTEXITCODE -ne 0){throw 'npm ci failed'}
    }
    $port=3000
    if ($env:PORT) {$port=[int]$env:PORT}
    else {
        for($n=3000;$n -le 3010;$n++) {
            $listener=$null
            try{$listener=[System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Any,$n);$listener.Start();$port=$n;break}
            catch {if($n -eq 3010){throw 'No free local port from 3000 to 3010'}}
            finally {if($listener){$listener.Stop()}}
        }
    }
    $env:PORT="$port"
    Write-Host "Starting ECKY THUMP v1.8.2 on port $port..." -ForegroundColor Green
    $server=Start-Process -FilePath $node -ArgumentList 'server/index.js' -WorkingDirectory (Get-Location).Path -PassThru -NoNewWindow
    $ready=$false
    for($attempt=0;$attempt -lt 40;$attempt++){
        Start-Sleep -Milliseconds 300
        if($server.HasExited){throw 'Game server stopped during startup'}
        try {$health=Invoke-RestMethod -Uri "http://localhost:$port/api/health" -TimeoutSec 1
            if($health.status -eq 'ok'){$ready=$true;break}
        }catch {}
    }
    if(!$ready){try{Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue}catch{};throw 'Server health check failed'}
    $address='localhost'
    try {$lan=Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
        Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and $_.InterfaceAlias -notmatch 'Virtual|vEthernet|Loopback|WSL' } |
        Select-Object -First 1 -ExpandProperty IPAddress
        if($lan){$address=$lan}
    }catch {}
    $url="http://${address}:$port"
    Write-Host "Host browser: http://localhost:$port" -ForegroundColor Cyan
    Write-Host "Friends on this Wi-Fi: $url" -ForegroundColor Yellow
    Start-Process $url
    Wait-Process -Id $server.Id
    exit $server.ExitCode
} catch {Write-Host "Startup failed: $($_.Exception.Message)" -ForegroundColor Red;exit 1}
