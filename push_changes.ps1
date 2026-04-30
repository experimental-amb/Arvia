# push_changes.ps1 — Elimina el git lock y hace commit+push de todos los cambios pendientes
# Doble clic o ejecutar desde PowerShell en D:\InitCore

Set-Location $PSScriptRoot

Write-Host "`n=== InitCore — Commit & Push ===" -ForegroundColor Cyan

# 1. Eliminar index.lock si existe
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "Lock file eliminado." -ForegroundColor Yellow
} else {
    Write-Host "Sin lock file." -ForegroundColor Green
}

# 2. Agregar todos los archivos trackeados modificados + untracked relevantes
git add .gitignore
git add frontend/src/components/BulkImportModal.tsx
git add frontend/src/services/api.ts
git add propiedades_muestra_chile.csv
git add workflows/
git add web_api_workflow_v4.json

Write-Host "`nArchivos en staging:" -ForegroundColor Cyan
git diff --cached --name-only

# 3. Commit
$commitMsg = "fix: UTF-8 bulk import, ngrok headers, web API workflow v4 para n8n 2.17.3"
git commit -m $commitMsg

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError en commit. Revisa los mensajes arriba." -ForegroundColor Red
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

Write-Host "`nCommit creado OK." -ForegroundColor Green

# 4. Push
Write-Host "`nHaciendo push a origin main..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Push exitoso. Vercel tomará el cambio automáticamente." -ForegroundColor Green
} else {
    Write-Host "`nError en push. Revisa tu conexión o credenciales de GitHub." -ForegroundColor Red
}

Read-Host "`nPresiona Enter para cerrar"
