@echo off
cd /d "%~dp0backend"
echo [1/3] Starting backend on port 5000...
start "Backend" cmd /c "npm run dev"

echo [2/3] Waiting for backend...
:wait
timeout /t 2 /nobreak >nul
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 goto wait
echo       Backend is ready!

echo [3/3] Starting ngrok tunnel...
cd /d "%~dp0"
npx ngrok http 5000 --log=stdout
