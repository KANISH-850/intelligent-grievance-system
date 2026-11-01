@echo off
rem ------------------------------------------------------------
rem Run Frontend (Vite) and Backend (Node/Express) simultaneously
rem ------------------------------------------------------------

setlocal

rem ==== AI Microservice ====
start "AI Microservice - FastAPI" cmd /k "cd /d %~dp0ai-service && py -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

rem ==== Backend ==== 
start "Backend - Express" cmd /k "cd /d %~dp0backend && npm run dev"

rem ==== Frontend ==== 
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

rem Optional: keep this window open to see any errors
echo All 3 services (AI microservice, Backend, Frontend) have been launched in separate windows.
pause
