# BUZZER BOARD GAME - PowerShell Startup Script
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "         🎮 BUZZER BOARD GAME - HỆ THỐNG ĐANG KHỞI ĐỘNG...            " -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootPath

Write-Host "[1/3] Kiểm tra Dependencies..." -ForegroundColor Gray
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Cài đặt dependencies Backend..." -ForegroundColor Yellow
    npm install --prefix backend
}
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "Cài đặt dependencies Frontend..." -ForegroundColor Yellow
    npm install --prefix frontend
}
if (-not (Test-Path "node_modules")) {
    Write-Host "Cài đặt dependencies Root..." -ForegroundColor Yellow
    npm install
}

Write-Host ""
Write-Host "[2/3] Khởi chạy Backend (Port 3001) và Frontend (Port 3000)..." -ForegroundColor Green
Write-Host ""
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  📱 Người chơi truy cập:     http://localhost:3000" -ForegroundColor White
Write-Host "  📺 Màn hình Máy chiếu TV:  http://localhost:3000/screen" -ForegroundColor Yellow
Write-Host "  💻 Màn hình MC Chủ trò:    http://localhost:3000/host" -ForegroundColor Magenta
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# Mở tự động 3 tab trên trình duyệt
Start-Process "http://localhost:3000/screen"
Start-Process "http://localhost:3000/host"
Start-Process "http://localhost:3000"

# Chạy song song cả backend và frontend
npx concurrently --kill-others --names "BACKEND,FRONTEND" --prefix-colors "blue,green" "npm run start:dev --prefix backend" "npm run dev --prefix frontend"
