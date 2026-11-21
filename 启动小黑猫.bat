@echo off
cd /d "%~dp0"
taskkill /F /IM electron.exe >nul 2>&1
set ELECTRON_RUN_AS_NODE=
set ELECTRON_USER_DATA_DIR=
start "" ".\node_modules\electron\dist\electron.exe" "."

