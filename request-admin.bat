@echo off
REM This is a helper script that re-launches Node with Admin privileges
REM Called by the Node.js server when VM operations are needed

REM Get the project directory from arguments
set PROJECT_DIR=%1
if "%PROJECT_DIR%"=="" set PROJECT_DIR=%cd%

REM Check if already running as admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    REM Not admin, request elevation and re-run with same arguments
    powershell -Command "Start-Process cmd -ArgumentList '/c cd /d %PROJECT_DIR% && npm start' -Verb RunAs"
    exit /b 0
)

REM Already admin, just start the server
cd /d "%PROJECT_DIR%"
npm start
