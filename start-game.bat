@echo off
chcp 65001 > nul
title BUZZER BOARD GAME - Tu Dong Khoi Chay
echo ======================================================================
echo          🎮 BUZZER BOARD GAME - HE THONG DANG KHOI DONG...
echo ======================================================================
echo.

cd /d "%~dp0"

echo [1/3] Kiem tra dependencies...
if not exist "backend\node_modules" (
    echo Cai dat dependencies cho Backend...
    cd backend && npm install && cd ..
)
if not exist "frontend\node_modules" (
    echo Cai dat dependencies cho Frontend...
    cd frontend && npm install && cd ..
)
if not exist "node_modules" (
    echo Cai dat dependencies cho Root...
    npm install
)

echo.
echo [2/3] Khoi dong Backend (Port 3001) va Frontend (Port 3000)...
echo.
echo ======================================================================
echo   📱 Nguoi choi truy cap:      http://localhost:3000
echo   📺 Man hinh May chieu TV:   http://localhost:3000/screen
echo   💻 Man hinh MC Chu tro:     http://localhost:3000/host
echo ======================================================================
echo.

:: Mo tu dong 3 tab tren trinh duyet mac dinh
start http://localhost:3000/screen
start http://localhost:3000/host
start http://localhost:3000

:: Chay song song ca backend va frontend
npx concurrently --kill-others --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npm run start:dev --prefix backend" "npm run dev --prefix frontend"

pause
