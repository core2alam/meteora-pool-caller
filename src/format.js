// Susun pesan alert (HTML untuk Telegram) dari satu objek pool API Meteora.
const SOL = "So11111111111111111111111111111111111111112";

function usd(n) {
  const v = Number(n) || 0;
  if (v >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return "$" + (v / 1e3).toFixed(2) + "K";
  return "$" + v.toFixed(2);
}

function ageStr(createdAtMs) {
  const min = Math.max(0, Math.floor((Date.now() - createdAtMs) / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}j ${m}m`;
}

// Token "base" = sisi yang BUKAN SOL (token barunya).
function baseToken(p) {
  if (p.token_x && p.token_x.address !== SOL) return p.token_x;
  if (p.token_y && p.token_y.address !== SOL) return p.token_y;
  return p.token_x || p.token_y || {};
}

function formatAlert(p, trigger) {
  const b = baseToken(p);
  const binStep = p.dlmm_params ? p.dlmm_params.bin_step : "?";
  const tokenAge = b.created_at ? ageStr(b.created_at) : ageStr(p.pool_created_at);
  const L = [];
  L.push(`\u{1F680} <b>Token baru + volume</b>`);
  L.push(`<b>${b.name || b.symbol || "?"}</b> ($${b.symbol || "?"})  ·  pair SOL`);
  L.push("");
  L.push(`Umur token: <b>${tokenAge}</b>`);
  L.push(`Volume ${trigger.timeframe}: <b>${usd(p.volume)}</b>`);
  L.push(`TVL: <b>${usd(p.tvl)}</b>  ·  MC: <b>${usd(b.market_cap)}</b>`);
  L.push(`Holders: <b>${b.holders ?? p.base_token_holders ?? "?"}</b>  ·  bin ${binStep} · fee ${p.fee_pct ?? "?"}%`);
  L.push("");
  L.push(`Token (mint):`);
  L.push(`<pre>${b.address}</pre>`);
  L.push(
    `<a href="https://app.meteora.ag/dlmm/${p.pool_address}">Pool di Meteora</a>` +
      ` · <a href="https://dexscreener.com/solana/${b.address}">DexScreener</a>` +
      ` · <a href="https://solscan.io/token/${b.address}">Solscan</a>`
  );
  return L.join("\n");
}

module.exports = { formatAlert, usd, ageStr, baseToken };
