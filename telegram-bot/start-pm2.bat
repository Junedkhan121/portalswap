@echo off
REM Quick Start Script for PortalSwap Telegram Bot
REM Run this to start the bot in the background with PM2

echo.
echo ========================================
echo   PortalSwap Telegram Bot - PM2 Setup
echo ========================================
echo.

REM Check if PM2 is installed
where pm2 >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] PM2 is not installed. Installing now...
    call npm install -g pm2
    if %errorlevel% neq 0 (
        echo [X] Failed to install PM2. Please run: npm install -g pm2
        pause
        exit /b 1
    )
    echo [+] PM2 installed successfully!
    echo.
)

REM Navigate to bot directory
cd /d "%~dp0"

REM Start the bot with PM2
echo [*] Starting PortalSwap bot with PM2...
pm2 start ecosystem.config.cjs

if %errorlevel% equ 0 (
    echo.
    echo [+] Bot started successfully!
    echo.
    echo     Bot Name: portalswap-bot
    echo     Status:   Running in background
    echo.
    echo Useful commands:
    echo   pm2 status              - Check bot status
    echo   pm2 logs portalswap-bot - View live logs
    echo   pm2 restart portalswap-bot - Restart bot
    echo   pm2 stop portalswap-bot    - Stop bot
    echo   pm2 monit                  - Monitoring dashboard
    echo.
    echo You can now close this window. The bot will keep running.
    echo.

    REM Save PM2 process list
    echo [*] Saving PM2 configuration...
    pm2 save

    echo.
    echo [*] To make the bot auto-start on Windows boot, run:
    echo     pm2 startup
    echo     (Then run the command it outputs)
    echo.
) else (
    echo.
    echo [X] Failed to start bot. Check for errors above.
    echo.
)

pause
