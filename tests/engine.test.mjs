// Engine tests. Run: node --test tests/engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../engine/engine.js');
globalThis.ENGINE = E;
const job = require('../engine/worker.js');

const END = Date.UTC(2026, 10, 10);
const NEWS = E.USD_HIGH_IMPACT.map(e => e.t);
const base = E.synthetic(END, 30, 42, NEWS);

function handBuiltBullishC2() {
  const T0 = Date.UTC(2026, 10, 3, 8, 0), b = { t: [], o: [], h: [], l: [], c: [], v: [] };
  const bar = (o, h, l, c) => { b.t.push(T0 + b.t.length * 300000); b.o.push(o); b.h.push(h); b.l.push(l); b.c.push(c); b.v.push(100); };
  const p = [[102, 104, 101.5, 103], [103, 103.5, 101, 101.5], [101.5, 102, 100, 100.5], [100.5, 101.5, 100, 101]];
  for (let i = 0; i < 12; i++) bar(...p[i % 4]);
  bar(101, 101.2, 100.4, 100.6); bar(100.6, 100.7, 99.6, 99.8); bar(99.8, 99.9, 98.6, 98.8); bar(98.8, 99.0, 98.0, 98.3);
  for (let i = 0; i < 7; i++) bar(98.3 + i * 0.3, 98.7 + i * 0.3, 98.2 + i * 0.3, 98.6 + i * 0.3);
  bar(100.4, 101.4, 100.3, 101.3);
  for (let i = 0; i < 12; i++) bar(101.3 + i * 0.5, 101.9 + i * 0.5, 101.1 + i * 0.5, 101.8 + i * 0.5);
  for (let i = 0; i < 12; i++) bar(107, 107.3, 106.8, 107);
  const f = a => Float64Array.from(a);
  return { t: f(b.t), o: f(b.o), h: f(b.h), l: f(b.l), c: f(b.c), v: f(b.v), ev: null, td: null, resMin: 5 };
}

test('detects a bullish C2 and its CISD level', () => {
  const ctx = E.prepare(handBuiltBullishC2(), { ltf: 5, htf: 60 }, { news: [] });
  assert.equal(ctx.setups.length, 1);
  const s = ctx.setups[0];
  assert.equal(s.dir, 1); assert.equal(s.extreme, 98); assert.equal(s.level, 101); assert.equal(s.confirmIdx, 23);
});

test('enters long after CISD with the stop under the sweep and a 2R target', () => {
  const ctx = E.prepare(handBuiltBullishC2(), { ltf: 5, htf: 60 }, { news: [] });
  const r = E.simulate(ctx, { entryModel: 'cisd', sessions: 'all', maxChase: 2, rr: 2, newsFlatten: 0 });
  assert.equal(r.trades.length, 1);
  const t = r.trades[0];
  assert.equal(t.dir, 1); assert.equal(t.entry, 101.3);
  assert.ok(t.stop < 98); assert.ok(Math.abs(t.target - (t.entry + 2 * t.risk)) < 1e-9);
});

test('no lookahead: trades closed before a cut are identical with or without later data', () => {
  const cut = (b, n) => { const o = { resMin: b.resMin, td: null }; for (const k of ['t', 'o', 'h', 'l', 'c', 'v', 'ev']) o[k] = b[k].slice(0, n); return o; };
  for (const fr of [{ ltf: 1, htf: 15 }, { ltf: 5, htf: 60 }]) for (const extra of [{}, { entryModel: 'retest' }, { entryModel: 'ic', vwapMode: 'trend', frvpMode: 'level' }, { deltaMode: 'div', deltaSrc: 'ib_clv' }]) {
    const full = E.simulate(E.prepare(base, fr, {}), extra);
    const nb = Math.floor(base.t.length * 0.6), b2 = cut(base, nb);
    const part = E.simulate(E.prepare(b2, fr, {}), extra);
    const lim = b2.t[nb - 1] - 6 * 3600e3 * (fr.htf / 60 + 1);
    const key = t => [t.entryT, t.exitT, t.entry, t.exit.toFixed(5), t.R.toFixed(5)].join('|');
    assert.deepEqual(full.trades.filter(t => t.exitT < lim).map(key), part.trades.filter(t => t.exitT < lim).map(key), JSON.stringify(fr) + JSON.stringify(extra));
  }
});

test('costs: contract size and fees scale P&L correctly', () => {
  const ctx = E.prepare(base, { ltf: 5, htf: 60 }, {});
  const a = E.simulate(ctx, { spread: 0, commPerLot: 0, slippage: 0, beAtR: 0 }), b = E.simulate(ctx, { spread: 0, commPerLot: 0, slippage: 0, beAtR: 0, feeBps: 10 });
  a.trades.forEach(t => assert.equal(t.cost, 0));
  b.trades.forEach(t => assert.ok(Math.abs(t.cost - t.entry * 10 / 1e4) < 1e-9));
  assert.equal(a.trades.length, b.trades.length); // without breakeven moves, fees change P&L but not which trades happen
  assert.ok(b.trades.reduce((s, t) => s + t.R, 0) < a.trades.reduce((s, t) => s + t.R, 0));
  const fx = E.simulate(ctx, { contractSize: 100000, commPerLot: 7 });
  fx.trades.forEach(t => assert.ok(Math.abs(t.pnl - (t.R * t.risk) * t.lots * 100000) < 1e-6));
});

test('news blackout blocks entries near releases', () => {
  const ctx = E.prepare(base, { ltf: 5, htf: 60 }, {});
  ctx.newsSorted = NEWS;
  const r = E.simulate(ctx, { newsBefore: 30, newsAfter: 30 });
  for (const t of r.trades) for (const n of NEWS) assert.ok(!(n >= t.entryT - 30 * 60000 && n <= t.entryT + 30 * 60000));
});

test('pipeline helpers: unpack, slice, market news', () => {
  const m = { id: 'X', t0: 1000 * 60000, dt: [0, 1, 1], scale: 1000, o: [4000000, 4001000, 4002000], h: [4001000, 4002000, 4003000], l: [3999000, 4000000, 4001000], c: [4000500, 4001500, 4002500], v: [1, 2, 3], td: [1, -1, 0], ev: null, etd: null };
  const b = E.unpackMarket(m);
  assert.equal(b.t[2], 1002 * 60000); assert.equal(b.o[1], 4001); assert.equal(b.td[1], -1);
  assert.equal(E.lastDays(base, 10).t.length < base.t.length, true);
  const news = E.marketNews(['USD', 'AUD'], [{ t: 5, title: 'Employment Change', currency: 'AUD', impact: 'High' }, { t: 6, title: 'GDP', currency: 'EUR', impact: 'High' }]);
  assert.ok(news.some(e => e.currency === 'AUD')); assert.ok(!news.some(e => e.currency === 'EUR'));
});

test('optimizer and delta lab jobs run and rank on in-sample only', () => {
  const P = Object.assign({}, E.DEFAULTS, { htfOffset: 0, anchor: 'ny17' });
  const opt = job({ kind: 'optimize', base, params: P, fractal: { ltf: 15, htf: 240 }, objective: 't', minTrades: 3, news: [] });
  assert.equal(opt.tested, 810);
  for (let i = 1; i < opt.top.length; i++) assert.ok(opt.top[i - 1].score >= opt.top[i].score);
  const dl = job({ kind: 'delta', base, params: P, fractal: { ltf: 5, htf: 60 }, news: [] });
  assert.ok(dl.rows.length > 0 && dl.quality.length > 0);
});

test('Forex Factory JSON parsing', () => {
  const ev = E.parseFF('[{"title":"CPI m/m","country":"USD","date":"2026-11-10T08:30:00-05:00","impact":"High","forecast":"0.3%","previous":"0.2%"}]');
  assert.equal(ev[0].t, Date.UTC(2026, 10, 10, 13, 30)); assert.equal(E.usdSurpriseSign('Unemployment Rate'), -1);
});
