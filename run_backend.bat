@echo off
cd /d "%~dp0"
echo Starting MediExtract AI Backend...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --reload-dir app
