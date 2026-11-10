// Writes a FAKE data folder (synthetic prices) so the pipeline, backtest and site can be
// tested without network access. Results from it are meaningless and are labelled FIXTURE.
// Usage: node tests/make_fixture_data.mjs [outDir] [days]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
const E = createRequire(import.meta.url)('../engine/engine.js');

const OUT = process.argv[2] || 'site/data', DAYS = +(process.argv[3] || 30);
const end = Date.UTC(2026, 10, 10);
const specs = [
  { id: 'XAUUSD', name: 'Gold spot', source: 'fixture', symbol: 'XAUUSD', scale: 1000, mul: 1, digits: 2, currencies: ['USD'], costs: { spread: 0.3, commPerLot: 7, slippage: 0.1, contractSize: 100, feeBps: 0 }, ext: true },
  { id: 'XAUUSDT', name: 'Gold perpetual (Binance)', source: 'fixture', symbol: 'XAUUSDT', scale: 1000, mul: 1, digits: 2, currencies: ['USD'], costs: { spread: 0.1, commPerLot: 0, slippage: 0.1, contractSize: 1, feeBps: 8 }, td: true, seed: 7 },
  { id: 'AUDUSD', name: 'Australian dollar / US dollar', source: 'fixture', symbol: 'AUDUSD', scale: 100000, mul: 0.66 / 3950, digits: 5, currencies: ['USD', 'AUD'], costs: { spread: 0.0001, commPerLot: 7, slippage: 0.00002, contractSize: 100000, feeBps: 0 }, seed: 9 }
];
fs.mkdirSync(path.join(OUT, 'candles'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'news'), { recursive: true });
const manifest = { generatedAt: Date.now(), days: DAYS, fixture: true, markets: [] };
for (const s of specs) {
  const b = E.synthetic(end, DAYS, s.seed || 42, E.USD_HIGH_IMPACT.map(e => e.t));
  const n = b.t.length, sc = s.scale, q = x => Math.round(x * s.mul * sc);
  const dt = []; let prev = b.t[0];
  for (let i = 0; i < n; i++) { dt.push((b.t[i] - prev) / 60000); prev = b.t[i]; }
  const o = Array.from(b.o, q), h = Array.from(b.h, q), l = Array.from(b.l, q), c = Array.from(b.c, q);
  const v = Array.from(b.v), td = s.td ? v.map((x, i) => Math.round(x * Math.tanh((b.c[i] - b.o[i]) * 3))) : null;
  const obj = { id: s.id, name: s.name, source: s.source, symbol: s.symbol, digits: s.digits, currencies: s.currencies, costs: s.costs, resMin: 1, t0: b.t[0], dt, scale: sc, o, h, l, c, v, td, from: b.t[0], to: b.t[n - 1], bars: n, generatedAt: Date.now() };
  if (s.ext) { obj.ev = Array.from(b.ev); obj.etd = obj.ev.map((x, i) => Math.round(x * Math.tanh((b.c[i] - b.o[i]) * 3))); obj.external = { label: 'Fixture external volume', coverage: 1 }; }
  fs.writeFileSync(path.join(OUT, 'candles', s.id + '.json.gz'), zlib.gzipSync(JSON.stringify(obj)));
  manifest.markets.push({ days: DAYS, research: s.id === 'XAUUSD' ? ['5-60'] : undefined, id: s.id, name: s.name, source: s.source, symbol: s.symbol, digits: s.digits, currencies: s.currencies, costs: s.costs, file: `candles/${s.id}.json.gz`, from: obj.from, to: obj.to, bars: n, trueDelta: !!td, external: obj.external || null });
}
fs.writeFileSync(path.join(OUT, 'markets.json'), JSON.stringify(manifest, null, 1));
const now = Date.now(), ev = (dh, title, cur, impact, f, p) => ({ t: now + dh * 3600e3, title, currency: cur, impact, forecast: f, previous: p, actual: '' });
fs.writeFileSync(path.join(OUT, 'news', 'calendar.json'), JSON.stringify({ updatedAt: now, source: 'fixture', fetched: 4, errors: [], events: [
  ev(20, 'Unemployment Claims', 'USD', 'Medium', '226K', '221K'), ev(44, 'PPI m/m', 'USD', 'High', '0.2%', '0.3%'),
  ev(30, 'Employment Change', 'AUD', 'High', '25.0K', '14.9K'), ev(140, 'Retail Sales m/m', 'USD', 'High', '0.4%', '0.6%')] }));
fs.writeFileSync(path.join(OUT, 'status.json'), JSON.stringify({ fixture: true, markets: Object.fromEntries(specs.map(s => [s.id, { ok: true }])) }));
console.log('Fixture data written to', OUT);
