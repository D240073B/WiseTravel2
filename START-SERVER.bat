@echo off
echo ========================================
echo   WiseTravel PHP Server Launcher
echo ========================================
echo.
echo Starting PHP built-in server...
echo Server will run on: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

cd /d "%~dp0api\public"
php -S localhost:8000 router.php

pause
