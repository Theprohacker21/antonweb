@echo off
REM Start Node.js server with Administrator privileges
REM This script will request UAC (User Account Control) permission automatically

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    REM Not running as admin, request elevation
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %cd% && npm start' -Verb RunAs"
    exit /b
)

REM Running as admin, start the server
cd /d "%~dp0"
npm start
