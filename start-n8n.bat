@echo off
echo 🚀 Iniciando Stack de Arvia con Dominio Fijo...

:: Cargar variables desde .env si existe
if exist .env (
    for /f "tokens=*" %%i in (.env) do set %%i
)

:: Iniciar Docker
echo 🐘 Levantando Base de Datos y n8n...
docker-compose up -d

:: Iniciar ngrok con dominio estático
echo 🌐 Activando Túnel Seguro (Dominio Fijo)...
start /b ngrok http --domain=atrium-pony-reburial.ngrok-free.dev 5678

echo.
echo ✅ Todo listo:
echo - Frontend: http://localhost:3000
echo - n8n Admin: http://localhost:5678
echo - Public Webhook: https://atrium-pony-reburial.ngrok-free.dev
echo.
echo Presiona cualquier tecla para detener el stack...
pause > nul

echo 🛑 Deteniendo Stack...
docker-compose down
taskkill /f /im ngrok.exe
