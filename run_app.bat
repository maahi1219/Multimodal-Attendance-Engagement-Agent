@echo off
echo ===================================================================
echo   Multimodal Attendance ^& Engagement Agent - Local Orchestrator
echo   Offline Privacy-Preserving Intelligent Classroom Analytics
echo ===================================================================
echo.
echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "ClassroomAI Backend" cmd /c "python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo Starting Vite React Frontend on http://localhost:5173 ...
start "ClassroomAI Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Both services launched! 
echo Open your browser to: http://localhost:5173
echo API Swagger Docs: http://127.0.0.1:8000/docs
echo.
pause
