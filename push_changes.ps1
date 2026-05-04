# push_changes.ps1 - Commit y push de todos los cambios pendientes a GitHub
# Vercel despliega automaticamente al detectar el push en main

Set-Location $PSScriptRoot

Write-Host "`n=== Arvia - Commit y Push v1.5 ===" -ForegroundColor Cyan

# 1. Eliminar index.lock si existe
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "Lock file eliminado." -ForegroundColor Yellow
}

# 2. Stage de todos los cambios relevantes
git add frontend/src/services/api.ts
git add frontend/src/types/property.ts
git add frontend/src/components/DashboardTable.tsx
git add frontend/src/components/BulkImportModal.tsx
git add frontend/src/app/dashboard/page.tsx
git add frontend/src/app/api/n8n/route.ts
git add web_api_workflow_v7.json
git add PROJECT_CONTEXT.md
git add Arvia_Auditoria_v1.4.docx
git add .gitignore

Write-Host "`nArchivos en staging:" -ForegroundColor Cyan
git diff --cached --name-only

# 3. Verificar que hay cambios
$staged = git diff --cached --name-only
if (-not $staged) {
    Write-Host "`nNo hay cambios para commitear." -ForegroundColor Yellow
    Read-Host "Presiona Enter para cerrar"
    exit 0
}

# 4. Commit
$msg = "security: API key validation + UNNEST bulk insert + audit doc v1.5"
git commit -m $msg

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nError en commit." -ForegroundColor Red
    Read-Host "Enter para cerrar"
    exit 1
}

Write-Host "`nCommit OK: $msg" -ForegroundColor Green

# 5. Push - Vercel autodeploya
Write-Host "`nPush a origin main..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nPush exitoso. Vercel desplegara en ~2 min." -ForegroundColor Green
    Write-Host "  Ver deploy: https://vercel.com/guestara-devs-projects/arvia" -ForegroundColor DarkGray
} else {
    Write-Host "`nError en push. Revisa tu conexion o credenciales de GitHub." -ForegroundColor Red
}

Read-Host "`nPresiona Enter para cerrar"
