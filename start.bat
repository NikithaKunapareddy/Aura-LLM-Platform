@echo off
echo ======================================
echo    LLM Chat Application Startup
echo ======================================
echo.

echo Checking if virtual environment exists...
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo Failed to create virtual environment!
        pause
        exit /b 1
    )
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing/updating Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo Failed to install Python dependencies!
    pause
    exit /b 1
)

echo.
echo Starting FastAPI backend server...
echo Backend will be available at: http://localhost:8000
echo API documentation at: http://localhost:8000/docs
echo.

start "LLM Backend" cmd /k "venv\Scripts\activate && python gemma_api.py"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak > nul

echo Starting React frontend development server...
echo Frontend will be available at: http://localhost:5173
echo.

start "LLM Frontend" cmd /k "npm run dev"

echo.
echo ======================================
echo Both servers are starting up!
echo ======================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to exit this window...
pause > nul
