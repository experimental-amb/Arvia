@echo off
setlocal
title InitCore Stop
color 0C

echo ==================================================
echo   Deteniendo InitCore (Frontend + ngrok + Docker)
echo ==================================================

cd /d D:\InitCore

:: --- [1/3] Frontend (ventana Next.js + proceso en puerto 3000) ---
echo [1/3] Cerrando frontend Next.js...
:: Por titulo de ventana (si se lanzo con start-n8n.bat)
taskkill /f /fi "WindowTitle eq InitCore Frontend*" /t >nul 2>&1
:: Fallback: matar lo que este escuchando en el puerto 3000
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    taskkill /f /pid %%P >nul 2>&1
)

:: --- [2/3] ngrok ---
echo [2/3] Cerrando tunel ngrok...
taskkill /f /im ngrok.exe >nul 2>&1
taskkill /f /fi "WindowTitle eq InitCore Ngrok*" /t >nul 2>&1

:: --- [3/3] Docker ---
echo [3/3] Bajando contenedores Docker...
docker compose down

echo.
echo ==================================================
echo   InitCore detenido (datos persistidos).
echo   - Frontend (puerto 3000): cerrado
echo   - ngrok:                  cerrado
echo   - Docker (n8n, postgres): detenido
echo ==================================================
pause
endlocal
