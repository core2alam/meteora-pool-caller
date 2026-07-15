@echo off
REM Pasang auto-start: bot jalan otomatis tiap login Windows (tanpa admin).
REM Membuat launcher di folder Startup yang menunjuk ke run-hidden.vbs lokal.
set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
> "%STARTUP%\MeteoraNewTokenBot.vbs" echo CreateObject("WScript.Shell").Run "wscript ""%~dp0run-hidden.vbs""", 0, False
if exist "%STARTUP%\MeteoraNewTokenBot.vbs" (
  echo [OK] Auto-start terpasang. Bot akan jalan otomatis saat login berikutnya.
  echo      Untuk menjalankan sekarang: klik dua kali run-hidden.vbs
) else (
  echo [GAGAL] Tidak bisa menulis ke folder Startup.
)
pause
