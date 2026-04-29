@echo off
@chcp 65001 >nul
title Cinema Shelf
echo ==============================
echo   Cinema Shelf Launcher
echo ==============================
echo.

echo [1/3] Stopping old processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting server...
cd /d "%~dp0"
start "" http://localhost:4194
start "" cmd /k "npm start"

echo.
echo [3/3] Done!
echo ==============================
echo Server: http://localhost:4194
echo.
pause >nul
