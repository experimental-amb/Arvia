@echo off
setlocal
echo ======================================================
echo 🚀 INICIANDO ECOSISTEMA ARVIA PRO (v1.2)
echo ======================================================

:: 1. Actualizar n8n para asegurar que el nodo de Anthropic esté disponible
echo 🔄 1/4 Verificando actualizaciones de n8n...
docker compose pull n8n

:: 2. Levantar la base de datos y n8n
echo 🐘 2/4 Levantando Base de Datos y n8n Core...
docker compose up -d

:: 3. Iniciar Túnel Seguro (ngrok)
echo 🌐 3/4 Activando Túnel Seguro (atrium-pony-reburial)...
:: Buscamos si ya existe ngrok corriendo para no duplicar
taskkill /f /im ngrok.exe >nul 2>&1
start /b "" ngrok http --domain=atrium-pony-reburial.ngrok-free.dev 5678

:: 4. Abrir Herramientas de Trabajo (Navegador)
echo 🖥️  4/4 Abriendo Panel de Control...
timeout /t 5 >nul

:: Abrir n8n (Local)
start "" "http://localhost:5678"
:: Abrir Frontend (Vercel)
start "" "https://arvia-nu.vercel.app"
:: Abrir Repositorio (GitHub)
start "" "https://github.com/experimental-amb/Arvia"
:: Abrir Postman (Web)
start "" "https://web.postman.co/"

echo ======================================================
echo ✅ ¡SISTEMA OPERATIVO!
echo ======================================================
echo.
echo - No cierres esta ventana mientras trabajas.
echo - Usa n8n SIEMPRE desde el navegador (localhost:5678).
echo.
echo Presiona cualquier tecla para DETENER y CERRAR todo...
pause > nul

echo 🛑 Deteniendo Stack y cerrando túneles...
docker compose down
taskkill /f /im ngrok.exe >nul 2>&1
echo 🏁 Sistema cerrado. ¡Hasta pronto!
timeout /t 3
exit
