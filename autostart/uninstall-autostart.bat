@echo off
REM Hapus auto-start dan hentikan bot yang sedang berjalan.
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\MeteoraNewTokenBot.vbs" 2>nul
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'run-hidden\.vbs|start-bot\.bat|node .*index\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo.
echo [OK] Auto-start dihapus dan bot dihentikan (jika sedang berjalan).
pause
