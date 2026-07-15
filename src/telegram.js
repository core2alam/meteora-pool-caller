// Kirim pesan ke Telegram lewat Bot API. token & chatId dari config.json.
// Bila salah satu kosong → mode "dry" otomatis (cetak ke console, tidak kirim).
async function sendTelegram({ token, chatId }, text) {
  if (!token || !chatId) {
    console.log("[dry] (Telegram belum dikonfigurasi) pesan:\n" + stripHtml(text) + "\n");
    return { dry: true };
  }
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  if (!r.ok) throw new Error(`telegram ${r.status} ${await r.text()}`);
  return r.json();
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").trim();
}

module.exports = { sendTelegram };
