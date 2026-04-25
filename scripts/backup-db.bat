@echo off
chcp 65001 >nul
REM ============================================
REM 数据库自动备份脚本 (Windows)
REM ============================================
REM
REM 使用方法:
REM 1. 修改下方数据库配置
REM 2. 添加到 Windows 任务计划程序，每天凌晨 2 点执行
REM
REM 备份文件保留 7 天，自动清理旧备份
REM ============================================

REM 数据库配置
set DB_HOST=localhost
set DB_PORT=3306
set DB_NAME=ad_workflow
set DB_USER=root
set DB_PASS=你的数据库密码

REM 备份目录
set BACKUP_DIR=C:\backups\ad-workflow
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DATETIME=%%I
set DATE=%DATETIME:~0,4%%DATETIME:~4,2%%DATETIME:~6,2%_%DATETIME:~8,2%%DATETIME:~10,2%
set BACKUP_FILE=%BACKUP_DIR%\ad_workflow_%DATE%.sql

REM 创建备份目录
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

echo 开始备份数据库: %DB_NAME%

REM 执行备份（需要 mysqldump 在 PATH 中）
mysqldump -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% --single-transaction --routines --triggers --events %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo 备份成功: %BACKUP_FILE%
    for %%A in ("%BACKUP_FILE%") do echo 文件大小: %%~zA 字节
) else (
    echo 备份失败！
    exit /b 1
)

REM 压缩备份文件（需要 7-Zip）
if exist "C:\Program Files\7-Zip\7z.exe" (
    "C:\Program Files\7-Zip\7z.exe" a -tzip "%BACKUP_FILE%.zip" "%BACKUP_FILE%" >nul
    del "%BACKUP_FILE%"
    echo 已压缩: %BACKUP_FILE%.zip
)

REM 清理 7 天前的旧备份
echo 清理旧备份...
forfiles /p "%BACKUP_DIR%" /m *.sql.zip /d -7 /c "cmd /c del @path" 2>nul
forfiles /p "%BACKUP_DIR%" /m *.sql /d -7 /c "cmd /c del @path" 2>nul
echo 完成！
