@echo off
setlocal

cd /d "%~dp0"

echo.
echo [0/4] Starting PostgreSQL + Redis (Docker)...
docker compose up -d
if errorlevel 1 goto :err

echo.
echo [1/4] Building workspaces (api + web)...
call npm.cmd run build
if errorlevel 1 goto :err

echo.
echo [2/4] Prisma generate + migrate + seed (PostgreSQL)...
pushd "apps\api"
call npm.cmd run prisma:generate:pg
if errorlevel 1 goto :err_popd
call npm.cmd run prisma:migrate:pg
if errorlevel 1 goto :err_popd
call npm.cmd run prisma:seed
if errorlevel 1 goto :err_popd
popd

echo.
echo [3/4] Starting servers...
echo - API  : http://localhost:3001
echo - Web  : http://localhost:3000
echo.

start "API (Nest)" cmd /k "cd /d %~dp0apps\api && set PORT=3001 && npm.cmd run start:prod"
start "WEB (Next)" cmd /k "cd /d %~dp0apps\web && npm.cmd run start"

echo Done. Open: http://localhost:3000/login
exit /b 0

:err_popd
popd
:err
echo.
echo ERROR: start-local-postgres.cmd failed.
echo - Make sure Docker Desktop is running.
exit /b 1

