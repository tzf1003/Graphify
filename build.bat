@echo off
chcp 65001 >nul
echo ========================================
echo   Image Editor - 构建项目
echo ========================================
echo.

:: 检查 node_modules
if not exist "node_modules" (
    echo [1/4] 安装根目录依赖...
    call npm install
    if errorlevel 1 (
        echo [错误] 安装根目录依赖失败
        pause
        exit /b 1
    )
) else (
    echo [1/4] 根目录依赖已存在，跳过
)

:: 安装 server 依赖
if not exist "server\node_modules" (
    echo [2/4] 安装后端依赖...
    cd server
    call npm install
    if errorlevel 1 (
        echo [错误] 安装后端依赖失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [2/4] 后端依赖已存在，跳过
)

:: 安装 client 依赖
if not exist "client\node_modules" (
    echo [3/4] 安装前端依赖...
    cd client
    call npm install
    if errorlevel 1 (
        echo [错误] 安装前端依赖失败
        cd ..
        pause
        exit /b 1
    )
    cd ..
) else (
    echo [3/4] 前端依赖已存在，跳过
)

:: 构建项目
echo [4/4] 构建项目...
echo.
echo 构建后端...
call npm run build:server
if errorlevel 1 (
    echo [错误] 构建后端失败
    pause
    exit /b 1
)

echo.
echo 构建前端...
call npm run build:client
if errorlevel 1 (
    echo [错误] 构建前端失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo   构建完成！
echo ========================================
pause
