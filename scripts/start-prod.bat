@echo off
set NODE_ENV=production
start "rsy-web" cmd /c "npm run start --workspace=apps/web"
start "rsy-admin" cmd /c "npm run start --workspace=apps/admin"
start "rsy-worker" cmd /c "npm run worker"
echo.
echo Production started:
echo   Site:  http://localhost:3000
echo   Admin: http://localhost:3001
