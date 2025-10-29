@echo off
echo ========================================
echo   Arzu Simulator - 清理活跃会话脚本
echo ========================================
echo.
echo 正在清理未结束的番茄钟会话和细分时间段...
echo.

node scripts\cleanup-active-sessions.js

echo.
echo ========================================
echo 按任意键退出...
pause > nul
