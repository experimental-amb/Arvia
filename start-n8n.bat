@echo off
setlocal
title InitCore Launcher
color 0B

echo ==================================================
echo   InitCore - Docker + ngrok + Frontend Next.js
echo ==================================================

:: --- Docker check ---
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker no esta corriendo. Inicia Docker Desktop primero.
    pause
    exit /b 1
)

cd /d D:\InitCore

:: --- Decide if frontend can be started ---
set "HAS_FRONTEND=0"
if exist "D:\InitCore\frontend\package.json" set "HAS_FRONTEND=1"

if "%HAS_FRONTEND%"=="1" (
    where node >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Node.js no esta instalado. Se saltara el frontend.
        set "HAS_FRONTEND=0"
    )
)

:: --- [1/5] Docker ---
echo.
echo [1/5] Levantando contenedores Docker (n8n + postgres)...
docker compose up -d
if errorlevel 1 (
    echo [ERROR] Fallo docker compose up. Revisa docker-compose.yml.
    pause
    exit /b 1
)

:: --- [2/5] ngrok ---
echo.
echo [2/5] Abriendo tunel ngrok para Telegram...
start "InitCore Ngrok" cmd /k "ngrok http --domain=atrium-pony-reburial.ngrok-free.dev 5678"

:: --- [3/5] Ollama recordatorio ---
echo.
echo [3/5] Verificando Ollama...
echo [INFO] Asegurate de tener Ollama corriendo y el modelo "llama3" instalado.

:: --- [4/5] Frontend ---
echo.
if "%HAS_FRONTEND%"=="1" (
    echo [4/5] Iniciando frontend Next.js en puerto 3000...
    if not exist "D:\InitCore\frontend\node_modules" (
        echo [INFO] node_modules no encontrado. Instalando dependencias^(esto puede tardar^)...
        pushd D:\InitCore\frontend
        call npm install
        popd
    )
    start "InitCore Frontend" cmd /k "cd /d D:\InitCore\frontend && npm run dev"
) else (
    echo [4/5] Frontend omitido ^(no se encontro D:\InitCore\frontend o Node.js^).
)

:: --- [5/5] Open browser ---
echo.
echo [5/5] Abriendo servicios en el navegador...
timeout /t 6 >nul
start "" http://localhost:5678
if "%HAS_FRONTEND%"=="1" (
    timeout /t 2 >nul
    start "" http://localhost:3000
)

echo.
echo ==================================================
echo   InitCore en linea
echo   - n8n:      http://localhost:5678
if "%HAS_FRONTEND%"=="1" echo   - Frontend: http://localhost:3000
echo   - ngrok:    https://atrium-pony-reburial.ngrok-free.dev/
echo ==================================================
pause
endlocal
