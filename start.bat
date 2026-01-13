@echo off
chcp 65001 >nul
echo ========================================
echo   Image Editor - 启动项目
echo ========================================
echo.

:: 检查 Docker 是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo [错误] Docker 未运行，请先启动 Docker Desktop
    pause
    exit /b 1
)

:: 启动 PostgreSQL
echo [1/3] 启动 PostgreSQL 数据库...
docker-compose up -d
if errorlevel 1 (
    echo [错误] 启动数据库失败
    pause
    exit /b 1
)

:: 等待数据库就绪
echo [2/3] 等待数据库就绪...
timeout /t 3 /nobreak >nul

:: 启动后端服务（新窗口）
echo [3/3] 启动服务...
start "Image Editor - Server" cmd /k "cd /d %~dp0 && npm run dev:server"

:: 等待后端启动
timeout /t 2 /nobreak >nul

:: 启动前端服务（新窗口）
start "Image Editor - Client" cmd /k "cd /d %~dp0 && npm run dev:client"

echo.
echo ========================================
echo   启动完成！
echo   后端: http://localhost:3000
echo   前端: http://localhost:5173
echo ========================================
echo.
echo 按任意键打开浏览器...
pause >nul
start http://localhost:5173
