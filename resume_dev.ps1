# resume_dev.ps1
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   Iniciando Entorno de Desarrollo N8N    " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Levantar Docker Compose
Write-Host "[1/3] Levantando servicios (n8n + postgres)..." -ForegroundColor Yellow
Set-Location -Path "$PSScriptRoot\execute"
docker-compose up -d
Write-Host "Servicios levantados." -ForegroundColor Green

# 2. Esperar a que n8n est disponible
Write-Host "[2/3] Esperando a que n8n responda en el puerto 5678..." -ForegroundColor Yellow
$n8nReady = $false
$retries = 0
while (-not $n8nReady -and $retries -lt 30) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5678" -UseBasicParsing -ErrorAction Stop
        $n8nReady = $true
    } catch {
        Start-Sleep -Seconds 2
        $retries++
    }
}

if ($n8nReady) {
    Write-Host "n8n est listo (http://localhost:5678)." -ForegroundColor Green
} else {
    Write-Host "n8n est tardando ms de lo esperado, pero continuaremos..." -ForegroundColor DarkYellow
}

# 3. Lanzar Ngrok
Write-Host "[3/3] Quieres exponer n8n a internet va ngrok? (Telegram requiere HTTPS)" -ForegroundColor Yellow
$runNgrok = Read-Host "Escribe 's' para s o cualquier otra letra para saltar"

if ($runNgrok -eq 's' -or $runNgrok -eq 'S') {
    Write-Host "Abriendo ngrok en una nueva ventana..." -ForegroundColor Magenta
    Start-Process -FilePath "ngrok" -ArgumentList "http 5678"
    Write-Host "ngrok iniciado." -ForegroundColor Green
    Write-Host "Recuerda actualizar tu Webhook de Telegram con la URL pblica de Ngrok (API de Telegram: setWebhook)." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Entorno listo. Buen trabajo y a programar!" -ForegroundColor Cyan
Write-Host " Usuarios locales N8N: admin / admin        " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
