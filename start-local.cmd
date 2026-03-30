@echo off
setlocal

cd /d "%~dp0"

echo.
echo [1/3] Building workspaces (api + web)...
call npm.cmd run build
if errorlevel 1 goto :err

if not exist "apps\api\prisma\dev.db" (
  echo.
  echo [2/3] Initializing local SQLite database...
  pushd "apps\api"
  call npm.cmd run prisma:generate
  if errorlevel 1 goto :err_popd
  call npm.cmd run prisma:migrate
  if errorlevel 1 goto :err_popd
  call npm.cmd run prisma:seed
  if errorlevel 1 goto :err_popd
  popd
) else (
  echo.
  echo [2/3] Local SQLite DB exists - applying migrations + seed...
  pushd "apps\api"
  call npm.cmd run prisma:generate
  if errorlevel 1 goto :err_popd
  call npm.cmd run prisma:migrate
  if errorlevel 1 goto :err_popd
  call npm.cmd run prisma:seed
  if errorlevel 1 goto :err_popd
  popd
)

echo.
echo [3/3] Starting servers...
echo - API  : http://localhost:3001
echo - Web  : http://localhost:3000
echo.

start "API (Nest)" cmd /k "cd /d %~dp0apps\api && set PORT=3001 && npm.cmd run start:prod"
start "WEB (Next)" cmd /k "cd /d %~dp0apps\web && set PORT=3000 && npm.cmd run start"

echo Done. Open: http://localhost:3000/login
exit /b 0

:err_popd
popd
:err
echo.
echo ERROR: start-local.cmd failed.
exit /b 1
