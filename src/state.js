// Penyimpanan sederhana berbasis file (state.json) untuk mengingat TOKEN (mint)
// yang sudah pernah di-alert, supaya tidak dikirim berulang meski bot di-restart
// atau muncul di pool lain. Kunci dedup = alamat token, bukan alamat pool.
const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "..", "state.json");
const MAX_KEEP = 3000; // batasi ukuran daftar agar tidak membengkak

function load() {
  try {
    const j = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return { alerted: Array.isArray(j.alerted) ? j.alerted : [] };
  } catch {
    return { alerted: [] };
  }
}

function save(state) {
  const out = { alerted: state.alerted.slice(-MAX_KEEP) };
  fs.writeFileSync(FILE, JSON.stringify(out, null, 2));
}

module.exports = { load, save, FILE };
