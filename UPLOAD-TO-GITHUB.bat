@echo off
setlocal
cd /d "%~dp0"
echo.
echo ================================================================
echo   ECKY THUMP v1.1 - Upload to your existing GitHub repository
echo   https://github.com/connex222/ECKY-THUMP
echo ================================================================
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo Git for Windows is required.
  echo Install Git from https://git-scm.com/download/win then rerun this file.
  echo.
  pause
  exit /b 1
)
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0UPLOAD-TO-GITHUB.ps1"
if errorlevel 1 (
  echo.
  echo The upload was NOT completed. Read the error above.
  pause
  exit /b 1
)
echo.
echo Upload complete. View the files at:
echo https://github.com/connex222/ECKY-THUMP
pause
endlocal
