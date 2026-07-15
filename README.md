# Meteora New-Token Bot

Bot notifikasi **Telegram** untuk **token baru di Meteora yang punya volume**.
Memantau endpoint pool-discovery Meteora (sama dengan yang dipakai halaman
[meteora.ag](https://www.meteora.ag)) setiap beberapa detik, dan mengirim alert
saat muncul **token baru** yang lolos kriteria.

> **Dedup per TOKEN, bukan per pool.** Satu token bisa punya banyak pool (siapa
> pun bisa membuat pool baru untuk token yang sama). Bot mengirim **maksimal satu
> alert per token (mint address)** supaya Anda tidak dibanjiri notifikasi token
> yang sama.

## Kriteria default (trigger)

Sama dengan filter yang disepakati di UI Meteora:

| Kriteria | Nilai |
|---|---|
| Pool baru (New Listing) | ya |
| Tipe pool | DLMM saja |
| Market cap token | ≥ $100.000 |
| Holders | ≥ 500 |
| TVL | ≥ $100 |
| Token pair | SOL |
| Timeframe statistik | 5m |
| **Volume (5m) untuk alert** | **≥ $500** |
| Umur token maksimal untuk alert | 180 menit |

Semua bisa diubah di `config.json` (bagian `trigger`).

> Catatan: `Volume 5m ≥ $500` berarti volume dalam jendela **5 menit** terakhir.
> Nilai ini cukup ketat — bila terlalu jarang berbunyi, turunkan `minVolumeUsd`.
> Bila terlalu ramai, naikkan.

## Cara pakai

Butuh **Node.js ≥ 18** (sudah teruji di Node 24). Tidak ada dependency —
tidak perlu `npm install`.

### 1. Siapkan bot Telegram

1. Buka Telegram, chat ke **@BotFather** → kirim `/newbot` → ikuti langkahnya.
   BotFather memberi **bot token** (mis. `123456:ABC-DEF...`).
2. Dapatkan **chat ID** Anda:
   - Kirim satu pesan apa saja ke bot baru Anda.
   - Buka `https://api.telegram.org/bot<TOKEN>/getUpdates` di browser
     (ganti `<TOKEN>`), cari `"chat":{"id":<angka>...}` → itu chat ID Anda.
   - (Atau chat ke **@userinfobot** untuk lihat ID Anda.)

### 2. Isi konfigurasi

**Salin** `config.example.json` menjadi `config.json`, lalu isi bagian `telegram`:

```json
"telegram": { "token": "TOKEN_DARI_BOTFATHER", "chatId": "CHAT_ID_ANDA" }
```

> `config.json` sengaja **tidak** ikut di repo (`.gitignore`) — jadi setelah clone
> Anda memang perlu membuatnya sendiri dari `config.example.json`. Ini juga yang
> menjaga token setiap orang tetap privat.
> **Jangan bagikan token bot Anda ke siapa pun.**

### 3. Uji dulu (tanpa kirim)

```bash
node index.js --once --dry
```

Mengambil data asli sekali, mencetak calon alert ke layar, tidak mengirim apa pun.

### 4. Jalankan

```bash
node index.js
```

Bot akan polling terus tiap `pollIntervalSeconds` (default 30 detik) dan mengirim
alert ke Telegram Anda. Biarkan jendela ini terbuka selama Anda ingin bot aktif.
Hentikan dengan `Ctrl+C`.

Perintah lain:

| Perintah | Fungsi |
|---|---|
| `node index.js` | jalan terus (loop) |
| `node index.js --once` | jalan sekali lalu berhenti |
| `node index.js --once --dry` | sekali, tanpa kirim (untuk uji) |
| `node index.js --test` | kirim 1 pesan uji ke Telegram lalu berhenti |

## Cara kerja anti-spam

- **Dedup per token (mint):** token yang sudah pernah di-alert disimpan di
  `state.json`, jadi **tidak dikirim ulang** meski token itu muncul di pool lain
  atau bot di-restart.
- Gate umur (`maxTokenAgeMinutes`) mencegah banjir alert saat pertama dijalankan:
  hanya token yang benar-benar baru yang dikirim.
- Jika token muncul tapi volume belum ≥ `minVolumeUsd`, bot terus memantau dan
  mengirim alert **begitu** volume menembus ambang (selama masih dalam gate umur).

## Auto-start saat PC nyala (Windows, opsional)

Agar bot **jalan otomatis setiap login ke Windows** (tersembunyi + restart sendiri
bila crash), jalankan sekali:

```
autostart\install-autostart.bat
```

Skrip ini membuat launcher di folder Startup Anda yang menjalankan
`autostart\run-hidden.vbs` (tanpa admin). Semua skrip `autostart\` bersifat
**portable** — mendeteksi lokasi foldernya sendiri, jadi bekerja di mana pun repo
di-clone. Syarat: `node` bisa dipanggil dari PATH (installer Node biasa otomatis).

| Aksi | Cara |
|---|---|
| Pasang auto-start | `autostart\install-autostart.bat` |
| Jalankan sekarang (tanpa logout) | klik dua kali `autostart\run-hidden.vbs` |
| Hentikan bot sekarang | `autostart\stop-bot.bat` |
| Lihat aktivitas | buka `bot.log` |
| **Nonaktifkan** auto-start | `autostart\uninstall-autostart.bat` |

> Penting: auto-start hanya berguna kalau **token Telegram sudah diisi** di
> `config.json`. Tanpa itu, bot tetap jalan tapi hanya menulis log (tidak mengirim
> notifikasi). Setelah mengisi token, hentikan bot yang berjalan lalu jalankan
> ulang (atau cukup login ulang / restart PC).

> Pengaman **satu-instance**: jika bot sudah berjalan, menjalankan instance kedua
> akan otomatis menolak diri (mencegah notifikasi ganda).

## Struktur file

```
index.js            → loop utama & logika alert
config.json         → konfigurasi Anda (token Telegram + kriteria)  [gitignored]
config.example.json → template konfigurasi
state.json          → daftar pool yang sudah di-alert (otomatis)     [gitignored]
src/meteora.js      → pemanggil API pool-discovery Meteora
src/telegram.js     → pengirim pesan Telegram
src/format.js       → penyusun teks alert
src/state.js        → baca/tulis state.json
bot.log             → catatan aktivitas (dibuat otomatis saat auto-start)
autostart/          → skrip auto-start:
  start-bot.bat        loop node + restart otomatis (portable)
  run-hidden.vbs       menjalankan loop secara tersembunyi (portable)
  stop-bot.bat         hentikan bot yang berjalan
  install-autostart.bat / uninstall-autostart.bat  pasang/lepas auto-start
```

## Sumber data

`GET https://pool-discovery-api.datapi.meteora.ag/pools` — endpoint publik yang
dipakai halaman discovery Meteora. Kriteria dikirim lewat parameter `filter_by`.
