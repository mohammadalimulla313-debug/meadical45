@echo off
echo ========================================================
echo   Starting MediExtract AI (Backend + Frontend)
echo ========================================================
echo.

cd /d "%~dp0"

echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000 ...
start "MediExtract AI - Backend" cmd /k "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app"

echo [2/2] Launching React Vite Frontend on http://localhost:5173 ...
start "MediExtract AI - Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting for servers to initialize...
timeout /t 3 >nul

echo Opening browser...
start http://localhost:5173

echo.
echo MediExtract AI is running!
echo - Web Dashboard: http://localhost:5173
echo - API Docs (Swagger): http://127.0.0.1:8000/docs
echo.
