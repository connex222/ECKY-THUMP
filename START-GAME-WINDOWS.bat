@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js is not installed or is not available in your PATH.
  echo Please install Node.js LTS from https://nodejs.org/
  pause
  exit /b 1
)
set "GAME_URL=http://localhost:3000"
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -Command "$ip=Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -match '^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)' -and $_.InterfaceAlias -notmatch 'Virtual|vEthernet|Loopback|WSL' } | Select-Object -First 1 -ExpandProperty IPAddress; if($ip){Write-Output $ip}"`) do set "GAME_URL=http://%%I:3000"
echo.
echo ================================================
echo               ECKEY THUMP v1.4
 echo        CLEAN CHAOS UI REBUILD
 echo ================================================
echo.
echo Open this on the hosting PC: %GAME_URL%
echo.
echo If you are using phones on the same home Wi-Fi,
echo connect them to the same network as the host PC.
echo Windows may ask you to allow Node.js network access.
echo The QR code will point to the address shown above.
echo.
echo For friends in OTHER homes, deploy to Render.
echo.
echo Press Ctrl+C to stop the server.
start "" "%GAME_URL%"
node server\index.js
pause
