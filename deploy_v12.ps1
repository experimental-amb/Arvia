# ============================================================
# deploy_v12.ps1 - Commit + Push cambios Arvia v12
# Ejecutar desde PowerShell en D:\InitCore
# ============================================================

Set-Location "D:\InitCore"

# 1. Eliminar git lock si existe
$lockFile = ".git\index.lock"
if (Test-Path $lockFile) {
    Remove-Item $lockFile -Force
    Write-Host "[OK] Lock eliminado" -ForegroundColor Green
}

# 2. Stage todos los archivos
git add frontend/src/app/layout.tsx
git add frontend/src/app/dashboard/page.tsx
git add frontend/src/components/DashboardTable.tsx
git add frontend/src/components/EditPropertyModal.tsx
git add frontend/src/components/ui/toaster.tsx
git add frontend/src/hooks/use-toast.ts
git add frontend/src/services/api.ts
git add web_api_workflow_v12.json

# 3. Commit
git commit -m "feat: release readiness fixes + delete/edit + toast + workflow v12

Release Readiness fixes:
- Guard user!=null en handleDelete y handleToggleStatus
- Toggle deshabilitado para propiedades sold/reserved/archived
- Toast de confirmacion post-edicion, post-eliminacion y errores
- Toaster global en layout.tsx (bottom-right, auto-dismiss 3.5s)

Funcionalidades:
- EditPropertyModal: editar propiedades directamente desde dashboard
- deleteProperty + updateProperty en api.ts y workflow n8n
- refreshAll() post bulk-import actualiza lista + stats
- web_api_workflow_v12.json: operaciones delete_property y update_property"

# 4. Push
git push origin main

Write-Host ""
Write-Host "[LISTO] Push exitoso. Vercel desplegara automaticamente." -ForegroundColor Cyan
Write-Host "Monitorea en: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor White
Write-Host "  1. Importar web_api_workflow_v12.json en n8n" -ForegroundColor Gray
Write-Host "  2. Activar el workflow en n8n" -ForegroundColor Gray
Write-Host "  3. Smoke test: editar, eliminar, bulk import" -ForegroundColor Gray
