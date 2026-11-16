@echo off
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if %errorlevel%==0 (
  echo 本地服务已启动：http://localhost:8080
  echo 按 Ctrl+C 停止。
  start "" "http://localhost:8080"
  python -m http.server 8080
) else (
  echo 未找到 python，改为直接打开 index.html
  start "" "%~dp0index.html"
)
