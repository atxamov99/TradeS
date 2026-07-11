@echo off
echo ============================================
echo        Savdo TradeS — Full Stack Launch
echo ============================================
echo.

REM === Backend ===
echo [1/4] Starting Backend (port 5000)...
cd /d "%~dp0backend"
start "Backend" cmd /c "npm run dev"

REM Wait for backend
:wait_backend
timeout /t 2 /nobreak >nul
curl -s http://localhost:5000/health >nul 2>&1
if errorlevel 1 goto wait_backend
echo       Backend ready at http://localhost:5000
echo.

REM === Admin Frontend ===
echo [2/4] Starting Admin Panel (port 5174)...
cd /d "%~dp0web\admin"
start "Admin" cmd /c "npm run dev"
echo       Admin panel at http://localhost:5174
echo.

REM === Web Frontend ===
echo [3/4] Starting Web Frontend (port 5173)...
cd /d "%~dp0web"
start "Web" cmd /c "npm run dev"
echo       Web frontend at http://localhost:5173
echo.

REM === Ngrok Tunnel ===
echo [4/4] Starting ngrok tunnel for mobile...
cd /d "%~dp0"
start "Ngrok" cmd /c "npx ngrok http 5000 --log=stdout"
echo.
echo ============================================
echo   All services starting...
echo   Check ngrok URL at http://127.0.0.1:4040
echo   Update mobile/.env EXPO_PUBLIC_API_BASE
echo ============================================
pause
