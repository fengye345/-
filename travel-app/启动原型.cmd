@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo   旅迹 Travelog - 高保真原型
echo   正在打开 index.html ...
echo.
start "" "%~dp0index.html"
