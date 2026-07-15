// Bot notifikasi Meteora — pool DLMM baru (SOL) yang punya volume.
//
// Alur satu siklus:
//   1. Panggil API pool-discovery Meteora dengan filter dari config.
//   2. Untuk tiap pool: alert bila (a) belum pernah di-alert,
//      (b) volume >= minVolumeUsd, (c) umur pool <= maxPoolAgeMinutes.
//   3. Simpan pool yang sudah di-alert ke state.json (anti-duplikat).
//
// Pemakaian:
//   node index.js            → loop terus tiap pollIntervalSeconds
//   node index.js --once     → jalan sekali lalu berhenti
//   node index.js --dry      → jangan kirim Telegram, cetak ke console saja
//   node index.js --test     → kirim satu pesan uji ke Telegram lalu berhenti
const fs = require("fs");
const path = require("path");
const { fetchPools, buildUrl } = require("./src/meteora");
const { sendTelegram } = require("./src/telegram");
const { formatAlert, baseToken } = require("./src/format");
const state = require("./src/state");

const argv = process.argv.slice(2);
const ONCE = argv.includes("--once");
const DRY = argv.includes("--dry");
const TEST = argv.includes("--test");

function loadConfig() {
  const file = path.join(__dirname, "config.json");
  if (!fs.existsSync(file)) {
    console.error("config.json tidak ditemukan. Salin config.example.json → config.json lalu isi Telegram.");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function ts() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// Kunci satu-instance: cegah bot jalan dobel (mis. auto-start + manual) yang
// bisa menyebabkan alert ganda. Lock dianggap "hidup" bila diperbarui < 2x
// interval poll yang lalu.
const LOCK = path.join(__dirname, "bot.lock");
function acquireLock(pollMs) {
  try {
    const stat = fs.statSync(LOCK);
    if (Date.now() - stat.mtimeMs < Math.max(pollMs * 2, 120000)) {
      console.error(`[${ts()}] Instance lain sepertinya sedang berjalan (bot.lock masih baru). Keluar.`);
      process.exit(0);
    }
  } catch {}
  try { fs.writeFileSync(LOCK, String(process.pid)); } catch {}
}
function refreshLock() {
  try { fs.utimesSync(LOCK, new Date(), new Date()); }
  catch { try { fs.writeFileSync(LOCK, String(process.pid)); } catch {} }
}

async function runOnce(cfg, st, alerted) {
  if (!ONCE) refreshLock();
  const t = cfg.trigger;
  let pools;
  try {
    pools = await fetchPools(t);
  } catch (e) {
    console.error(`[${ts()}] gagal ambil data: ${e.message}`);
    return;
  }

  // Dedup PER TOKEN (mint), bukan per pool — karena satu token bisa punya banyak
  // pool. Kunci = alamat token base (sisi non-SOL). Umur dihitung dari umur token.
  const maxAge = t.maxTokenAgeMinutes ?? t.maxPoolAgeMinutes; // dukung nama lama
  let fired = 0;
  let candidates = 0;
  for (const p of pools) {
    if (!p || !p.pool_address) continue;
    const token = baseToken(p);
    const tokenAddr = token && token.address;
    if (!tokenAddr) continue;
    if (alerted.has(tokenAddr)) continue; // token ini sudah pernah di-alert

    const volume = Number(p.volume) || 0;
    const createdAt = Number(token.created_at || p.pool_created_at);
    const ageMin = (Date.now() - createdAt) / 60000;

    if (volume < t.minVolumeUsd) continue;
    candidates++;
    if (maxAge && ageMin > maxAge) continue;

    // Lolos semua syarat → kirim alert (satu kali untuk token ini).
    const msg = formatAlert(p, t);
    try {
      if (DRY) {
        console.log(`[${ts()}] (dry) ALERT ${token.symbol || p.name} vol=${volume.toFixed(0)} age=${ageMin.toFixed(0)}m`);
        console.log(msg.replace(/<[^>]+>/g, "") + "\n");
      } else {
        await sendTelegram(cfg.telegram, msg);
        console.log(`[${ts()}] ALERT terkirim: ${token.symbol || p.name} (vol ${volume.toFixed(0)}, umur token ${ageMin.toFixed(0)}m)`);
      }
      alerted.add(tokenAddr); // dedup per token
      fired++;
    } catch (e) {
      console.error(`[${ts()}] gagal kirim alert ${token.symbol || p.name}: ${e.message}`);
    }
  }

  if (!DRY) {
    st.alerted = [...alerted];
    state.save(st);
  }
  console.log(`[${ts()}] cek selesai — ${pools.length} pool cocok filter, ${candidates} punya volume≥$${t.minVolumeUsd}, ${fired} alert baru.`);
}

async function main() {
  const cfg = loadConfig();

  if (TEST) {
    if (!cfg.telegram.token || !cfg.telegram.chatId) {
      console.error("Telegram belum diisi di config.json (token/chatId kosong).");
      process.exit(1);
    }
    const when = new Date().toLocaleString("id-ID");
    await sendTelegram(
      cfg.telegram,
      `✅ <b>Uji koneksi berhasil</b>\nMeteora New-Token Bot siap.\n${when}`
    );
    console.log(`[${ts()}] Pesan uji terkirim ke Telegram. Cek chat Anda.`);
    return;
  }

  const st = state.load();
  const alerted = new Set(st.alerted);

  console.log(`[${ts()}] Bot start. Filter aktif:`);
  console.log("  " + buildUrl(cfg.trigger));
  console.log(`  volume≥$${cfg.trigger.minVolumeUsd}, umur token≤${cfg.trigger.maxTokenAgeMinutes ?? cfg.trigger.maxPoolAgeMinutes}m, poll tiap ${cfg.pollIntervalSeconds}s`);
  if (DRY) console.log("  MODE: --dry (tidak mengirim Telegram)");
  if (!DRY && (!cfg.telegram.token || !cfg.telegram.chatId))
    console.log("  CATATAN: Telegram belum diisi → pesan hanya dicetak ke console.");
  console.log(`  Token sudah pernah di-alert: ${alerted.size} (dari state.json)`);

  const ms = Math.max(15, cfg.pollIntervalSeconds || 45) * 1000;
  if (!ONCE) acquireLock(ms);

  await runOnce(cfg, st, alerted);
  if (ONCE) return;

  setInterval(() => runOnce(cfg, st, alerted), ms);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
