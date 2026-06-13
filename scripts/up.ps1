param([switch]$SkipBuild)

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host ""
Write-Host "=== RSY Platform: starting ===" -ForegroundColor Cyan

Write-Host "[1/6] Free ports 3000, 3001..."
Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 2

Write-Host "[2/6] Database..."
npm run db:generate 2>$null
npm run db:push 2>$null
npm run db:seed 2>$null

if (-not $SkipBuild) {
  Write-Host "[3/6] Build..."
  npm run build --workspace=apps/web 2>&1 | Out-Null
  npm run build --workspace=apps/admin 2>&1 | Out-Null
} else {
  Write-Host "[3/6] Build skipped"
}

Write-Host "[4/6] Start web, admin, worker..."
$env:NODE_ENV = "production"

Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; `$env:NODE_ENV='production'; npm run start --workspace=apps/web"
Start-Sleep -Seconds 3
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; `$env:NODE_ENV='production'; npm run start --workspace=apps/admin"
Start-Sleep -Seconds 2
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; `$env:NODE_ENV='production'; npm run worker"
Start-Sleep -Seconds 4

Write-Host "[5/6] Public tunnels (Cloudflare)..."
$logsDir = Join-Path $Root "logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null
$webLog = Join-Path $logsDir "tunnel-web.log"
$adminLog = Join-Path $logsDir "tunnel-admin.log"

Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; npx cloudflared tunnel --url http://localhost:3000 2>&1 | Tee-Object '$webLog'"
Start-Process powershell -WindowStyle Minimized -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; npx cloudflared tunnel --url http://localhost:3001 2>&1 | Tee-Object '$adminLog'"

Write-Host "    Waiting for tunnel URLs (35 sec)..."
Start-Sleep -Seconds 35

$siteUrl = "http://localhost:3000"
$adminUrl = "http://localhost:3001"
if (Test-Path $webLog) {
  $m = Select-String -Path $webLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -Last 1
  if ($m) { $siteUrl = $m.Matches[0].Value }
}
if (Test-Path $adminLog) {
  $m = Select-String -Path $adminLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" | Select-Object -Last 1
  if ($m) { $adminUrl = $m.Matches[0].Value }
}

Write-Host "[6/6] Auto-generate articles..."
npm run automate 2>&1 | Out-Null

$urlsFile = Join-Path $Root "LINKS.txt"
$date = Get-Date -Format "yyyy-MM-dd HH:mm"
@"
RSY Platform - your links
Updated: $date

SITE:  $siteUrl
ADMIN: $adminUrl

Local:  http://localhost:3000
Admin:  http://localhost:3001

GitHub: https://github.com/tolkachev14881488-beep/rsy-platform
Vercel: https://project-uppro.vercel.app

Run again: npm run up
"@ | Set-Content -Path $urlsFile -Encoding UTF8

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " DONE" -ForegroundColor Green
Write-Host " SITE:  $siteUrl" -ForegroundColor Yellow
Write-Host " ADMIN: $adminUrl" -ForegroundColor Yellow
Write-Host " File:  $urlsFile" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
