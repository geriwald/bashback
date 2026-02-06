@echo off
title bashback

REM Pull latest image and start container
docker compose -f \\wsl$\Ubuntu\home\geraud\code\bashback\docker-compose.yml up -d

REM Wait for server to be ready
timeout /t 2 /nobreak >nul

REM Open browser
start http://localhost:3001

echo bashback is running on http://localhost:3001
echo Press any key to stop...
pause >nul

REM Stop container
docker compose -f \\wsl$\Ubuntu\home\geraud\code\bashback\docker-compose.yml down
