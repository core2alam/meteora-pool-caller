// Pemanggil API "pool discovery" Meteora — endpoint yang sama dipakai halaman
// meteora.ag (gratis, CORS-open, tanpa login). Kriteria filter dibangun dari
// config.trigger sehingga sama persis dengan filter di UI situs.
const BASE = "https://pool-discovery-api.datapi.meteora.ag/pools";

// Susun query string `filter_by` dengan operator ala-Meteora: `&&` (AND),
// `||` (OR), `=` (sama dengan), `>=` (minimal).
function buildFilterBy(t) {
  const parts = [];
  if (t.newListing) parts.push("base_token_is_new_listing=true");
  if (t.dlmmOnly) parts.push("pool_type=dlmm");
  if (t.minMarketCapUsd != null) parts.push(`base_token_market_cap>=${t.minMarketCapUsd}`);
  if (t.minHoldersCount != null) parts.push(`base_token_holders>=${t.minHoldersCount}`);
  if (t.minTvlUsd != null) parts.push(`tvl>=${t.minTvlUsd}`);
  if (t.tokenAddress) parts.push(`(token_x=${t.tokenAddress}||token_y=${t.tokenAddress})`);
  return parts.join("&&");
}

function buildUrl(t) {
  const qs = new URLSearchParams({
    page_size: String(t.pageSize || 50),
    timeframe: t.timeframe || "5m",
    category: "top",
  });
  return `${BASE}?${qs.toString()}&filter_by=${encodeURIComponent(buildFilterBy(t))}`;
}

// Kembalikan array pool yang lolos filter server-side. Melempar error bila
// jaringan/HTTP gagal (dibiarkan ditangani pemanggil supaya loop tetap hidup).
async function fetchPools(trigger) {
  const url = buildUrl(trigger);
  const r = await fetch(url, { headers: { accept: "application/json" } });
  if (!r.ok) throw new Error(`pool-discovery HTTP ${r.status}`);
  const j = await r.json();
  return Array.isArray(j.data) ? j.data : [];
}

module.exports = { fetchPools, buildUrl, buildFilterBy };
