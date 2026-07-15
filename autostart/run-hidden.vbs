' Jalankan start-bot.bat secara TERSEMBUNYI (tanpa jendela cmd muncul).
' PORTABLE: lokasi dideteksi dari posisi file ini sendiri — tidak ada path hardcode.
Dim fso, sh, here
Set fso = CreateObject("Scripting.FileSystemObject")
here = fso.GetParentFolderName(WScript.ScriptFullName)   ' folder autostart\
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = fso.GetParentFolderName(here)       ' folder proyek
' Argumen ke-2 = 0 -> hidden; ke-3 = False -> tidak menunggu selesai.
sh.Run "cmd /c """ & here & "\start-bot.bat""", 0, False
