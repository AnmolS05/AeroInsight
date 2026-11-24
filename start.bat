@echo off
echo ============================================
echo AeroInsight Full Stack Startup
echo ============================================
echo.

REM Check if PostgreSQL is running
echo [1/4] Checking PostgreSQL...
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARN] Running without admin privileges, PostgreSQL check skipped.
) else (
    sc query postgresql >nul 2>&1
    if %errorLevel% neq 0 (
        echo [ERROR] PostgreSQL service not found. Please start PostgreSQL and create the database:
        echo   CREATE DATABASE aeroinsight;
        echo   CREATE USER aeroinsight WITH PASSWORD 'password';
        echo   GRANT ALL PRIVILEGES ON DATABASE aeroinsight TO aeroinsight;
        exit /b 1
    )
    echo [OK] PostgreSQL is running.
)

REM Install backend dependencies
echo.
echo [2/4] Installing backend dependencies...
cd backend
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Backend install failed.
    exit /b 1
)
echo [OK] Backend dependencies installed.

REM Install frontend dependencies
echo.
echo [3/4] Installing frontend dependencies...
cd ..\frontend
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Frontend install failed.
    exit /b 1
)
echo [OK] Frontend dependencies installed.

REM Start services
echo.
echo [4/4] Starting services...
echo.
echo Starting Backend on http://localhost:10000 ...
start cmd /k "cd /d %~dp0backend && npm run dev"
timeout /t 3 /nobreak >nul

echo Starting Frontend on http://localhost:5173 ...
start cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ============================================
echo AeroInsight is starting up!
echo ============================================
echo.
echo Backend API:  http://localhost:10000
echo Frontend UI:  http://localhost:5173
echo Unity Bridge: http://127.0.0.1:7890 (requires Unity Editor)
echo.
echo UNITY SETUP:
echo   1. Open simulation/ folder in Unity Hub
echo   2. Click "Bootstrap Simulation Scene" from Tools menu
echo   3. The Live Bridge will auto-start on port 7890
echo.
echo Press any key to open this window...
pause >nul
