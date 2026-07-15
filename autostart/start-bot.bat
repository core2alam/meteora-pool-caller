@echo off
chcp 65001 >nul
REM Launcher bot: jalankan node, dan restart otomatis bila berhenti/crash.
REM PORTABLE: lokasi proyek dideteksi dari posisi file ini (folder autostart\..),
REM dan "node" diambil dari PATH. Tidak ada path yang di-hardcode.
cd /d "%~dp0.."

:loop
echo [%date% %time%] starting bot >> "bot.log"
node "index.js" >> "bot.log" 2>&1
echo [%date% %time%] bot exited (code %errorlevel%), restart in 15s >> "bot.log"
timeout /t 15 /nobreak > nul
goto loop
