// The parameter grid the optimizer and the walk-forward search explore (810 combinations).
function gridCombos() {
  var out = [];
  var entries = ['cisd', 'retest', 'ic'];
  var targets = [{ targetMode: 'rr', rr: 1.5 }, { targetMode: 'rr', rr: 2 }, { targetMode: 'rr', rr: 3 }, { targetMode: 'sd', sd: 2 }, { targetMode: 'liq' }];
  var vw = ['off', 'trend', 'discount'], fr = ['off', 'level', 'value'], dm = ['off', 'disp', 'div'], bufs = [0.1, 0.3];
  entries.forEach(function (en) { targets.forEach(function (tg) { vw.forEach(function (v) { fr.forEach(function (f) { dm.forEach(function (d) { bufs.forEach(function (bf) {
    out.push(Object.assign({ entryModel: en, vwapMode: v, frvpMode: f, deltaMode: d, bufferATR: bf }, tg));
  }); }); }); }); }); });
  return out;
}

function job(msg, progress) {
  var E = ENGINE, P = msg.params, base = msg.base;
  progress = progress || function () {};
  var ctx = E.prepare(base, msg.fractal, { anchor: P.anchor, htfOffsetMin: (P.htfOffset || 0) * 60, news: [] });
  ctx.newsSorted = (msg.news || []).slice().sort(function (a, b) { return a - b; });
  function sumArr(a) { if (!a) return 0; var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  var vols = [];
  if (sumArr(base.v) > 0) vols.push('broker');
  if (sumArr(base.ev) > 0) vols.push('futures');
  vols.push('unit');

  if (msg.kind === 'optimize') {
    var combos = gridCombos(), total = combos.length, done = 0, keep = [];
    combos.forEach(function (c) {
      var en = c.entryModel, v = c.vwapMode, f = c.frvpMode, d = c.deltaMode, bf = c.bufferATR;
      var p = Object.assign({}, P, c);
      if (en !== 'ic') p.stopMode = 'extreme';
      if (c.targetMode !== 'sd') p.sd = P.sd;
      var r = E.simulate(ctx, p), m = E.split(r), is = m.is, score = -Infinity;
      if (is.n >= msg.minTrades) {
        if (msg.objective === 't') score = is.expR * Math.sqrt(is.n);
        else if (msg.objective === 'exp') score = is.expR;
        else if (msg.objective === 'pf') score = isFinite(is.pf) ? is.pf : 99;
        else if (msg.objective === 'wr') score = (is.expR > 0 && (p.targetMode !== 'rr' || p.rr >= 1.5)) ? is.winRate : -Infinity;
      }
      if (score > -Infinity) {
        keep.push({ p: { entryModel: en, targetMode: p.targetMode, rr: p.rr, sd: p.sd, vwapMode: v, frvpMode: f, deltaMode: d, bufferATR: bf, stopMode: p.stopMode }, is: is, oos: m.oos, score: score });
        keep.sort(function (a, b) { return b.score - a.score; });
        if (keep.length > 15) keep.length = 15;
      }
      done++;
      if (done % 15 === 0) progress(done / total, done + ' of ' + total + ' combinations');
    });
    return { tested: total, top: keep };
  }

  if (msg.kind === 'delta') {
    var kinds = E.DELTA_SOURCES.map(function (d) { return d.id; }).filter(function (k) {
      if (k === 'true') return !!base.td;
      if (k === 'ib_tick' || k === 'ib_clv') return base.resMin < msg.fractal.ltf;
      return true;
    });
    var b0 = E.split(E.simulate(ctx, Object.assign({}, P, { deltaMode: 'off' })));
    var rows = [], tot = kinds.length * vols.length * 2, n = 0;
    kinds.forEach(function (k) { vols.forEach(function (v) {
      if (k === 'true' && v !== 'broker') { n += 2; return; }
      ['disp', 'div'].forEach(function (mode) {
        var m = E.split(E.simulate(ctx, Object.assign({}, P, { deltaMode: mode, deltaSrc: k, deltaVol: v })));
        rows.push({ kind: k, vol: v, mode: mode, is: m.is, oos: m.oos });
        n++; progress(n / tot, n + ' of ' + tot + ' variants');
      });
    }); });
    var quality = E.deltaQuality(ctx, kinds, vols, 3, P.isFrac);
    return { base: { is: b0.is, oos: b0.oos }, rows: rows, quality: quality };
  }
  throw new Error('Unknown job ' + msg.kind);
}
if (typeof WorkerGlobalScope !== 'undefined' && typeof importScripts === 'function') {
  self.onmessage = function (e) {
    try {
      var result = job(e.data, function (p, note) { self.postMessage({ progress: p, note: note }); });
      self.postMessage({ result: result });
    } catch (err) { self.postMessage({ error: String(err && err.message || err) }); }
  };
}
if (typeof module !== 'undefined' && module.exports) { module.exports = job; module.exports.gridCombos = gridCombos; }
