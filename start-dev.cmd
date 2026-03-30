@echo off
setlocal

cd /d "%~dp0"

echo.
echo Starting DEV servers...
echo - API (Nest dev): http://localhost:3001
echo - Web (Next dev): http://localhost:3000
echo.

start "API (Nest dev)" cmd /k "cd /d %~dp0apps\api && set PORT=3001 && npm.cmd run start:dev"
start "WEB (Next dev)" cmd /k "cd /d %~dp0apps\web && set PORT=3000 && npm.cmd run dev -- -p 3000"

echo Done. Open: http://localhost:3000/login
exit /b 0

