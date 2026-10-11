# Intelligent Grievance System - Startup Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Starting Intelligent Grievance System Services...        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$rootDir = $PSScriptRoot

# 1. Start AI Microservice
Write-Host "[1/3] Starting Python FastAPI AI Microservice (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir/ai-service'; py -m uvicorn app.main:app --host 127.0.0.1 --port 8001"

Start-Sleep -Seconds 3

# 2. Start Backend API
Write-Host "[2/3] Starting Node.js Express Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir/backend'; npm run dev"

Start-Sleep -Seconds 2

# 3. Start Frontend UI
Write-Host "[3/3] Starting React + Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir/frontend'; npm run dev"

Start-Sleep -Seconds 3

# Open Default Browser
Write-Host "Opening application in browser: http://localhost:5173" -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " All services started successfully!                       " -ForegroundColor Green
Write-Host " - Frontend UI:  http://localhost:5173                   " -ForegroundColor White
Write-Host " - Backend API:  http://localhost:5000/api/v1           " -ForegroundColor White
Write-Host " - AI Service:   http://127.0.0.1:8001                   " -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan
