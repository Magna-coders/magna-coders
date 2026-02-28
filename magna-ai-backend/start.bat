@echo off
REM Magna AI Agent Startup Script for Windows

echo ==========================================
echo   Magna AI Agent - Starting Backend
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "backend\main.py" (
    echo Error: Please run this script from the magna-ai-backend directory
    echo    cd magna-coders\magna-ai-backend
    exit /b 1
)

REM Check if .env exists
if not exist "backend\.env" (
    echo Error: backend\.env file not found
    echo    Please create it with your configuration
    echo    See QUICK_START.md for details
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    
    echo Installing dependencies...
    call venv\Scripts\activate
    pip install -r requirements.txt
) else (
    echo Virtual environment found
    call venv\Scripts\activate
)

echo.
echo Starting Magna AI Agent backend...
echo    API: http://localhost:8000
echo    Docs: http://localhost:8000/api/docs
echo    Health: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop
echo.

REM Run using uvicorn (proper way for FastAPI)
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
