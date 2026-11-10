(function () {
'use strict';
var E = ENGINE, $ = function (id) { return document.getElementById(id); };
var FR = { '1-15': { ltf: 1, htf: 15, label: '1m – 15m' }, '5-60': { ltf: 5, htf: 60, label: '5m – 1H' }, '15-240': { ltf: 15, htf: 240, label: '15m – 4H' } };
var S = { base: null, name: '', synthetic: true, futCoverage: 0, ff: [], ctx: {}, res: {}, sel: '5-60', selTrade: null, studies: null, ctxKey: '', digits: 2, pipe: null, market: null, full: null };
var sampleFn = null, downloads = null;

// ------------------------------------------------------------------ helpers
function css(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
function pad(n) { return n < 10 ? '0' + n : '' + n; }
function fmtUTC(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()); }
function fmtDay(t) { return fmtUTC(t).slice(0, 10); }
function pct(x, d) { return isFinite(x) ? (x * 100).toFixed(d === undefined ? 1 : d) + '%' : '–'; }
function fx(x, d) { return isFinite(x) ? x.toFixed(d === undefined ? 2 : d) : '∞'; }
function fp(x) { return isFinite(x) ? x.toFixed(S.digits) : '–'; }
function money(x) { var s = Math.abs(x) >= 1000 ? Math.round(Math.abs(x)).toLocaleString('en-US') : Math.abs(x).toFixed(0); return (x < 0 ? '−$' : '$') + s; }
function sgnCls(x) { return x > 0 ? 'pos' : x < 0 ? 'neg' : 'mut'; }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(function () { t.hidden = true; }, 3200); }
function median(a) { if (!a.length) return NaN; var b = a.slice().sort(function (x, y) { return x - y; }), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; }
function store(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function load(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }

// ------------------------------------------------------------------ settings
var NUM = ['bufferATR', 'rr', 'minRR', 'maxChase', 'beAtR', 'maxRiskATR', 'partialAtR', 'partialPct', 'frvpTolATR', 'newsBefore', 'newsAfter', 'newsFlatten', 'spread', 'commPerLot', 'slippage', 'riskPct', 'equity', 'isFrac', 'htfOffset', 'contractSize', 'feeBps'];
var SEL = ['entryModel', 'side', 'stopMode', 'targetMode', 'sessions', 'vwapMode', 'frvpMode', 'levelVol', 'deltaMode', 'deltaVol', 'deltaSrc', 'anchor'];
var CHK = ['useC4Invalid', 'timeExit', 'useClaims'];
E.DELTA_SOURCES.forEach(function (d) { var o = document.createElement('option'); o.value = d.id; o.textContent = d.name; $('deltaSrc').appendChild(o); });
$('deltaSrc').value = 'clv';
function params() {
  var p = {};
  NUM.forEach(function (k) { p[k] = parseFloat($(k).value); if (!isFinite(p[k])) p[k] = E.DEFAULTS[k] || 0; });
  SEL.forEach(function (k) { p[k] = $(k).value; });
  CHK.forEach(function (k) { p[k] = $(k).checked; });
  p.sd = p.rr;
  return p;
}
function applyParams(p) {
  Object.keys(p).forEach(function (k) { var el = $(k); if (!el) return; if (el.type === 'checkbox') el.checked = !!p[k]; else el.value = p[k]; });
}
(function restore() { var p = load('c2edge.params'); if (p) applyParams(p); })();
document.querySelector('aside.rail').addEventListener('change', function () { store('c2edge.params', params()); });

// ------------------------------------------------------------------ tabs
function showTab(name) {
  document.querySelectorAll('nav.tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'); });
  document.querySelectorAll('section.view').forEach(function (s) { s.hidden = s.dataset.view !== name; });
  if (name === 'backtest') setTimeout(resizeCharts, 0);
  if (name === 'news') renderNews();
  try { history.replaceState(null, '', '#' + name); } catch (e) {}
}
document.querySelectorAll('nav.tabs button').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.tab); }); });
document.addEventListener('click', function (e) { var a = e.target.closest('[data-goto]'); if (a) { e.preventDefault(); showTab(a.dataset.goto); } });

// ------------------------------------------------------------------ news set
function calendarAll() { return ((S.pipe && S.pipe.calendar) || []).concat(S.ff); }
function currencies() { return (S.market && S.market.currencies) || ['USD']; }
function newsEvents() {
  var p = params(), list = E.marketNews(currencies(), calendarAll());
  if (p.useClaims && S.base) list = list.concat(E.weeklyClaims(S.base.t[0], S.base.t[S.base.t.length - 1] + 14 * E.DAY));
  list.sort(function (a, b) { return a.t - b.t; });
  var out = [];
  list.forEach(function (x) { var dup = out.some(function (y) { return Math.abs(y.t - x.t) < 60000 && (y.type === x.type || y.title === x.title || /payroll|cpi|ppi|fomc|pce|gdp|jolts|retail/i.test(x.title + y.title)); }); if (!dup) out.push(x); });
  return out;
}

// ------------------------------------------------------------------ data
function setPill() {
  var b = S.base, pill = $('dataPill');
  if (!b) { $('dataPillTxt').textContent = 'No data'; return; }
  pill.className = 'pill ' + (S.synthetic ? 'warn' : 'ok');
  $('dataPillTxt').textContent = (S.synthetic ? 'Synthetic demo · ' : S.name + ' · ') + b.resMin + 'm · ' + fmtDay(b.t[0]) + ' → ' + fmtDay(b.t[b.t.length - 1]);
  $('runBtn').hidden = false;
  $('synthBanner').hidden = !S.synthetic;
  var n = b.notes || {}, lines = [];
  lines.push('<b>' + (S.synthetic ? 'Synthetic demo data' : esc(S.name)) + '</b>: ' + b.t.length.toLocaleString() + ' bars of ' + b.resMin + ' minute(s), ' + fmtUTC(b.t[0]) + ' to ' + fmtUTC(b.t[b.t.length - 1]) + ' UTC.');
  if (!S.synthetic) {
    lines.push(n.hasVolume ? (n.usedTickVolume ? 'Volume: tick volume column.' : 'Volume: present.') : 'Volume: <b>none</b>. Broker-volume options fall back to time-at-price.');
    if (n.hasTrueDelta) lines.push('True delta column found.');
    if (n.skipped) lines.push(n.skipped + ' unreadable rows skipped.');
  }
  lines.push(b.ev ? 'External volume: ' + (S.synthetic ? 'simulated' : b.notes && b.notes.external ? esc(b.notes.external.label) + ', matched on ' + pct(b.notes.external.coverage, 0) + ' of bars (with real taker delta)' : 'matched on ' + pct(S.futCoverage, 0) + ' of bars') + '.' : 'External volume: not loaded.');
  if (b.td) lines.push('Real taker buy/sell delta on this market.');
  var avail = Object.keys(FR).filter(function (k) { return FR[k].ltf % b.resMin === 0; }).map(function (k) { return FR[k].label; });
  lines.push('Fractals this data supports: ' + (avail.join(', ') || 'none') + '.');
  $('dataSummary').innerHTML = lines.join('<br>');
}
function setBase(base, name, synthetic) {
  if (!base.ev && S.futRaw) { var a = E.alignExternalVolume(base, S.futRaw); base.ev = a.ev; S.futCoverage = a.coverage; }
  S.base = base; S.name = name; S.synthetic = synthetic; S.ctx = {}; S.res = {}; S.studies = null; S.selTrade = null;
  if (!synthetic && !S.market) {
    if (!base.notes.hasVolume) { if ($('levelVol').value === 'broker') $('levelVol').value = base.ev ? 'futures' : 'unit'; if ($('deltaVol').value === 'broker') $('deltaVol').value = base.ev ? 'futures' : 'unit'; }
  }
  Object.keys(FR).forEach(function (k) { var ok = FR[k].ltf % base.resMin === 0; $('fr_' + k).disabled = !ok; if (!ok) $('fr_' + k).checked = false; });
  setPill();
  run();
}
function readFile(file, cb) { var r = new FileReader(); r.onload = function () { cb(String(r.result)); }; r.onerror = function () { toast('Could not read ' + file.name); }; r.readAsText(file); }
function onPrice(file) {
  $('priceStatus').textContent = 'Reading ' + file.name + '…';
  readFile(file, function (txt) {
    try {
      var b = E.parseCSV(txt, $('tzPrice').value);
      if (b.resMin > 15) throw new Error('This file is ' + b.resMin + '-minute data. The lowest fractal needs 1, 5 or 15-minute bars.');
      b.ev = null;
      var days = (b.t[b.t.length - 1] - b.t[0]) / E.DAY;
      $('priceStatus').textContent = 'Loaded ' + b.t.length.toLocaleString() + ' bars (' + days.toFixed(0) + ' days).' + (days < 80 ? ' That is less than 90 days.' : '') + (b.notes.timezoneInFile ? ' The file states its own timezone, so the offset was ignored.' : '');
      S.market = null; S.digits = guessDigits(b); markStrip();
      setBase(b, file.name, false);
      showTab('backtest');
    } catch (e) { $('priceStatus').textContent = e.message; }
  });
}
function onFut(file) {
  $('futStatus').textContent = 'Reading ' + file.name + '…';
  readFile(file, function (txt) {
    try {
      var f = E.parseCSV(txt, $('tzFut').value);
      if (!f.notes.hasVolume) throw new Error('No volume column found in this file.');
      S.futRaw = f;
      if (S.base && !S.synthetic) { var a = E.alignExternalVolume(S.base, f); S.base.ev = a.ev; S.futCoverage = a.coverage; S.ctx = {}; $('futStatus').textContent = 'Matched futures volume on ' + pct(a.coverage, 0) + ' of price bars.'; setPill(); run(); }
      else $('futStatus').textContent = 'Futures volume read (' + f.t.length.toLocaleString() + ' bars). It will be matched when you load your price file.';
    } catch (e) { $('futStatus').textContent = e.message; }
  });
}
$('filePrice').addEventListener('change', function (e) { if (e.target.files[0]) onPrice(e.target.files[0]); });
$('fileFut').addEventListener('change', function (e) { if (e.target.files[0]) onFut(e.target.files[0]); });
[['dropPrice', onPrice], ['dropFut', onFut]].forEach(function (x) {
  var el = $(x[0]);
  el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('over'); });
  el.addEventListener('dragleave', function () { el.classList.remove('over'); });
  el.addEventListener('drop', function (e) { e.preventDefault(); el.classList.remove('over'); if (e.dataTransfer.files[0]) x[1](e.dataTransfer.files[0]); });
});
$('useDemo').addEventListener('click', function () { loadDemo(); showTab('backtest'); });
function guessDigits(b) { var p = b.c[b.c.length - 1]; return p < 20 ? 5 : p < 200 ? 3 : 2; }
function loadDemo() {
  S.market = null; S.digits = 2;
  var end = Date.UTC(2026, 10, 10, 0, 0);
  setBase(E.synthetic(end, 90, 42, E.USD_HIGH_IMPACT.map(function (e) { return e.t; })), 'Synthetic', true);
}

// ------------------------------------------------------------------ contexts
function ctxFor(key) {
  var p = params(), sig = p.anchor + '|' + p.htfOffset;
  if (S.ctxKey !== sig) { S.ctx = {}; S.ctxKey = sig; }
  var f = FR[key];
  if (!S.base || f.ltf % S.base.resMin !== 0) return null;
  if (!S.ctx[key]) S.ctx[key] = E.prepare(S.base, f, { anchor: p.anchor, htfOffsetMin: p.htfOffset * 60, news: [] });
  var ev = newsEvents();
  S.ctx[key].newsSorted = ev.map(function (x) { return x.t; });
  return S.ctx[key];
}

// ------------------------------------------------------------------ backtest
function run() {
  if (!S.base) return;
  $('runBtn').disabled = true; $('runBtn').textContent = 'Running…';
  setTimeout(function () {
    try {
      var p = params(); S.res = {};
      Object.keys(FR).forEach(function (k) {
        if (!$('fr_' + k).checked) return;
        var ctx = ctxFor(k); if (!ctx) return;
        var r = E.simulate(ctx, p);
        r.m = E.split(r); r.mc = E.monteCarlo(r.trades, p.riskPct, 1000, 11); r.key = k;
        S.res[k] = r;
      });
      if (!S.res[S.sel]) S.sel = Object.keys(S.res)[0] || S.sel;
      S.selTrade = null;
      renderBacktest();
    } catch (e) { console.error(e); toast('Backtest failed: ' + e.message); }
    $('runBtn').disabled = false; $('runBtn').textContent = 'Run backtest';
  }, 20);
}
$('runBtn').addEventListener('click', run);

function renderBacktest() {
  var keys = Object.keys(S.res), tb = $('frTable').querySelector('tbody');
  tb.innerHTML = '';
  if (!keys.length) { tb.innerHTML = '<tr><td colspan="9" class="mut">Pick at least one fractal that your data supports.</td></tr>'; return; }
  var r0 = S.res[keys[0]];
  $('rangeTxt').textContent = fmtDay(S.base.t[0]) + ' → ' + fmtDay(S.base.t[S.base.t.length - 1]) + ' · out-of-sample from ' + fmtDay(r0.splitT);
  keys.forEach(function (k) {
    var m = S.res[k].m, tr = document.createElement('tr');
    tr.className = 'click' + (k === S.sel ? ' sel' : '');
    tr.innerHTML = '<td>' + FR[k].label + '</td><td class="n">' + m.all.n + '</td><td class="n">' + pct(m.all.winRate) + '</td><td class="n ' + sgnCls(m.all.expR) + '">' + fx(m.all.expR) + '</td><td class="n">' + fx(m.all.pf) + '</td><td class="n ' + sgnCls(m.all.net) + '">' + money(m.all.net) + '</td><td class="n">' + pct(m.all.maxDD) + '</td><td class="n ' + sgnCls(m.is.expR) + '">' + fx(m.is.expR) + ' <span class="mut">(' + m.is.n + ')</span></td><td class="n ' + sgnCls(m.oos.expR) + '">' + fx(m.oos.expR) + ' <span class="mut">(' + m.oos.n + ')</span></td>';
    tr.addEventListener('click', function () { S.sel = k; S.selTrade = null; renderBacktest(); });
    tb.appendChild(tr);
  });
  renderSelected();
}

function kpi(label, val, sub, cls) { return '<div class="kpi"><span>' + label + '</span><b class="' + (cls || '') + '">' + val + '</b>' + (sub ? '<small>' + sub + '</small>' : '') + '</div>'; }
function renderSelected() {
  var r = S.res[S.sel]; if (!r) return;
  var m = r.m, a = m.all;
  $('selTitle').textContent = FR[S.sel].label + ' · ' + { cisd: 'CISD close', retest: 'CISD retest', ic: 'IC-CISD' }[r.params.entryModel];
  $('kpis').innerHTML =
    kpi('Net return', pct(a.retPct), money(a.net), sgnCls(a.net)) +
    kpi('Win rate', pct(a.winRate), a.n + ' trades · ' + a.longs + 'L / ' + a.shorts + 'S') +
    kpi('Avg R per trade', fx(a.expR), 'win ' + fx(a.avgWinR) + 'R · loss ' + fx(a.avgLossR) + 'R', sgnCls(a.expR)) +
    kpi('Profit factor', fx(a.pf), 'payoff ' + fx(a.payoff) + ' · Sharpe ' + fx(a.sharpe, 1)) +
    kpi('Max drawdown', pct(a.maxDD), 'worst run ' + a.worstStreak + ' losses') +
    kpi('Out-of-sample', fx(m.oos.expR) + 'R', m.oos.n + ' trades · win ' + pct(m.oos.winRate), sgnCls(m.oos.expR));
  $('aiReviewBtn').hidden = !sampleFn; $('exportBtn').hidden = !downloads;
  // skipped
  var sk = r.skipped, tot = r.setups, rows = Object.keys(sk).sort(function (x, y) { return sk[y] - sk[x]; });
  var html = '<div class="tbl"><table><tbody><tr><td>C2 setups found</td><td class="n">' + tot + '</td><td style="width:40%"></td></tr><tr><td>Traded</td><td class="n">' + r.trades.length + '</td><td><div class="bar"><i style="width:' + (tot ? r.trades.length / tot * 100 : 0) + '%"></i></div></td></tr>';
  rows.forEach(function (k) { html += '<tr><td>' + esc(k) + '</td><td class="n">' + sk[k] + '</td><td><div class="bar"><i style="width:' + (sk[k] / tot * 100) + '%;background:var(--muted)"></i></div></td></tr>'; });
  $('skipList').innerHTML = html + '</tbody></table></div>';
  // exits
  var ex = {}; r.trades.forEach(function (t) { var e = ex[t.reason] || (ex[t.reason] = { n: 0, R: 0 }); e.n++; e.R += t.R; });
  html = '<div class="tbl"><table><thead><tr><th>Reason</th><th class="n">Trades</th><th class="n">Avg R</th></tr></thead><tbody>';
  Object.keys(ex).forEach(function (k) { html += '<tr><td>' + esc(k) + '</td><td class="n">' + ex[k].n + '</td><td class="n ' + sgnCls(ex[k].R) + '">' + fx(ex[k].R / ex[k].n) + '</td></tr>'; });
  $('exitList').innerHTML = html + '</tbody></table></div>';
  // monte carlo
  $('mcBox').innerHTML = r.mc ? '<div class="kpis">' + kpi('Typical max DD', pct(r.mc.p50)) + kpi('1-in-20 bad run', pct(r.mc.p95), '', 'neg') + kpi('1-in-100', pct(r.mc.p99), '', 'neg') + '</div><p class="hint">Size so the 1-in-20 drawdown fits inside your daily and overall loss limits.</p>' : '<p class="hint">Needs at least 5 trades.</p>';
  // trades table
  var tb = $('tradeTable').querySelector('tbody'); tb.innerHTML = '';
  $('tradeCount').textContent = r.trades.length + ' trades, newest first';
  r.trades.slice().reverse().forEach(function (t) {
    var tr = document.createElement('tr'); tr.className = 'click' + (S.selTrade === t ? ' sel' : '');
    tr.innerHTML = '<td>' + fmtUTC(t.entryT) + '</td><td><span class="tag ' + (t.dir > 0 ? 'long' : 'short') + '">' + (t.dir > 0 ? 'Long' : 'Short') + '</span></td><td>' + (t.oos ? 'OOS' : 'IS') + '</td><td class="n">' + fp(t.entry) + '</td><td class="n">' + fp(t.stop) + '</td><td class="n">' + fp(t.target) + '</td><td class="n">' + fp(t.exit) + '</td><td class="n ' + sgnCls(t.R) + '">' + fx(t.R) + '</td><td class="n ' + sgnCls(t.pnl) + '">' + money(t.pnl) + '</td><td>' + esc(t.reason) + '</td>';
    tr.addEventListener('click', function () { S.selTrade = t; renderSelected(); focusTrade(t); });
    tb.appendChild(tr);
  });
  drawCharts(r);
}

// ------------------------------------------------------------------ charts
var pc = null, eqc = null, candleS, vwapS, eqS, eqS2, priceLines = [], chartKey = '';
function chartOpts(h) {
  return { height: h, layout: { background: { type: 'solid', color: css('--panel') }, textColor: css('--muted'), fontFamily: 'IBM Plex Mono, monospace', fontSize: 11 },
    grid: { vertLines: { color: css('--line') }, horzLines: { color: css('--line') } }, rightPriceScale: { borderColor: css('--line') },
    timeScale: { borderColor: css('--line'), timeVisible: true, secondsVisible: false }, crosshair: { mode: 1 } };
}
function ensureCharts() {
  if (!window.LightweightCharts) { $('priceChart').innerHTML = '<p class="hint">The chart library did not load. Results and tables still work.</p>'; return false; }
  if (!pc) {
    pc = LightweightCharts.createChart($('priceChart'), chartOpts(380));
    candleS = pc.addCandlestickSeries({ upColor: css('--buy'), downColor: css('--sell'), wickUpColor: css('--buy'), wickDownColor: css('--sell'), borderVisible: false });
    vwapS = pc.addLineSeries({ color: css('--gold'), lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
    eqc = LightweightCharts.createChart($('eqChart'), chartOpts(200));
    eqS = eqc.addLineSeries({ color: css('--gold'), lineWidth: 2, priceLineVisible: false, lastValueVisible: false });
    eqS2 = eqc.addLineSeries({ color: css('--buy'), lineWidth: 2, priceLineVisible: false });
    new ResizeObserver(resizeCharts).observe($('priceChart'));
  }
  return true;
}
function resizeCharts() { if (pc) { pc.applyOptions({ width: $('priceChart').clientWidth }); eqc.applyOptions({ width: $('eqChart').clientWidth }); } }
function retheme() { if (!pc) return; [[pc, 380], [eqc, 200]].forEach(function (x) { var o = chartOpts(x[1]); delete o.height; x[0].applyOptions(o); }); candleS.applyOptions({ upColor: css('--buy'), downColor: css('--sell'), wickUpColor: css('--buy'), wickDownColor: css('--sell') }); vwapS.applyOptions({ color: css('--gold') }); eqS.applyOptions({ color: css('--gold') }); eqS2.applyOptions({ color: css('--buy') }); }
try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () { setTimeout(retheme, 50); }); new MutationObserver(function () { setTimeout(retheme, 50); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) {}

function drawCharts(r) {
  if (!ensureCharts()) return;
  var ctx = S.ctx[r.key], b = ctx.bars, key = r.key + '|' + S.base.t.length + '|' + params().levelVol + '|' + params().anchor;
  if (chartKey !== key) {
    var c = new Array(b.n), v = new Array(b.n), vw = E.vwapSeries(ctx, params().levelVol);
    for (var i = 0; i < b.n; i++) { var tt = b.t[i] / 1000; c[i] = { time: tt, open: b.o[i], high: b.h[i], low: b.l[i], close: b.c[i] }; v[i] = { time: tt, value: +vw.vwap[i].toFixed(S.digits) }; }
    candleS.setData(c); vwapS.setData(v); chartKey = key;
  }
  var mk = [];
  r.trades.forEach(function (t) {
    mk.push({ time: t.entryT / 1000, position: t.dir > 0 ? 'belowBar' : 'aboveBar', color: t.dir > 0 ? css('--buy') : css('--sell'), shape: t.dir > 0 ? 'arrowUp' : 'arrowDown', text: t.dir > 0 ? 'L' : 'S' });
    mk.push({ time: t.exitT / 1000, position: t.dir > 0 ? 'aboveBar' : 'belowBar', color: t.R > 0 ? css('--buy') : css('--muted'), shape: 'circle', text: fx(t.R, 1) + 'R' });
  });
  mk.sort(function (a, z) { return a.time - z.time; });
  candleS.setMarkers(mk);
  var isPts = [], oosPts = [], last = -Infinity;
  isPts.push({ time: Math.floor(b.t[0] / 1000), value: r.params.equity });
  r.trades.forEach(function (t) {
    var tt = Math.floor(t.exitT / 1000); if (tt <= last) tt = last + 1; last = tt;
    var pt = { time: tt, value: +t.equity.toFixed(2) };
    if (!t.oos) isPts.push(pt); else { if (!oosPts.length) oosPts.push(isPts[isPts.length - 1]); oosPts.push(pt); }
  });
  eqS.setData(isPts); eqS2.setData(oosPts);
  eqc.timeScale().fitContent();
  if (S.selTrade) focusTrade(S.selTrade); else if (r.trades.length) focusTrade(r.trades[r.trades.length - 1], true); else pc.timeScale().fitContent();
}
function focusTrade(t, quiet) {
  if (!pc) return;
  priceLines.forEach(function (pl) { candleS.removePriceLine(pl); }); priceLines = [];
  var span = (FR[S.sel].htf * 4) * 60;
  pc.timeScale().setVisibleRange({ from: t.entryT / 1000 - span, to: t.exitT / 1000 + span / 2 });
  if (quiet) return;
  priceLines.push(candleS.createPriceLine({ price: t.stop, color: css('--sell'), lineStyle: 2, lineWidth: 1, title: 'stop' }));
  priceLines.push(candleS.createPriceLine({ price: t.target, color: css('--buy'), lineStyle: 2, lineWidth: 1, title: 'target' }));
  priceLines.push(candleS.createPriceLine({ price: t.setup.level, color: css('--gold'), lineStyle: 0, lineWidth: 1, title: 'CISD' }));
  priceLines.push(candleS.createPriceLine({ price: t.setup.extreme, color: css('--muted'), lineStyle: 1, lineWidth: 1, title: 'C2 sweep' }));
}

// ------------------------------------------------------------------ export
$('exportBtn').addEventListener('click', function () {
  var r = S.res[S.sel]; if (!r || !downloads) return;
  var rows = [['entry_time_utc', 'exit_time_utc', 'side', 'sample', 'entry', 'stop', 'target', 'exit', 'risk_per_oz', 'R', 'pnl_usd', 'lots', 'equity', 'exit_reason', 'cisd_level', 'c2_extreme']];
  r.trades.forEach(function (t) { rows.push([fmtUTC(t.entryT), fmtUTC(t.exitT), t.dir > 0 ? 'long' : 'short', t.oos ? 'OOS' : 'IS', t.entry, t.stop.toFixed(2), t.target.toFixed(2), t.exit.toFixed(2), t.risk.toFixed(2), t.R.toFixed(3), t.pnl.toFixed(2), t.lots, t.equity.toFixed(2), t.reason, t.setup.level, t.setup.extreme]); });
  downloads.save({ filename: 'c2edge_trades_' + S.sel + '.csv', data: rows.map(function (r2) { return r2.join(','); }).join('\n') })
    .then(function () { toast('Saved'); }, function (e) { if (e && e.code !== 'declined') toast('Could not save the file here.'); });
});

// ------------------------------------------------------------------ workers (optimizer + delta lab)
var ENGINE_SRC = document.getElementById('engine-src').textContent;
var WORKER_SRC = ENGINE_SRC + '\n' + document.getElementById('worker-src').textContent;
var workerURL = null;
function makeWorker() {
  try { if (!workerURL) workerURL = URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' })); return new Worker(workerURL); } catch (e) { return null; }
}
function baseMsg() { var b = S.base; return { t: b.t, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v, ev: b.ev, td: b.td, resMin: b.resMin }; }
function runJob(kind, extra, progEl, statusEl, done) {
  if (!S.base) return;
  var p = params(), w = makeWorker(), msg = Object.assign({ kind: kind, base: baseMsg(), params: p, news: newsEvents().map(function (e) { return e.t; }) }, extra);
  $(progEl).hidden = false; $(progEl).firstChild.style.width = '0%';
  if (!w) { $(statusEl).textContent = 'Background workers are blocked here; running in the page (it may pause briefly).'; setTimeout(function () { var res = WORKER_RUN(msg, function (f) { }); $(progEl).hidden = true; done(res); }, 30); return; }
  $(statusEl).textContent = 'Working…';
  w.onmessage = function (e) {
    if (e.data.progress !== undefined) { $(progEl).firstChild.style.width = (e.data.progress * 100).toFixed(0) + '%'; $(statusEl).textContent = e.data.note || ''; return; }
    w.terminate(); $(progEl).hidden = true;
    if (e.data.error) { $(statusEl).textContent = 'Failed: ' + e.data.error; return; }
    done(e.data.result);
  };
  w.onerror = function (e) { w.terminate(); $(progEl).hidden = true; $(statusEl).textContent = 'Failed: ' + (e.message || 'worker error'); };
  w.postMessage(msg);
}
// in-page fallback uses the same function the worker runs
var WORKER_RUN = null;
try { WORKER_RUN = new Function('ENGINE', document.getElementById('worker-src').textContent + '\nreturn job;')(E); } catch (e) {}

var LABEL = {
  entryModel: { cisd: 'CISD close', retest: 'Retest', ic: 'IC-CISD' }, vwapMode: { off: 'Off', trend: 'Trend', discount: '±1σ value' },
  frvpMode: { off: 'Off', level: 'At level', value: 'Vs POC' }, deltaMode: { off: 'Off', disp: 'Displacement', div: 'Divergence' }
};
function tgtLabel(p) { return p.targetMode === 'rr' ? p.rr + 'R' : p.targetMode === 'sd' ? p.sd + ' SD' : 'C2/C1 liquidity'; }

$('optRun').addEventListener('click', function () {
  var k = $('optFr').value;
  if (!S.base || FR[k].ltf % S.base.resMin !== 0) { $('optStatus').textContent = 'Your data does not support this fractal.'; return; }
  $('optRun').disabled = true;
  runJob('optimize', { fractal: FR[k], objective: $('optObj').value, minTrades: +$('optMin').value || 15 }, 'optProg', 'optStatus', function (res) {
    $('optRun').disabled = false;
    S.opt = res; renderOpt(k);
  });
});
function renderOpt(k) {
  var res = S.opt, tb = $('optTable').querySelector('tbody'); tb.innerHTML = '';
  $('optResCard').hidden = false;
  var top = res.top, posOOS = top.filter(function (x) { return x.oos.expR > 0 && x.oos.n >= 5; }).length;
  $('optStatus').textContent = res.tested + ' combinations tested on ' + FR[k].label + (S.synthetic ? ' (synthetic data).' : '.');
  $('optSummary').textContent = posOOS + ' of the top ' + top.length + ' stayed profitable out-of-sample' + (top.length ? '; walk-forward efficiency of #1: ' + (top[0].is.expR > 0 ? fx(top[0].oos.expR / top[0].is.expR) : '–') : '');
  if (!top.length) { tb.innerHTML = '<tr><td colspan="14" class="mut">No combination had enough in-sample trades. Lower the minimum or load more data.</td></tr>'; return; }
  top.forEach(function (x, i) {
    var p = x.p, tr = document.createElement('tr');
    tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + LABEL.entryModel[p.entryModel] + '</td><td>' + tgtLabel(p) + '</td><td>' + LABEL.vwapMode[p.vwapMode] + '</td><td>' + LABEL.frvpMode[p.frvpMode] + '</td><td>' + LABEL.deltaMode[p.deltaMode] + '</td><td class="n">' + p.bufferATR + '</td>' +
      '<td class="n">' + x.is.n + '</td><td class="n">' + pct(x.is.winRate, 0) + '</td><td class="n ' + sgnCls(x.is.expR) + '">' + fx(x.is.expR) + '</td>' +
      '<td class="n">' + x.oos.n + '</td><td class="n">' + pct(x.oos.winRate, 0) + '</td><td class="n ' + sgnCls(x.oos.expR) + '">' + fx(x.oos.expR) + '</td><td><button class="btn" data-i="' + i + '">Apply</button></td>';
    tr.querySelector('button').addEventListener('click', function () {
      var q = Object.assign({}, p); delete q.sd; applyParams(q);
      if (p.targetMode === 'sd') $('rr').value = p.sd;
      Object.keys(FR).forEach(function (kk) { $('fr_' + kk).checked = kk === k || $('fr_' + kk).checked; });
      S.sel = k; store('c2edge.params', params()); run(); showTab('backtest'); toast('Settings applied to the backtest');
    });
    tb.appendChild(tr);
  });
}

$('dlRun').addEventListener('click', function () {
  var k = $('dlFr').value;
  if (!S.base || FR[k].ltf % S.base.resMin !== 0) { $('dlStatus').textContent = 'Your data does not support this fractal.'; return; }
  $('dlRun').disabled = true;
  runJob('delta', { fractal: FR[k] }, 'dlProg', 'dlStatus', function (res) { $('dlRun').disabled = false; S.dl = res; renderDelta(k); });
});
var DNAME = {}; E.DELTA_SOURCES.forEach(function (d) { DNAME[d.id] = d.name; });
var VNAME = { broker: 'Broker', futures: 'Futures (GC)', unit: 'None (sign only)' };
function renderDelta(k) {
  var res = S.dl, tb = $('dlTable').querySelector('tbody'); tb.innerHTML = '';
  $('dlResCard').hidden = false;
  $('dlStatus').textContent = res.rows.length + ' delta variants tested on ' + FR[k].label + (S.synthetic ? ' (synthetic data, so expect noise).' : '.') + ' Baseline without a delta filter: IS ' + fx(res.base.is.expR) + 'R over ' + res.base.is.n + ' trades, OOS ' + fx(res.base.oos.expR) + 'R over ' + res.base.oos.n + '.';
  var ranked = res.rows.filter(function (x) { return x.is.n >= 10; }).sort(function (a, z) { return z.is.expR - a.is.expR; });
  var best = ranked[0];
  $('dlBest').textContent = best ? 'Best in-sample: ' + DNAME[best.kind] + ' · ' + VNAME[best.vol] + ' · ' + LABEL.deltaMode[best.mode] + ' → OOS ' + fx(best.oos.expR) + 'R' : 'Not enough trades to rank.';
  res.rows.sort(function (a, z) { return z.is.expR - a.is.expR; }).forEach(function (x) {
    var q = res.quality.find(function (y) { return y.kind === x.kind && y.vol === x.vol; }) || {};
    var lift = x.oos.expR - res.base.oos.expR, tr = document.createElement('tr');
    if (x === best) tr.className = 'sel';
    tr.innerHTML = '<td>' + DNAME[x.kind] + '</td><td>' + VNAME[x.vol] + '</td><td class="n ' + (q.hitRate > 0.52 ? 'pos' : q.hitRate < 0.48 ? 'neg' : '') + '">' + pct(q.hitRate) + '</td><td class="n">' + fx(q.corr, 3) + '</td><td>' + LABEL.deltaMode[x.mode] + '</td>' +
      '<td class="n">' + x.is.n + '</td><td class="n ' + sgnCls(x.is.expR) + '">' + fx(x.is.expR) + '</td><td class="n">' + x.oos.n + '</td><td class="n ' + sgnCls(x.oos.expR) + '">' + fx(x.oos.expR) + '</td><td class="n ' + sgnCls(lift) + '">' + (lift >= 0 ? '+' : '') + fx(lift) + 'R</td><td><button class="btn">Use</button></td>';
    tr.querySelector('button').addEventListener('click', function () { $('deltaSrc').value = x.kind; $('deltaVol').value = x.vol; $('deltaMode').value = x.mode; S.sel = k; store('c2edge.params', params()); run(); showTab('backtest'); toast('Delta filter applied'); });
    tb.appendChild(tr);
  });
}

// ------------------------------------------------------------------ news
$('ffLoad').addEventListener('click', function () { loadFF($('ffText').value); });
$('ffFile').addEventListener('change', function (e) { var f = e.target.files[0]; if (f) readFile(f, function (t) { $('ffText').value = t.slice(0, 200000); loadFF(t); }); });
function loadFF(text) {
  var ev = E.parseFF(text || '');
  if (!ev.length) { $('ffStatus').textContent = 'No events found. Paste the full JSON from the feed link.'; return; }
  S.ff = ev; store('c2edge.ff', { text: text.slice(0, 200000), at: Date.now() });
  var usd = ev.filter(function (x) { return x.currency === 'USD'; }).length;
  $('ffStatus').textContent = ev.length + ' events loaded, ' + usd + ' USD.';
  renderNews();
}
(function () { var saved = load('c2edge.ff'); if (saved && saved.text && Date.now() - saved.at < 8 * E.DAY) { S.ff = E.parseFF(saved.text); $('ffText').value = saved.text; $('ffStatus').textContent = S.ff.length + ' events from your last paste.'; } })();

function studies() {
  if (S.studies) return S.studies;
  if (!S.base) return null;
  var bars = E.resample(S.base, S.base.resMin), ctx = { bars: bars, ltfMin: S.base.resMin };
  var past = E.marketNews(currencies(), calendarAll()).concat(E.weeklyClaims(S.base.t[0], S.base.t[S.base.t.length - 1])).filter(function (e) { return e.t >= S.base.t[0] && e.t <= S.base.t[S.base.t.length - 1]; });
  var rows = E.eventStudy(ctx, past), byType = {};
  rows.forEach(function (r) { (byType[r.type] = byType[r.type] || []).push(r); });
  S.studies = { rows: rows, byType: byType };
  return S.studies;
}
function typeOf(title) {
  var s = String(title).toLowerCase();
  if (/non-farm|nonfarm|payroll/.test(s)) return 'NFP';
  if (/cpi/.test(s)) return 'CPI'; if (/ppi/.test(s)) return 'PPI';
  if (/fomc.*minutes/.test(s)) return 'FOMC Minutes';
  if (/fomc|federal funds|fed chair|powell|statement|press conference/.test(s)) return 'FOMC';
  if (/pce|gdp/.test(s)) return 'GDP/PCE'; if (/retail/.test(s)) return 'Retail Sales'; if (/jolts/.test(s)) return 'JOLTS';
  if (/claims/.test(s)) return 'Claims'; if (/employment cost|eci/.test(s)) return 'ECI';
  return title;
}
function upcoming() {
  var now = Date.now(), cal = calendarAll(), cur = currencies();
  var src = cal.length ? cal.filter(function (x) { return cur.indexOf(x.currency) >= 0 && /high|medium/i.test(x.impact || ''); }) : E.USD_HIGH_IMPACT;
  return src.filter(function (x) { return x.t >= now - 3 * 3600e3 && x.t <= now + 10 * E.DAY; }).sort(function (a, b) { return a.t - b.t; });
}
function renderNews() {
  var st = studies(), tb = $('esTable').querySelector('tbody'); tb.innerHTML = '';
  if (st) {
    Object.keys(st.byType).sort(function (a, b) { return median(st.byType[b].map(function (r) { return r.range60; })) - median(st.byType[a].map(function (r) { return r.range60; })); }).forEach(function (k) {
      var r = st.byType[k], up = r.filter(function (x) { return x.m60 > 0; }).length;
      var tr = document.createElement('tr');
      tr.innerHTML = '<td>' + esc(k) + '</td><td class="n">' + r.length + '</td><td class="n">' + fp(median(r.map(function (x) { return Math.abs(x.m15); }))) + '</td><td class="n">' + fp(median(r.map(function (x) { return Math.abs(x.m60); }))) + '</td><td class="n">' + fp(median(r.map(function (x) { return x.range60; }))) + '</td><td class="n">' + fp(Math.max.apply(null, r.map(function (x) { return x.range60; }))) + '</td><td class="n">' + up + ' / ' + r.length + '</td>';
      tb.appendChild(tr);
    });
    if (!st.rows.length) tb.innerHTML = '<tr><td colspan="7" class="mut">None of the built-in releases fall inside your data range.</td></tr>';
  }
  var ub = $('upTable').querySelector('tbody'); ub.innerHTML = '';
  var list = upcoming(), now = Date.now();
  var pc = S.pipe && S.pipe.calendar && S.pipe.calendar.length;
  $('upHint').textContent = (pc ? 'Forex Factory via GitHub, updated ' + ago(S.pipe.calUpdated) : S.ff.length ? 'From your Forex Factory paste' : 'Built-in USD schedule. Paste the Forex Factory feed for forecasts and the full week.') + ' · ' + currencies().join(', ') + ' high and medium impact';
  if (!list.length) { ub.innerHTML = '<tr><td colspan="10" class="mut">No USD events in the next 10 days in the loaded calendar.</td></tr>'; return; }
  list.forEach(function (x) {
    var ty = typeOf(x.title), past = st && st.byType[ty], rng = past ? fp(median(past.map(function (r) { return r.range60; }))) + ' <span class="mut">(' + past.length + ')</span>' : '<span class="mut">no history</span>';
    var sign = E.usdSurpriseSign(x.title), dt = x.t - now, inTxt = dt < 0 ? 'released' : dt < 3600e3 ? Math.round(dt / 60000) + ' min' : dt < E.DAY ? (dt / 3600e3).toFixed(1) + ' h' : (dt / E.DAY).toFixed(1) + ' d';
    var mkt = (S.market && S.market.id) || 'XAUUSD', isGold = /XAU|PAXG/.test(mkt), base3 = mkt.slice(0, 3);
    var up = isGold ? (x.currency === 'USD' ? -sign : 0) : (x.currency === 'USD' ? -sign : (x.currency === base3 ? sign : 0));
    var beat = !sign ? 'Read the tone; no single number' : up > 0 ? mkt + ' usually up' : up < 0 ? mkt + ' usually down' : 'Indirect for ' + mkt;
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + new Date(x.t).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) + '</td><td>' + inTxt + '</td><td>' + esc(x.title) + '</td><td><span class="tag ' + (/high/i.test(x.impact) ? 'hi' : 'md') + '">' + esc(x.impact || 'High') + '</span></td><td class="n">' + esc(x.forecast || '–') + '</td><td class="n">' + esc(x.previous || '–') + '</td><td class="n">' + rng + '</td><td>' + beat + '</td><td><input type="text" aria-label="Actual for ' + esc(x.title) + '" style="width:80px;padding:4px 6px;border:1px solid var(--line);border-radius:5px;background:var(--bg)" value="' + esc(x.actual || '') + '"></td><td class="bias mut">–</td>';
    var inp = tr.querySelector('input'), out = tr.querySelector('.bias');
    function upd() {
      var a = parseFloat(String(inp.value).replace(/[^0-9.\-]/g, '')), f = parseFloat(String(x.forecast || '').replace(/[^0-9.\-]/g, ''));
      if (!isFinite(a) || !isFinite(f) || !up) { out.textContent = '–'; out.className = 'bias mut'; return; }
      var s = Math.sign(a - f) * up;
      out.textContent = a === f ? 'In line: fade the spike' : s > 0 ? 'Bullish ' + mkt : s < 0 ? 'Bearish ' + mkt : 'No clear read';
      out.className = 'bias ' + (s > 0 ? 'pos' : s < 0 ? 'neg' : 'mut');
    }
    inp.addEventListener('input', upd); upd();
    ub.appendChild(tr);
  });
}

// ------------------------------------------------------------------ AI (sample capability)
function mdToHtml(md) {
  var lines = esc(md).split('\n'), out = [], inList = false;
  lines.forEach(function (l) {
    var t = l.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    if (/^\s*#{1,4}\s+/.test(t)) { if (inList) { out.push('</ul>'); inList = false; } out.push('<h4>' + t.replace(/^\s*#{1,4}\s+/, '') + '</h4>'); }
    else if (/^\s*[-*•]\s+/.test(t)) { if (!inList) { out.push('<ul>'); inList = true; } out.push('<li>' + t.replace(/^\s*[-*•]\s+/, '') + '</li>'); }
    else if (t.trim()) { if (inList) { out.push('</ul>'); inList = false; } out.push('<p>' + t + '</p>'); }
  });
  if (inList) out.push('</ul>');
  return out.join('');
}
var ERR = { not_granted: 'Claude access was not allowed for this page.', rate_limited: 'Too many requests right now. Try again in a minute.', sampling_disabled: 'Claude is not available for this account here.', refused: 'Claude declined this request.', session_expired: 'Sign in again to use Claude.' };
function ask(prompt, outEl, stopBtn, btn) {
  if (!sampleFn) return;
  var ctl = new AbortController();
  $(outEl).innerHTML = '<p class="mut">Thinking…</p>'; $(btn).disabled = true; $(stopBtn).hidden = false;
  $(stopBtn).onclick = function () { ctl.abort(); };
  sampleFn(prompt, { signal: ctl.signal, onText: function (u) { $(outEl).innerHTML = mdToHtml(u.text); }, cache: false })
    .then(function (r) { $(outEl).innerHTML = mdToHtml(r.text) + (r.truncated ? '<p class="mut">The answer was cut short.</p>' : ''); },
      function (e) { if (e.text) $(outEl).innerHTML = mdToHtml(e.text); else $(outEl).innerHTML = ''; if (e.code !== 'cancelled') $(outEl).insertAdjacentHTML('beforeend', '<p class="neg">' + (ERR[e.code] || 'Claude could not answer just now. Try again.') + '</p>'); if (e.code === 'not_granted' || e.code === 'sampling_disabled') { $('aiNewsBtn').hidden = true; $('aiReviewBtn').hidden = true; } })
    .then(function () { $(btn).disabled = false; $(stopBtn).hidden = true; });
}
function resultsDigest() {
  var lines = [];
  Object.keys(S.res).forEach(function (k) {
    var r = S.res[k], m = r.m;
    lines.push(FR[k].label + ': trades ' + m.all.n + ', win ' + pct(m.all.winRate) + ', avgR ' + fx(m.all.expR) + ', PF ' + fx(m.all.pf) + ', net ' + pct(m.all.retPct) + ', maxDD ' + pct(m.all.maxDD) +
      ' | IS n=' + m.is.n + ' avgR ' + fx(m.is.expR) + ' | OOS n=' + m.oos.n + ' avgR ' + fx(m.oos.expR) + ' win ' + pct(m.oos.winRate) +
      ' | MC DD p95 ' + (r.mc ? pct(r.mc.p95) : 'n/a') + ' | skipped: ' + JSON.stringify(r.skipped));
    var ex = {}; r.trades.forEach(function (t) { ex[t.reason] = (ex[t.reason] || 0) + 1; }); lines.push('  exits: ' + JSON.stringify(ex));
  });
  return lines.join('\n');
}
$('aiReviewBtn').addEventListener('click', function () {
  $('aiReviewCard').hidden = false;
  var p = params();
  var prompt = 'You are the head of risk at a proprietary trading firm reviewing a systematic ' + ((S.market && S.market.id) || 'XAUUSD') + ' strategy before it gets capital. Be direct and specific; no generic disclaimers.\n\n' +
    'Strategy: ICT-style fractal model. A higher-timeframe candle (C2) sweeps the prior candle\'s high/low and closes back inside; entry after a lower-timeframe CISD (close through the open of the last opposing run), optionally on retest or on an IC-CISD protected swing. Stop beyond the C2 sweep; filters: session VWAP, prior-session volume profile (FRVP), estimated delta, high-impact USD news blackout. Costs are included.\n\n' +
    'Data: ' + (S.synthetic ? 'SYNTHETIC random-walk demo data (state clearly that these results carry no information about the real strategy)' : S.name + ', ' + S.base.resMin + '-minute bars, ' + fmtDay(S.base.t[0]) + ' to ' + fmtDay(S.base.t[S.base.t.length - 1]) + ', volume ' + (S.base.notes.hasVolume ? 'present' : 'absent') + ', futures volume ' + (S.base.ev ? 'loaded' : 'not loaded')) + '.\n' +
    'Settings: ' + JSON.stringify(p) + '\n\nResults (IS = in-sample first ' + pct(p.isFrac, 0) + ', OOS = remainder):\n' + resultsDigest() + '\n' +
    (S.opt ? '\nOptimizer top 5 (IS vs OOS avgR): ' + S.opt.top.slice(0, 5).map(function (x) { return fx(x.is.expR) + '→' + fx(x.oos.expR) + ' (n ' + x.is.n + '/' + x.oos.n + ')'; }).join('; ') + '\n' : '') +
    '\nWrite these sections with short headings: Verdict (one paragraph: deployable, paper-trade, or reject, and why); Statistical confidence (is the sample big enough, IS vs OOS decay, what the win rate and payoff imply); Biggest risks (costs, regime, news, overfitting, execution); What to test next (3-5 concrete experiments using the settings above); Position sizing (risk per trade that keeps the 95th-percentile drawdown under 10%). Under 450 words.';
  ask(prompt, 'aiReviewOut', 'aiReviewStop', 'aiReviewBtn');
});
$('aiNewsBtn').addEventListener('click', function () {
  var st = studies(), list = upcoming().slice(0, 25);
  var hist = st ? Object.keys(st.byType).map(function (k) { var r = st.byType[k]; return k + ': n=' + r.length + ', median 60m range $' + fx(median(r.map(function (x) { return x.range60; }))) + ', median |60m| $' + fx(median(r.map(function (x) { return Math.abs(x.m60); }))) + ', up after 60m ' + r.filter(function (x) { return x.m60 > 0; }).length + '/' + r.length; }).join('\n') : 'none';
  var ev = list.map(function (x) { return fmtUTC(x.t) + ' UTC | ' + x.title + ' | ' + (x.impact || '') + ' | forecast ' + (x.forecast || 'n/a') + ' | previous ' + (x.previous || 'n/a') + (x.actual ? ' | actual ' + x.actual : ''); }).join('\n');
  var last = S.base ? S.base.c[S.base.c.length - 1] : NaN;
  var mk = (S.market && S.market.id) || 'XAUUSD';
  var prompt = 'You are a macro strategist on an institutional FX and gold desk. Today is ' + new Date().toUTCString() + '. Write a news brief for an intraday trader who trades ' + mk + ' with a liquidity-sweep + CISD model on 5m-1H.\n\n' +
    'Upcoming ' + currencies().join('/') + ' events (Forex Factory calendar' + (calendarAll().length ? '' : '; none loaded, so this is a built-in USD schedule without forecasts') + '):\n' + (ev || 'none in the next 10 days') + '\n\n' +
    'How ' + mk + ' reacted to the same release types in the trader\'s own data (' + (S.synthetic ? 'SYNTHETIC demo data, treat as placeholder' : 'last ~90 days') + '):\n' + hist + '\n' + (isFinite(last) ? 'Last price in data: ' + fx(last) + '\n' : '') +
    '\nFor each event that matters, give: what the market is looking for, the beat / in-line / miss scenarios and the likely first reaction in ' + mk + ' (via the currencies involved and real yields), the expected 60-minute range using the data above, and a trading rule (stand aside window, whether to fade or follow the first spike, which liquidity is likely to be swept). Then a 3-line plan for the week. Do not predict the actual numbers; say plainly that the direction depends on the print. Use short headings and bullets. Under 500 words.';
  ask(prompt, 'aiNewsOut', 'aiNewsStop', 'aiNewsBtn');
});


// ------------------------------------------------------------------ GitHub pipeline (data/ folder next to the page)
function ago(t) { if (!t) return 'unknown'; var m = (Date.now() - t) / 60000; return m < 90 ? Math.round(m) + ' min ago' : m < 48 * 60 ? Math.round(m / 60) + ' h ago' : Math.round(m / 1440) + ' days ago'; }
function getJSON(path) { return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }); }
function gunzipJSON(path) {
  return fetch(path, { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); }).then(function (buf) {
    var u = new Uint8Array(buf);
    if (u[0] === 0x1f && u[1] === 0x8b) {
      if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot unzip data files. Update it.');
      return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).text().then(JSON.parse);
    }
    return JSON.parse(new TextDecoder().decode(u)); // server already decompressed it
  });
}
function loadPipeline() {
  return getJSON('data/markets.json').then(function (man) {
    if (!man.markets || !man.markets.length) throw new Error('empty');
    S.pipe = { manifest: man, calendar: [], calUpdated: 0, results: null, brief: null, status: null };
    var jobs = [
      getJSON('data/news/calendar.json').then(function (c) { S.pipe.calendar = c.events || []; S.pipe.calUpdated = c.updatedAt; }, function () {}),
      getJSON('data/results/results.json').then(function (r) { S.pipe.results = r; }, function () {}),
      getJSON('data/news/brief.json').then(function (b) { S.pipe.brief = b; }, function () {}),
      getJSON('data/status.json').then(function (st) { S.pipe.status = st; }, function () {})
    ];
    return Promise.all(jobs).then(function () { return S.pipe; });
  });
}
function markStrip() {
  document.querySelectorAll('#marketStrip button').forEach(function (b) { b.setAttribute('aria-pressed', S.market && b.dataset.id === S.market.id ? 'true' : 'false'); });
}
function renderStrip() {
  var strip = $('marketStrip'); strip.innerHTML = '';
  S.pipe.manifest.markets.forEach(function (m) {
    var b = document.createElement('button'); b.type = 'button'; b.dataset.id = m.id;
    b.innerHTML = esc(m.id) + '<small>' + esc(m.trueDelta ? 'real delta' : m.external ? 'ext. volume' : m.source) + '</small>';
    b.addEventListener('click', function () { selectMarket(m.id); });
    strip.appendChild(b);
  });
  markStrip();
}
function histText() {
  var m = S.market; if (!m) return;
  var parts = ['Market: <b>' + esc(m.id) + '</b> (' + esc(m.name) + '). Runs the engine on this market\'s past 1-minute bars, rebuilt into 1, 5 and 15-minute entries against 15-minute, 1-hour and 4-hour candles, using your settings and costs.'];
  if (m.trueDelta) parts.push('This market has real buyer and seller (taker) volume from Binance, so the true delta source is measured, not estimated.');
  else if (m.external) parts.push('Volume and delta can come from ' + esc(m.external.label) + ', matched on ' + pct(m.external.coverage, 0) + ' of bars.');
  else parts.push('This feed has tick volume only, so delta here is an estimate.');
  parts.push('Order-book data is left out because free sources keep no history of it.');
  parts.push('Data: ' + fmtDay(m.from) + ' → ' + fmtDay(m.to) + ' UTC, refreshed by GitHub ' + ago(S.pipe.manifest.generatedAt) + '. Pick another market above to test it.');
  $('histText').innerHTML = parts.join(' ');
}
function selectMarket(id) {
  var m = S.pipe.manifest.markets.find(function (x) { return x.id === id; }); if (!m) return;
  S.market = m; S.digits = m.digits || 2; markStrip(); histText();
  var c = m.costs || {};
  ['spread', 'commPerLot', 'slippage', 'contractSize', 'feeBps'].forEach(function (k) { if (c[k] !== undefined) $(k).value = c[k]; });
  $('levelVol').value = m.external ? 'futures' : 'broker';
  $('deltaVol').value = m.external ? 'futures' : 'broker';
  $('deltaSrc').value = m.trueDelta || m.external ? 'true' : 'clv';
  try { localStorage.setItem('c2edge.market', id); } catch (e) {}
  S.full = null; renderGH(); renderDeep(); runHistory();
}
function runHistory() {
  var m = S.market; if (!m) return;
  var days = +$('period').value || 90;
  $('histRun').disabled = true; $('histStatus').textContent = 'Loading ' + m.id + '…';
  var p = S.full && S.full.id === m.id ? Promise.resolve(S.full) : gunzipJSON('data/' + m.file).then(function (raw) { var b = E.unpackMarket(raw); b.id = m.id; S.full = b; return b; });
  p.then(function (full) {
    var b = E.lastDays(full, days);
    $('histStatus').textContent = b.t.length.toLocaleString() + ' bars · ' + days + ' days';
    setBase(b, m.id + ' · ' + days + 'd', false);
  }).catch(function (e) { $('histStatus').textContent = 'Could not load ' + m.id + ': ' + e.message; })
    .then(function () { $('histRun').disabled = false; });
}
$('histRun').addEventListener('click', runHistory);
$('period').addEventListener('change', runHistory);
function renderGH() {
  var res = S.pipe && S.pipe.results, m = S.market;
  var mr = res && m && res.markets[m.id];
  $('ghCard').hidden = !mr;
  if (!mr) return;
  $('ghWhen').textContent = (res.fixture ? 'FIXTURE DATA · ' : '') + 'ran ' + ago(res.generatedAt);
  var tb = $('ghTable').querySelector('tbody'); tb.innerHTML = '';
  Object.keys(mr.fractals).forEach(function (k) {
    var f = mr.fractals[k], b = f.optimizer.top[0], tr = document.createElement('tr');
    var best = b ? LABEL.entryModel[b.p.entryModel] + ' · ' + tgtLabel(b.p) + ' · VWAP ' + LABEL.vwapMode[b.p.vwapMode] + ' · FRVP ' + LABEL.frvpMode[b.p.frvpMode] + ' · delta ' + LABEL.deltaMode[b.p.deltaMode] + ': <span class="' + sgnCls(b.is.expR) + '">' + fx(b.is.expR) + '</span> → <span class="' + sgnCls(b.oos.expR) + '">' + fx(b.oos.expR) + '</span>' : '<span class="mut">too few trades</span>';
    tr.innerHTML = '<td>' + FR[k].label + '</td><td class="n">' + f.all.n + '</td><td class="n">' + pct(f.all.winRate) + '</td><td class="n ' + sgnCls(f.all.expR) + '">' + fx(f.all.expR) + '</td><td class="n">' + (f.all.pf == null ? '∞' : fx(f.all.pf)) + '</td><td class="n ' + sgnCls(f.all.retPct) + '">' + pct(f.all.retPct) + '</td><td class="n">' + pct(f.all.maxDD) + '</td><td class="n ' + sgnCls(f.oos.expR) + '">' + fx(f.oos.expR) + ' <span class="mut">(' + f.oos.n + ')</span></td><td style="white-space:normal;min-width:260px">' + best + '</td><td class="n">' + f.optimizer.robustCount + '/' + f.optimizer.top.length + '</td>';
    tb.appendChild(tr);
  });
}
var ddSel = null;
function renderDeep() {
  var res = S.pipe && S.pipe.results, m = S.market, mr = res && m && res.markets[m.id];
  var keys = mr ? Object.keys(mr.fractals).filter(function (k) { return mr.fractals[k].research; }) : [];
  $('ddCard').hidden = !keys.length;
  if (!keys.length) return;
  if (keys.indexOf(ddSel) < 0) ddSel = keys[0];
  var strip = $('ddFr'); strip.innerHTML = '';
  keys.forEach(function (k) {
    var b = document.createElement('button'); b.type = 'button'; b.textContent = FR[k].label; b.setAttribute('aria-pressed', k === ddSel ? 'true' : 'false');
    b.addEventListener('click', function () { ddSel = k; renderDeep(); }); strip.appendChild(b);
  });
  var R = mr.fractals[ddSel].research, w = R.walkForward, o = w.oos;
  var row = function (cells) { return '<tr>' + cells.join('') + '</tr>'; }, n = function (x, cls) { return '<td class="n ' + (cls || '') + '">' + x + '</td>'; };
  var rr = function (x) { return n(fx(x), sgnCls(x)); };
  var h = '<div class="kpis" style="margin:10px 0 14px">' + kpi('Walk-forward trades', o.n, R.spanDays + ' days · ' + w.folds.length + ' windows') + kpi('Win rate', pct(o.winRate)) +
    kpi('Avg R per trade', fx(o.expR), 'total ' + fx(o.totalR) + 'R', sgnCls(o.expR)) + kpi('Profit factor', o.pf == null ? '∞' : fx(o.pf)) + kpi('Max drawdown', fx(o.maxDDR) + 'R') + '</div>';
  h += '<h3 style="margin:6px 0">Each window</h3><div class="tbl"><table><thead><tr><th>Train</th><th>Test until</th><th>Setting picked</th><th class="n">Train R (n)</th><th class="n">Test R (n)</th></tr></thead><tbody>';
  w.folds.forEach(function (f) {
    h += f.pick ? row(['<td>' + fmtDay(f.from) + ' → ' + fmtDay(f.split) + '</td>', '<td>' + fmtDay(f.to) + '</td>', '<td style="white-space:normal">' + esc(f.pick) + '</td>', n(fx(f.is.expR) + ' (' + f.is.n + ')'), n(fx(f.oos.expR) + ' (' + f.oos.n + ')', sgnCls(f.oos.expR))])
      : row(['<td>' + fmtDay(f.from) + ' → ' + fmtDay(f.split) + '</td>', '<td>' + fmtDay(f.to) + '</td>', '<td class="mut" colspan="3">Not enough trades to pick a setting</td>']);
  });
  h += '</tbody></table></div>';
  h += '<h3 style="margin:16px 0 6px">Most consistent settings</h3><p class="hint">Positive in the most test windows. Chosen with hindsight: candidates to confirm on new data, not proof.</p><div class="tbl"><table><thead><tr><th>Setting</th><th class="n">Positive windows</th><th class="n">Trades</th><th class="n">Win</th><th class="n">Avg R</th></tr></thead><tbody>';
  R.consistent.forEach(function (c) { h += row(['<td style="white-space:normal">' + esc(c.setting) + '</td>', n(c.positive + '/' + c.windows), n(c.all.n), n(pct(c.all.winRate)), rr(c.all.expR)]); });
  h += '</tbody></table></div><div class="grid2" style="margin-top:16px"><div><h3 style="margin-bottom:6px">By session (default settings, all hours)</h3><div class="tbl"><table><thead><tr><th>Session UTC</th><th class="n">Trades</th><th class="n">Win</th><th class="n">Avg R</th></tr></thead><tbody>';
  Object.keys(R.bySession).forEach(function (k) { var v = R.bySession[k]; h += row(['<td>' + esc(k) + '</td>', n(v.n), n(pct(v.winRate)), rr(v.expR)]); });
  h += '</tbody></table></div></div><div><h3 style="margin-bottom:6px">News blackout and costs</h3><div class="tbl"><table><thead><tr><th class="n">Blackout ±min</th><th class="n">Avg R</th><th class="n">Costs ×</th><th class="n">Avg R</th></tr></thead><tbody>';
  for (var i = 0; i < R.newsWindows.length; i++) h += row([n(R.newsWindows[i].minutes), rr(R.newsWindows[i].expR), n(R.costs[i].multiple), rr(R.costs[i].expR)]);
  h += '</tbody></table></div></div></div><h3 style="margin:16px 0 6px">Entry × target</h3><div class="tbl"><table><thead><tr><th>Entry</th><th>Target</th><th class="n">Trades</th><th class="n">Win</th><th class="n">Avg R</th><th class="n">In-sample R</th><th class="n">Out-of-sample R</th></tr></thead><tbody>';
  R.entryTarget.forEach(function (e) { h += row(['<td>' + LABEL.entryModel[e.entry] + '</td>', '<td>' + e.target + '</td>', n(e.all.n), n(pct(e.all.winRate)), rr(e.all.expR), rr(e.is.expR), rr(e.oos.expR)]); });
  h += '</tbody></table></div>';
  $('ddBody').innerHTML = h;
}
function renderPipe() {
  var man = S.pipe.manifest, tb = $('pipeTable').querySelector('tbody'); tb.innerHTML = '';
  $('pipeCard').hidden = false;
  man.markets.forEach(function (m) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + esc(m.id) + '</td><td>' + esc(m.source) + ' ' + esc(m.symbol) + '</td><td class="n">' + (m.bars || 0).toLocaleString() + '</td><td>' + fmtDay(m.from) + ' → ' + fmtDay(m.to) + '</td><td>' + (m.trueDelta ? 'Yes' : 'No') + '</td><td>' + (m.external ? esc(m.external.label) + ' · ' + pct(m.external.coverage, 0) : '–') + '</td>';
    tb.appendChild(tr);
  });
  var st = S.pipe.status || {}, failed = Object.keys(st.markets || {}).filter(function (k) { return !st.markets[k].ok; });
  $('pipeNote').textContent = (man.fixture ? 'FIXTURE DATA for testing. ' : '') + 'Built by GitHub Actions ' + ago(man.generatedAt) + '.' + (failed.length ? ' Failed this run: ' + failed.map(function (k) { return k + ' (' + st.markets[k].error + ')'; }).join('; ') + '.' : '') + (st.news && st.news.errors && st.news.errors.length ? ' News errors: ' + st.news.errors.join('; ') : '');
}
function renderBrief() {
  var br = S.pipe && S.pipe.brief;
  if (!br) return;
  $('ghBrief').hidden = false;
  $('ghBriefWhen').textContent = 'Written by Claude (' + br.model + ') on GitHub ' + ago(br.generatedAt) + ' from ' + br.events + ' upcoming events.';
  $('ghBriefOut').innerHTML = mdToHtml(br.text);
}
$('ffRefresh').addEventListener('click', function () {
  $('ffLiveStatus').textContent = 'Trying Forex Factory directly…';
  fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (t) { loadFF(t); $('ffLiveStatus').textContent = 'Live feed loaded.'; })
    .catch(function () {
      getJSON('data/news/calendar.json').then(function (c) { S.pipe.calendar = c.events || []; S.pipe.calUpdated = c.updatedAt; S.studies = null; renderNews(); $('ffLiveStatus').textContent = 'The browser blocked the direct call; using the GitHub copy from ' + ago(c.updatedAt) + '.'; },
        function () { $('ffLiveStatus').textContent = 'Could not refresh. Paste the feed instead.'; });
    });
});
// ------------------------------------------------------------------ boot
function boot() {
  var h = (location.hash || '').replace('#', '');
  loadPipeline().then(function () {
    $('histCard').hidden = false; $('ffLiveRow').hidden = false;
    $('ffIntro').textContent = 'GitHub pulls the Forex Factory calendar several times a day and keeps a history. Paste the feed here only if you want something newer.';
    renderStrip(); renderPipe(); renderBrief();
    var last = null; try { last = localStorage.getItem('c2edge.market'); } catch (e) {}
    var first = S.pipe.manifest.markets.find(function (m) { return m.id === last; }) || S.pipe.manifest.markets[0];
    selectMarket(first.id);
  }).catch(function () { loadDemo(); });
  if (['backtest', 'optimize', 'delta', 'news', 'data'].indexOf(h) >= 0) showTab(h);
  if (window.claude && window.claude.use) {
    window.claude.use('sample').then(function (f) { sampleFn = f; if (f) { $('aiReviewBtn').hidden = false; } else { $('aiNewsBtn').disabled = true; $('aiNewsOut').innerHTML = '<p class="mut">The AI desk is available when this page is opened in Claude.</p>'; } }, function () {});
    window.claude.use('downloads').then(function (d) { downloads = d; if (d) $('exportBtn').hidden = false; }, function () {});
  } else { $('aiNewsBtn').disabled = true; $('aiNewsOut').innerHTML = '<p class="mut">The AI desk is available when this page is opened in Claude.</p>'; }
}
boot();
})();
