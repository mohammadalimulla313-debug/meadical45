@echo off
cd /d "%~dp0"
echo Starting MediExtract AI Backend...

REM Use virtualenv Python if present, otherwise system Python
set "PY_CMD=python"
if exist "%~dp0.venv\Scripts\python.exe" (
    set "PY_CMD=%~dp0.venv\Scripts\python.exe"
)

"%PY_CMD%" -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app
