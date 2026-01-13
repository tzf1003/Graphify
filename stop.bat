@echo off
chcp 65001 >nul
echo ========================================
echo   Image Editor - 停止项目
echo ========================================
echo.

:: 关闭前端和后端窗口
echo [1/2] 停止前端和后端服务...
taskkill /FI "WINDOWTITLE eq Image Editor - Server*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq Image Editor - Client*" /F >nul 2>&1

:: 停止 Docker 容器
echo [2/2] 停止数据库...
docker-compose down

echo.
echo ========================================
echo   所有服务已停止
echo ========================================
pause
