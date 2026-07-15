@echo off
REM Hentikan bot yang sedang berjalan (tanpa menghapus auto-start).
REM Catatan: bila auto-start terpasang, bot jalan lagi saat login berikutnya.
powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -match 'run-hidden\.vbs|start-bot\.bat|node .*index\.js' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
echo.
echo [OK] Bot dihentikan (jika sedang berjalan).
pause
