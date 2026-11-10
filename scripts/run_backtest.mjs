#!/usr/bin/env node
// Runs the C2 Edge backtest on the data folder built by build_data.py and writes
//   <out>/results.json   (read by the web app)
//   <out>/summary.md     (also appended to the GitHub Actions run summary)
// Usage: node scripts/run_backtest.mjs --data site/data --out site/data/results [--quick]
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../engine/engine.js');
globalThis.ENGINE = E;
const job = require('../engine/worker.js');

const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => a.startsWith('--') ? [a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true] : null).filter(Boolean));
const DATA = args.data || 'site/data', OUT = args.out || path.join(DATA, 'results'), QUICK = !!args.quick;
const FRACTALS = { '1-15': { ltf: 1, htf: 15, label: '1m-15m' }, '5-60': { ltf: 5, htf: 60, label: '5m-1H' }, '15-240': { ltf: 15, htf: 240, label: '15m-4H' } };

const manifest = JSON.parse(fs.readFileSync(path.join(DATA, 'markets.json'), 'utf8'));
let calendar = [];
try { calendar = JSON.parse(fs.readFileSync(path.join(DATA, 'news', 'calendar.json'), 'utf8')).events || []; } catch { console.warn('No news calendar; using the built-in USD schedule only.'); }

const pickM = m => ({ n: m.n, winRate: +m.winRate.toFixed(4), expR: +m.expR.toFixed(4), pf: isFinite(m.pf) ? +m.pf.toFixed(3) : null, retPct: +m.retPct.toFixed(4), maxDD: +m.maxDD.toFixed(4), totalR: +m.totalR.toFixed(2), avgWinR: +m.avgWinR.toFixed(3), avgLossR: +m.avgLossR.toFixed(3), longs: m.longs, shorts: m.shorts });
const median = a => { if (!a.length) return null; const b = [...a].sort((x, y) => x - y), k = b.length >> 1; return b.length % 2 ? b[k] : (b[k - 1] + b[k]) / 2; };
const results = { generatedAt: Date.now(), fixture: !!manifest.fixture, days: manifest.days, markets: {} };
const t0 = Date.now();

for (const mk of manifest.markets) {
  const raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(DATA, mk.file))).toString());
  const base = E.unpackMarket(raw);
  const news = E.marketNews(mk.currencies || ['USD'], calendar);
  const newsT = news.map(e => e.t);
  const P = Object.assign({}, E.DEFAULTS, mk.costs || {}, { htfOffset: 0, anchor: 'ny17', levelVol: base.ev ? 'futures' : 'broker', deltaVol: base.ev ? 'futures' : 'broker', deltaSrc: base.etd || base.td ? 'true' : 'clv' });
  if (!base.notes.hasVolume && !base.ev) { P.levelVol = 'unit'; P.deltaVol = 'unit'; }
  const out = { name: mk.name, from: base.t[0], to: base.t[base.t.length - 1], bars: base.t.length, external: mk.external || null, trueDelta: !!base.td, newsEvents: news.filter(e => e.t >= base.t[0] && e.t <= base.t[base.t.length - 1]).length, params: P, fractals: {} };
  for (const [key, fr] of Object.entries(FRACTALS)) {
    if (fr.ltf % base.resMin) continue;
    if (QUICK && key === '1-15') continue;
    const ctx = E.prepare(base, fr, { anchor: P.anchor, news });
    const r = E.simulate(ctx, P), m = E.split(r);
    const f = { setups: r.setups, splitT: r.splitT, all: pickM(m.all), is: pickM(m.is), oos: pickM(m.oos), mc: E.monteCarlo(r.trades, P.riskPct, 1000, 11), skipped: r.skipped,
      trades: r.trades.map(t => ({ e: t.entryT, x: t.exitT, d: t.dir, en: t.entry, ex: t.exit, st: +t.stop.toFixed(5), tg: +t.target.toFixed(5), R: +t.R.toFixed(3), pnl: +t.pnl.toFixed(2), why: t.reason, oos: t.oos })) };
    const opt = job({ kind: 'optimize', base, params: P, fractal: fr, objective: 't', minTrades: 15, news: newsT });
    f.optimizer = { tested: opt.tested, robustCount: opt.top.filter(x => x.oos.expR > 0 && x.oos.n >= 5).length, top: opt.top.slice(0, 10).map(x => ({ p: x.p, is: pickM(x.is), oos: pickM(x.oos) })) };
    if (key === '5-60' || (QUICK && key === '15-240' && !out.delta)) {
      const dl = job({ kind: 'delta', base, params: P, fractal: fr, news: newsT });
      out.delta = { fractal: key, base: { is: pickM(dl.base.is), oos: pickM(dl.base.oos) }, rows: dl.rows.map(x => ({ kind: x.kind, vol: x.vol, mode: x.mode, is: pickM(x.is), oos: pickM(x.oos) })), quality: dl.quality };
    }
    out.fractals[key] = f;
    console.log(`${mk.id} ${fr.label}: ${m.all.n} trades, win ${(m.all.winRate * 100).toFixed(1)}%, avg ${m.all.expR.toFixed(2)}R, OOS ${m.oos.expR.toFixed(2)}R (${m.oos.n})`);
  }
  // how this market moved after each release type
  const ctx1 = { bars: E.resample(base, base.resMin), ltfMin: base.resMin };
  const study = E.eventStudy(ctx1, news.filter(e => e.t >= base.t[0] && e.t <= base.t[base.t.length - 1]));
  const byType = {};
  study.forEach(r => (byType[r.type] = byType[r.type] || []).push(r));
  out.events = Object.fromEntries(Object.entries(byType).map(([k, v]) => [k, { n: v.length, medAbs15: median(v.map(x => Math.abs(x.m15))), medAbs60: median(v.map(x => Math.abs(x.m60))), medRange60: median(v.map(x => x.range60)), maxRange60: Math.max(...v.map(x => x.range60)), up60: v.filter(x => x.m60 > 0).length }]));
  results.markets[mk.id] = out;
}
results.seconds = Math.round((Date.now() - t0) / 1000);
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results));

// ------------------------------------------------------------------ markdown summary
const pc = x => x == null ? '–' : (x * 100).toFixed(1) + '%', r2 = x => x == null ? '–' : x.toFixed(2);
const DN = Object.fromEntries(E.DELTA_SOURCES.map(d => [d.id, d.name]));
let md = `## C2 Edge backtest${results.fixture ? ' (FIXTURE DATA: test run, not market results)' : ''}\n\n`;
md += `Last ${manifest.days} days of 1-minute data. In-sample = first 67% of the period, out-of-sample (OOS) = the rest. Costs included. Default settings (CISD close entry, 2R target, London + NY hours, news blackout).\n\n`;
md += '| Market | Fractal | Trades | Win | Avg R | PF | Net | Max DD | IS R | OOS R (n) | Best optimizer setting IS → OOS | Top-10 robust |\n|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|\n';
for (const [id, m] of Object.entries(results.markets)) for (const [k, f] of Object.entries(m.fractals)) {
  const b = f.optimizer.top[0];
  md += `| ${id} | ${FRACTALS[k].label} | ${f.all.n} | ${pc(f.all.winRate)} | ${r2(f.all.expR)} | ${r2(f.all.pf)} | ${pc(f.all.retPct)} | ${pc(f.all.maxDD)} | ${r2(f.is.expR)} | ${r2(f.oos.expR)} (${f.oos.n}) | ${b ? `${b.p.entryModel}/${b.p.targetMode === 'rr' ? b.p.rr + 'R' : b.p.targetMode}/vwap ${b.p.vwapMode}/frvp ${b.p.frvpMode}/delta ${b.p.deltaMode}: ${r2(b.is.expR)} → ${r2(b.oos.expR)}` : 'too few trades'} | ${f.optimizer.robustCount}/${f.optimizer.top.length} |\n`;
}
md += '\n### Delta sources (5m-1H, used as a filter)\n\n| Market | Best in-sample | OOS R with it | OOS R without | Next-3-bar hit rate |\n|---|---|---:|---:|---:|\n';
for (const [id, m] of Object.entries(results.markets)) {
  if (!m.delta) continue;
  const best = m.delta.rows.filter(x => x.is.n >= 10).sort((a, b) => b.is.expR - a.is.expR)[0];
  const q = best && m.delta.quality.find(y => y.kind === best.kind && y.vol === best.vol);
  md += best ? `| ${id} | ${DN[best.kind]} · ${best.vol} · ${best.mode} | ${r2(best.oos.expR)} | ${r2(m.delta.base.oos.expR)} | ${q ? pc(q.hitRate) : '–'} |\n` : `| ${id} | not enough trades | | | |\n`;
}
md += `\nA setting is only worth trading if it stays positive out-of-sample with a reasonable number of trades. Ran in ${results.seconds}s.\n`;
fs.writeFileSync(path.join(OUT, 'summary.md'), md);
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
console.log('\n' + md);
