/* =====================================================================
   C2 Edge engine — FM fractal model (C2 sweep -> CISD -> IC-CISD) with
   FRVP, session VWAP, delta and news filters. Pure functions, no DOM.
   Everything is lookahead-free: a decision on bar i uses bars <= i-1
   (or the open of bar i for market entries).
   ===================================================================== */
var ENGINE = (function () {
  'use strict';
  var MIN = 60000, HOUR = 3600000, DAY = 86400000;

  // ---------------------------------------------------------------- time
  function nthSundayUTC(year, month, n) { // month 0-based
    var d = new Date(Date.UTC(year, month, 1));
    var first = (7 - d.getUTCDay()) % 7 + 1;
    return first + (n - 1) * 7;
  }
  // New York offset in hours (-4 summer, -5 winter) for a UTC timestamp
  function nyOffset(t) {
    var y = new Date(t).getUTCFullYear();
    var start = Date.UTC(y, 2, nthSundayUTC(y, 2, 2), 7); // 2am EST = 07:00 UTC
    var end = Date.UTC(y, 10, nthSundayUTC(y, 10, 1), 6); // 2am EDT = 06:00 UTC
    return (t >= start && t < end) ? -4 : -5;
  }
  // Eastern-time wall clock -> UTC ms
  function etToUtc(y, m, d, hh, mm) {
    var guess = Date.UTC(y, m - 1, d, hh, mm);
    var off = nyOffset(guess + 5 * HOUR);
    return guess - off * HOUR;
  }

  // ------------------------------------------------------------- parsing
  function splitLine(line, delim) {
    if (delim !== ',' || line.indexOf('"') < 0) return line.split(delim);
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') q = !q; else if (ch === delim && !q) { out.push(cur); cur = ''; } else cur += ch;
    }
    out.push(cur);
    return out;
  }
  function parseTime(s, s2) {
    s = String(s).trim().replace(/^"|"$/g, '');
    if (s2 !== undefined) s = s + ' ' + String(s2).trim();
    if (/^\d{9,13}(\.\d+)?$/.test(s)) { var n = +s; return n < 1e11 ? n * 1000 : n; }
    var m = s.match(/^(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?\s*(Z|[+\-]\d{2}:?\d{2})?$/);
    if (m) {
      var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
      if (m[8] && m[8] !== 'Z') { var sg = m[8][0] === '-' ? -1 : 1, hm = m[8].slice(1).replace(':', ''); t -= sg * (+hm.slice(0, 2) * 60 + +hm.slice(2)) * MIN; return { t: t, abs: true }; }
      return { t: t, abs: !!m[8] };
    }
    m = s.match(/^(\d{1,2})[.\-\/](\d{1,2})[.\-\/](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?)?/);
    if (m) return { t: Date.UTC(+m[3], +m[2] - 1, +m[1], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0)), abs: false };
    var d = Date.parse(s);
    return isNaN(d) ? null : { t: d, abs: true };
  }
  function num(x) { if (x === undefined || x === null) return NaN; var s = String(x).trim().replace(/^"|"$/g, ''); return s === '' ? NaN : +s; }

  // Accepts TradingView, MT4/MT5, Dukascopy, Twelve Data (via the helper script) and generic OHLCV CSVs.
  function parseCSV(text, tzOffsetHours) {
    tzOffsetHours = +tzOffsetHours || 0;
    var lines = text.replace(/\r/g, '').split('\n').filter(function (l) { return l.trim().length; });
    if (lines.length < 3) throw new Error('The file has fewer than 3 rows.');
    var first = lines[0];
    var delim = first.indexOf('\t') >= 0 ? '\t' : (first.split(';').length > first.split(',').length ? ';' : ',');
    var head = splitLine(first, delim).map(function (h) { return h.trim().replace(/^"|"$/g, '').replace(/[<>]/g, '').toLowerCase(); });
    var hasHeader = head.some(function (h) { return /[a-z]/.test(h) && !/^\d{4}[.\-]/.test(h); });
    function find(names) { for (var i = 0; i < head.length; i++) for (var j = 0; j < names.length; j++) if (head[i] === names[j]) return i; return -1; }
    function findLike(re) { for (var i = 0; i < head.length; i++) if (re.test(head[i])) return i; return -1; }
    var iT, iT2 = -1, iO, iH, iL, iC, iV = -1, iTV = -1, iD = -1, iB = -1, iS = -1;
    if (hasHeader) {
      iT = find(['time', 'datetime', 'date', 'timestamp', 'gmt time', 'local time', 'date_time', 'time (utc)']);
      if (head[iT] === 'date' && find(['time']) >= 0) iT2 = find(['time']);
      iO = find(['open', 'o']); iH = find(['high', 'h']); iL = find(['low', 'l']); iC = find(['close', 'c', 'last']);
      iV = find(['volume', 'vol', 'v', 'real volume']); iTV = find(['tickvol', 'tick volume', 'tick_volume', 'tickvolume']);
      iD = find(['delta', 'volume delta', 'net delta']);
      iB = findLike(/^(buy|ask)[ _]?vol/); iS = findLike(/^(sell|bid)[ _]?vol/);
      if (iO < 0 || iH < 0 || iL < 0 || iC < 0) throw new Error('Could not find open/high/low/close columns. Found: ' + head.join(', '));
      if (iT < 0) iT = 0;
      lines = lines.slice(1);
    } else {
      // headerless: time,open,high,low,close[,volume] or date,time,open,...
      var probe = splitLine(lines[0], delim);
      if (parseTime(probe[0], probe[1]) && isNaN(num(probe[1]))) { iT = 0; iT2 = 1; iO = 2; iH = 3; iL = 4; iC = 5; iV = probe.length > 6 ? 6 : -1; }
      else { iT = 0; iO = 1; iH = 2; iL = 3; iC = 4; iV = probe.length > 5 ? 5 : -1; }
    }
    var rows = [], absSeen = false, bad = 0;
    for (var k = 0; k < lines.length; k++) {
      var p = splitLine(lines[k], delim);
      var pt = parseTime(p[iT], iT2 >= 0 ? p[iT2] : undefined);
      var o = num(p[iO]), h = num(p[iH]), l = num(p[iL]), c = num(p[iC]);
      if (!pt || !isFinite(o) || !isFinite(h) || !isFinite(l) || !isFinite(c)) { bad++; continue; }
      if (pt.abs) absSeen = true;
      var t = pt.abs ? pt.t : pt.t - tzOffsetHours * HOUR;
      var v = iV >= 0 ? num(p[iV]) : NaN, tv = iTV >= 0 ? num(p[iTV]) : NaN;
      rows.push({ t: t, o: o, h: Math.max(h, o, c), l: Math.min(l, o, c), c: c, v: v, tv: tv,
        d: iD >= 0 ? num(p[iD]) : NaN, b: iB >= 0 ? num(p[iB]) : NaN, s: iS >= 0 ? num(p[iS]) : NaN });
    }
    if (rows.length < 3) throw new Error('No readable price rows were found.');
    rows.sort(function (a, b) { return a.t - b.t; });
    var dedup = [rows[0]];
    for (var r = 1; r < rows.length; r++) if (rows[r].t !== dedup[dedup.length - 1].t) dedup.push(rows[r]);
    rows = dedup;
    var n = rows.length, out = { t: new Float64Array(n), o: new Float64Array(n), h: new Float64Array(n), l: new Float64Array(n), c: new Float64Array(n), v: new Float64Array(n), td: null };
    var sumV = 0, sumTV = 0;
    for (r = 0; r < n; r++) { if (isFinite(rows[r].v)) sumV += rows[r].v; if (isFinite(rows[r].tv)) sumTV += rows[r].tv; }
    var useTick = sumV <= 0 && sumTV > 0;
    var hasTD = rows.some(function (x) { return isFinite(x.d) || (isFinite(x.b) && isFinite(x.s)); });
    if (hasTD) out.td = new Float64Array(n);
    for (r = 0; r < n; r++) {
      var x = rows[r];
      out.t[r] = x.t; out.o[r] = x.o; out.h[r] = x.h; out.l[r] = x.l; out.c[r] = x.c;
      var vv = useTick ? x.tv : x.v; out.v[r] = isFinite(vv) && vv > 0 ? vv : 0;
      if (hasTD) out.td[r] = isFinite(x.d) ? x.d : (isFinite(x.b) && isFinite(x.s) ? x.b - x.s : 0);
    }
    // resolution = most common gap
    var counts = {};
    for (r = 1; r < Math.min(n, 5000); r++) { var g = Math.round((out.t[r] - out.t[r - 1]) / MIN); if (g > 0) counts[g] = (counts[g] || 0) + 1; }
    var res = 1, best = -1; for (var key in counts) if (counts[key] > best) { best = counts[key]; res = +key; }
    var totV = 0; for (r = 0; r < n; r++) totV += out.v[r];
    out.resMin = res;
    out.notes = { rows: n, skipped: bad, hasVolume: totV > 0, usedTickVolume: useTick, hasTrueDelta: hasTD, timezoneInFile: absSeen,
      from: out.t[0], to: out.t[n - 1], header: hasHeader ? head : null };
    return out;
  }

  // Align an external (futures) volume series to the base bars by timestamp bucket.
  function alignExternalVolume(base, ext) {
    var n = base.t.length, ev = new Float64Array(n), res = base.resMin * MIN, j = 0, hit = 0;
    // aggregate ext volume into base buckets
    var map = new Map();
    for (var i = 0; i < ext.t.length; i++) {
      var key = Math.floor(ext.t[i] / res) * res;
      map.set(key, (map.get(key) || 0) + ext.v[i]);
    }
    for (i = 0; i < n; i++) { var k = Math.floor(base.t[i] / res) * res; var v = map.get(k); if (v !== undefined) { ev[i] = v; hit++; } }
    return { ev: ev, coverage: n ? hit / n : 0 };
  }

  // ------------------------------------------------------------ resample
  function resample(base, ltfMin) {
    var step = ltfMin * MIN, n = base.t.length;
    var T = [], O = [], H = [], L = [], C = [], V = [], EV = [], TD = [], ETD = [], S = [], E = [];
    var cur = -1, key;
    for (var i = 0; i < n; i++) {
      key = Math.floor(base.t[i] / step) * step;
      if (key !== cur) {
        cur = key; T.push(key); O.push(base.o[i]); H.push(base.h[i]); L.push(base.l[i]); C.push(base.c[i]);
        V.push(base.v[i]); EV.push(base.ev ? base.ev[i] : 0); TD.push(base.td ? base.td[i] : 0); ETD.push(base.etd ? base.etd[i] : 0); S.push(i); E.push(i);
      } else {
        var k = T.length - 1;
        if (base.h[i] > H[k]) H[k] = base.h[i];
        if (base.l[i] < L[k]) L[k] = base.l[i];
        C[k] = base.c[i]; V[k] += base.v[i]; EV[k] += base.ev ? base.ev[i] : 0; TD[k] += base.td ? base.td[i] : 0; ETD[k] += base.etd ? base.etd[i] : 0; E[k] = i;
      }
    }
    var f = function (a) { return Float64Array.from(a); };
    return { t: f(T), o: f(O), h: f(H), l: f(L), c: f(C), v: f(V), ev: f(EV), td: base.td ? f(TD) : null, etd: base.etd ? f(ETD) : null,
      sub0: Int32Array.from(S), sub1: Int32Array.from(E), ltfMin: ltfMin, n: T.length };
  }

  function atrSeries(b, len) {
    var n = b.n, out = new Float64Array(n), a = 0;
    for (var i = 0; i < n; i++) {
      var tr = i === 0 ? b.h[i] - b.l[i] : Math.max(b.h[i] - b.l[i], Math.abs(b.h[i] - b.c[i - 1]), Math.abs(b.l[i] - b.c[i - 1]));
      a = i < len ? (a * i + tr) / (i + 1) : (a * (len - 1) + tr) / len;
      out[i] = a;
    }
    return out;
  }

  // ------------------------------------------------------------- volume & delta
  // volume source: 'broker' | 'futures' | 'unit'
  function volOf(arrV, arrEV, src, i) { return src === 'futures' ? arrEV[i] : src === 'unit' ? 1 : arrV[i]; }

  var DELTA_SOURCES = [
    { id: 'tick', name: 'Candle-direction (tick rule)', note: 'Whole bar volume signed by close vs open. What your FRVP buy/sell split uses.' },
    { id: 'clv', name: 'Close location (CLV)', note: 'Volume weighted by where the bar closed inside its range.' },
    { id: 'body', name: 'Body / range ratio', note: 'Volume weighted by body size relative to range.' },
    { id: 'ib_tick', name: 'Intrabar tick rule', note: 'Sums the tick rule over each 1-minute bar inside the candle. Needs finer data than the LTF.' },
    { id: 'ib_clv', name: 'Intrabar CLV', note: 'Sums close-location delta over each 1-minute bar inside the candle.' },
    { id: 'true', name: 'True taker delta', note: 'Real aggressive buy minus sell volume: Binance taker volume, or a delta / buy-sell column in your file. With external volume selected it uses the external market\'s taker delta.' }
  ];

  function barDelta(o, h, l, c, v, kind) {
    var r = h - l;
    if (kind === 'tick') return c > o ? v : c < o ? -v : 0;
    if (kind === 'clv') return r > 0 ? ((c - l) - (h - c)) / r * v : 0;
    if (kind === 'body') return r > 0 ? (c - o) / r * v : 0;
    return 0;
  }
  function deltaSeries(ctx, kind, volSrc) {
    var key = kind + '|' + volSrc;
    if (ctx.cache.delta[key]) return ctx.cache.delta[key];
    var b = ctx.bars, base = ctx.base, n = b.n, d = new Float64Array(n), cvd = new Float64Array(n), run = 0, avail = true;
    for (var i = 0; i < n; i++) {
      var x = 0;
      if (kind === 'true') { var src = volSrc === 'futures' ? b.etd : b.td; if (!src) { avail = false; } else x = src[i]; }
      else if (kind === 'ib_tick' || kind === 'ib_clv') {
        if (b.sub1[i] === b.sub0[i] && ctx.ltfMin === base.resMin) avail = false;
        for (var k = b.sub0[i]; k <= b.sub1[i]; k++) {
          var vv = volSrc === 'futures' ? (base.ev ? base.ev[k] : 0) : volSrc === 'unit' ? 1 : base.v[k];
          x += barDelta(base.o[k], base.h[k], base.l[k], base.c[k], vv, kind === 'ib_tick' ? 'tick' : 'clv');
        }
      } else x = barDelta(b.o[i], b.h[i], b.l[i], b.c[i], volOf(b.v, b.ev, volSrc, i), kind);
      d[i] = x; run += x; cvd[i] = run;
    }
    var res = { d: d, cvd: cvd, available: avail };
    ctx.cache.delta[key] = res;
    return res;
  }

  // ------------------------------------------------------------- sessions, VWAP, FRVP
  function sessionKey(t, anchor) {
    if (anchor === 'utc0') return Math.floor(t / DAY);
    var local = t + nyOffset(t) * HOUR; // NY wall clock
    return Math.floor((local - 17 * HOUR) / DAY); // new session at 17:00 New York (gold rollover)
  }
  function vwapSeries(ctx, volSrc) {
    var key = volSrc;
    if (ctx.cache.vwap[key]) return ctx.cache.vwap[key];
    var b = ctx.bars, n = b.n, vw = new Float64Array(n), sd = new Float64Array(n);
    var pv = 0, vs = 0, p2v = 0, prev = null;
    for (var i = 0; i < n; i++) {
      var s = ctx.sess[i];
      if (s !== prev) { pv = 0; vs = 0; p2v = 0; prev = s; }
      var p = (b.h[i] + b.l[i] + b.c[i]) / 3, v = volOf(b.v, b.ev, volSrc, i);
      if (!(v > 0)) v = 1e-9;
      pv += p * v; vs += v; p2v += p * p * v;
      vw[i] = pv / vs;
      var varr = p2v / vs - vw[i] * vw[i];
      sd[i] = varr > 0 ? Math.sqrt(varr) : 0;
    }
    var res = { vwap: vw, sd: sd };
    ctx.cache.vwap[key] = res;
    return res;
  }

  // Volume profile per session using base bars, each bar's volume spread across the rows it traded through.
  function profiles(ctx, volSrc) {
    if (ctx.cache.prof[volSrc]) return ctx.cache.prof[volSrc];
    var b = ctx.bars, base = ctx.base, ROWS = 24, VA = 0.7, list = [], start = 0;
    function build(i0, i1) {
      var hi = -Infinity, lo = Infinity;
      for (var i = i0; i <= i1; i++) { if (b.h[i] > hi) hi = b.h[i]; if (b.l[i] < lo) lo = b.l[i]; }
      var rowH = (hi - lo) / ROWS, rowsV = new Float64Array(ROWS);
      if (!(rowH > 0)) return null;
      for (i = i0; i <= i1; i++) for (var k = b.sub0[i]; k <= b.sub1[i]; k++) {
        var v = volSrc === 'futures' ? (base.ev ? base.ev[k] : 0) : volSrc === 'unit' ? 1 : base.v[k];
        if (!(v > 0)) continue;
        var r0 = Math.max(0, Math.min(ROWS - 1, Math.floor((base.l[k] - lo) / rowH)));
        var r1 = Math.max(0, Math.min(ROWS - 1, Math.floor((base.h[k] - lo) / rowH)));
        var share = v / (r1 - r0 + 1);
        for (var r = r0; r <= r1; r++) rowsV[r] += share;
      }
      var tot = 0, poc = 0; for (r = 0; r < ROWS; r++) { tot += rowsV[r]; if (rowsV[r] > rowsV[poc]) poc = r; }
      if (tot <= 0) return null;
      var loI = poc, hiI = poc, cum = rowsV[poc];
      while (cum < tot * VA && (loI > 0 || hiI < ROWS - 1)) {
        var below = loI > 0 ? rowsV[loI - 1] : -1, above = hiI < ROWS - 1 ? rowsV[hiI + 1] : -1;
        if (below >= above) { loI--; cum += below; } else { hiI++; cum += above; }
      }
      // HVNs: >= 70% of POC volume, greedy with 2-row gap, max 6 (same rules as your FRVP Pro)
      var cand = [], kept = [];
      for (r = 0; r < ROWS; r++) if (r !== poc && rowsV[r] >= 0.7 * rowsV[poc]) cand.push(r);
      cand.sort(function (a, z) { return rowsV[z] - rowsV[a]; });
      cand.forEach(function (r2) { if (kept.length < 6 && kept.every(function (q) { return Math.abs(q - r2) > 2; })) kept.push(r2); });
      return { lo: lo, hi: hi, rowH: rowH, rows: rowsV, poc: lo + (poc + 0.5) * rowH, vah: lo + (hiI + 1) * rowH, val: lo + loI * rowH,
        hvn: kept.map(function (r3) { return lo + (r3 + 0.5) * rowH; }), i0: i0, i1: i1, touched: -1 };
    }
    for (var i = 1; i <= b.n; i++) {
      if (i === b.n || ctx.sess[i] !== ctx.sess[i - 1]) {
        if (i - start >= 5) { var p = build(start, i - 1); if (p) list.push(p); }
        start = i;
      }
    }
    // when is each POC first traded through after its session ends (naked POC tracking)
    list.forEach(function (p) {
      for (var j = p.i1 + 1; j < b.n; j++) if (b.l[j] <= p.poc && b.h[j] >= p.poc) { p.touched = j; break; }
    });
    // for each bar: index of latest completed profile
    var last = new Int32Array(b.n).fill(-1), q = 0;
    for (i = 0; i < b.n; i++) { while (q < list.length && list[q].i1 < i) q++; last[i] = q - 1; }
    var res = { list: list, lastDone: last };
    ctx.cache.prof[volSrc] = res;
    return res;
  }
  function frvpLevelsAt(ctx, volSrc, i) {
    var P = profiles(ctx, volSrc), k = P.lastDone[i];
    if (k < 0) return null;
    var p = P.list[k], levels = [{ px: p.poc, kind: 'POC' }, { px: p.vah, kind: 'VAH' }, { px: p.val, kind: 'VAL' }];
    p.hvn.forEach(function (x) { levels.push({ px: x, kind: 'HVN' }); });
    for (var j = Math.max(0, k - 5); j < k; j++) { var q = P.list[j]; if (q.touched < 0 || q.touched >= i) levels.push({ px: q.poc, kind: 'Naked POC' }); }
    return { profile: p, levels: levels };
  }

  // ------------------------------------------------------------- FM model
  // Walk back from an extreme bar through the consecutive run of `bias`-coloured candles; returns the open of the earliest one.
  function findCisdLevel(b, extremeIdx, bias, minIdx) {
    var price = NaN, idx = -1, found = false;
    for (var i = extremeIdx; i >= Math.max(minIdx || 0, extremeIdx - 60); i--) {
      var att = b.c[i] > b.o[i] ? 1 : b.c[i] < b.o[i] ? -1 : 0;
      if (att === 0) continue;
      if (!found) { if (att === bias) { found = true; price = b.o[i]; idx = i; } }
      else { if (att !== bias) break; price = b.o[i]; idx = i; }
    }
    return { price: price, idx: idx };
  }

  function buildHTF(b, htfMin, offsetMin) {
    var step = htfMin * MIN, off = (offsetMin || 0) * MIN, list = [], cur = null;
    for (var i = 0; i < b.n; i++) {
      var key = Math.floor((b.t[i] - off) / step);
      if (!cur || cur.key !== key) {
        cur = { key: key, t: key * step + off, o: b.o[i], h: b.h[i], l: b.l[i], c: b.c[i], i0: i, i1: i, hIdx: i, lIdx: i };
        list.push(cur);
      } else {
        if (b.h[i] > cur.h) { cur.h = b.h[i]; cur.hIdx = i; }
        if (b.l[i] < cur.l) { cur.l = b.l[i]; cur.lIdx = i; }
        cur.c = b.c[i]; cur.i1 = i;
      }
    }
    return list;
  }

  // IC-CISD state machine (port of icStep / icFindSwingRange from your Pine script)
  function runIC(b, s, from, to) {
    var dir = s.dir, out = [], pend = false, lvl = NaN, sIdx = -1, ext = NaN, extIdx = -1;
    for (var m = from; m <= to; m++) {
      var o = b.o[m], c = b.c[m], h = b.h[m], l = b.l[m];
      // wick beyond the C3 extreme during C4 stops IC detection
      if (m >= s.c4Start && !isNaN(s.c3Extreme) && (dir > 0 ? l < s.c3Extreme : h > s.c3Extreme)) break;
      var opp = dir > 0 ? c < o : c > o;
      if (pend) {
        var newExt = dir > 0 ? l < ext : h > ext;
        if (newExt) {
          ext = dir > 0 ? l : h; extIdx = m;
          var r = findCisdLevel(b, extIdx, dir > 0 ? -1 : 1, s.c2Start);
          if (!isNaN(r.price)) { lvl = r.price; sIdx = r.idx; }
        }
        if (m > extIdx && !isNaN(lvl) && (dir > 0 ? c > lvl : c < lvl)) {
          var bestPx = NaN, bestIdx = -1;
          for (var k = Math.max(1, sIdx); k <= m - 1; k++) {
            if (dir > 0) { if (b.l[k] <= b.l[k - 1] && b.l[k] <= b.l[k + 1] && (isNaN(bestPx) || b.l[k] < bestPx)) { bestPx = b.l[k]; bestIdx = k; } }
            else { if (b.h[k] >= b.h[k - 1] && b.h[k] >= b.h[k + 1] && (isNaN(bestPx) || b.h[k] > bestPx)) { bestPx = b.h[k]; bestIdx = k; } }
          }
          if (bestIdx >= 0) { out.push({ swPx: bestPx, swIdx: bestIdx, regIdx: m, level: lvl }); pend = false; }
          else if (!newExt) pend = false;
        }
      } else if (opp) { pend = true; lvl = o; sIdx = m; ext = dir > 0 ? l : h; extIdx = m; }
    }
    return out;
  }

  // Precompute everything that does not depend on strategy parameters.
  function prepare(base, fractal, opts) {
    opts = opts || {};
    var bars = resample(base, fractal.ltf);
    var ctx = { base: base, bars: bars, ltfMin: fractal.ltf, htfMin: fractal.htf, fractal: fractal, atr: atrSeries(bars, 14),
      sess: new Float64Array(bars.n), anchor: opts.anchor || 'ny17', cache: { delta: {}, vwap: {}, prof: {} }, news: opts.news || [] };
    for (var i = 0; i < bars.n; i++) ctx.sess[i] = sessionKey(bars.t[i], ctx.anchor);
    var htf = buildHTF(bars, fractal.htf, fractal.htf >= 240 ? (opts.htfOffsetMin || 0) : 0);
    ctx.htf = htf;
    var setups = [];
    for (var k = 1; k + 1 < htf.length; k++) {
      var c1 = htf[k - 1], c2 = htf[k], c3 = htf[k + 1], c4 = htf[k + 2];
      // skip broken buckets (weekend gaps) where C1 and C2 aren't adjacent periods
      if (c2.key - c1.key !== 1 || c3.key - c2.key !== 1) continue;
      [1, -1].forEach(function (dir) {
        var isC2 = dir > 0 ? (c2.l < c1.l && c2.c > c1.l) : (c2.h > c1.h && c2.c < c1.h);
        if (!isC2) return;
        var extIdx = dir > 0 ? c2.lIdx : c2.hIdx, ext = dir > 0 ? c2.l : c2.h;
        var lvl = findCisdLevel(bars, extIdx, dir > 0 ? -1 : 1, c1.i0);
        if (isNaN(lvl.price) || (dir > 0 ? lvl.price <= ext : lvl.price >= ext)) return;
        var c4End = c4 && c4.key - c3.key === 1 ? c4.i1 : c3.i1;
        var s = { dir: dir, k: k, c1: c1, c2: c2, c3: c3, c2Start: c2.i0, c3Start: c3.i0, c4Start: c4 && c4.key - c3.key === 1 ? c4.i0 : c3.i1 + 1, end: c4End,
          extreme: ext, extremeIdx: extIdx, c1ExtremeIdx: dir > 0 ? c1.lIdx : c1.hIdx, level: lvl.price, levelIdx: lvl.idx,
          c3Extreme: dir > 0 ? c3.l : c3.h, confirmIdx: -1, breachIdx: -1, c4InvalidIdx: -1, ics: [] };
        // first breach of the C2 extreme after C2 closes (XC2)
        for (var j = c3.i0; j <= c4End; j++) if (dir > 0 ? bars.l[j] < ext : bars.h[j] > ext) { s.breachIdx = j; break; }
        var lastLive = s.breachIdx >= 0 ? s.breachIdx - 1 : c4End;
        // CISD: first close through the level after the extreme
        for (j = extIdx + 1; j <= lastLive; j++) if (dir > 0 ? bars.c[j] > lvl.price : bars.c[j] < lvl.price) { s.confirmIdx = j; break; }
        // C4 T-spot invalidation: close beyond [C4 open, C3 midpoint] box
        if (c4 && c4.key - c3.key === 1) {
          var mid = (c3.h + c3.l) / 2, top = Math.max(c4.o, mid), bot = Math.min(c4.o, mid);
          for (j = c4.i0; j <= c4End; j++) if (dir > 0 ? bars.c[j] < bot : bars.c[j] > top) { s.c4InvalidIdx = j + 1; break; }
          s.tspot = { top: top, bot: bot };
        }
        if (s.confirmIdx >= 0) s.ics = runIC(bars, s, s.confirmIdx + 1, lastLive);
        setups.push(s);
      });
    }
    ctx.setups = setups;
    ctx.newsSorted = (ctx.news || []).map(function (e) { return e.t; }).sort(function (a, z) { return a - z; });
    return ctx;
  }

  // ------------------------------------------------------------- simulation
  var DEFAULTS = {
    side: 'both', entryModel: 'cisd', stopMode: 'extreme', bufferATR: 0.25, targetMode: 'rr', rr: 2, sd: 2, minRR: 1.5,
    maxRiskATR: 6, maxChase: 0.5, beAtR: 1, partialAtR: 0, partialPct: 50, timeExit: true, useC4Invalid: true,
    sessions: 'ldn_ny', newsBefore: 30, newsAfter: 30, newsFlatten: 5,
    vwapMode: 'off', frvpMode: 'off', frvpTolATR: 0.5, deltaMode: 'off', deltaSrc: 'clv', deltaVol: 'broker', levelVol: 'broker',
    spread: 0.30, commPerLot: 7, slippage: 0.10, riskPct: 0.5, equity: 10000, isFrac: 0.67, contractSize: 100, feeBps: 0
  };
  var SESSIONS = { all: [0, 24], ldn_ny: [7, 17], ldn: [7, 12], ny: [12, 17] };

  function inSession(t, mode) {
    var w = SESSIONS[mode] || SESSIONS.all, h = new Date(t).getUTCHours() + new Date(t).getUTCMinutes() / 60;
    return h >= w[0] && h < w[1];
  }
  function newsBlocked(ctx, t, P) {
    var ev = ctx.newsSorted;
    if (!ev.length || (P.newsBefore <= 0 && P.newsAfter <= 0)) return false;
    var lo = 0, hi = ev.length - 1;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (ev[mid] < t - P.newsAfter * MIN) lo = mid + 1; else hi = mid; }
    var e = ev[lo];
    return e >= t - P.newsAfter * MIN && e <= t + P.newsBefore * MIN;
  }
  function nextNews(ctx, t) {
    var ev = ctx.newsSorted, lo = 0, hi = ev.length;
    while (lo < hi) { var mid = (lo + hi) >> 1; if (ev[mid] < t) lo = mid + 1; else hi = mid; }
    return lo < ev.length ? ev[lo] : Infinity;
  }

  function simulate(ctx, params) {
    var P = Object.assign({}, DEFAULTS, params || {});
    var b = ctx.bars, n = b.n, trades = [], skipped = {}, busyUntil = -1, equity = P.equity;
    var splitT = b.t[0] + (b.t[n - 1] - b.t[0]) * P.isFrac;
    var vw = P.vwapMode !== 'off' ? vwapSeries(ctx, P.levelVol) : null;
    var dl = P.deltaMode !== 'off' ? deltaSeries(ctx, P.deltaSrc, P.deltaVol) : null;
    function skip(r) { skipped[r] = (skipped[r] || 0) + 1; }
    var cs = P.contractSize > 0 ? P.contractSize : 100, commPerOz = P.commPerLot / cs; // commission per unit of the instrument

    var order = ctx.setups.slice().sort(function (a, z) { return a.c3Start - z.c3Start; });
    for (var si = 0; si < order.length; si++) {
      var s = order[si], dir = s.dir;
      if ((P.side === 'long' && dir < 0) || (P.side === 'short' && dir > 0)) continue;
      if (s.confirmIdx < 0) { skip('No CISD'); continue; }
      // dead(j): the setup was invalidated by a bar that closed before bar j opened
      var dead = function (j) { return (s.breachIdx >= 0 && s.breachIdx < j) || (P.useC4Invalid && s.c4InvalidIdx >= 0 && s.c4InvalidIdx <= j); };
      var e = -1, entry = NaN, stopRef = s.extreme, isLimit = false, icUsed = null;
      var timeOk = function (j) { return inSession(b.t[j], P.sessions) && !newsBlocked(ctx, b.t[j], P); };

      if (P.entryModel === 'cisd') {
        e = Math.max(s.confirmIdx + 1, s.c3Start);
        if (e > s.end || dead(e)) { skip('Invalidated before entry'); continue; }
        if (!timeOk(e)) { skip('Session / news window'); continue; }
        entry = b.o[e];
      } else if (P.entryModel === 'ic') {
        for (var q = 0; q < s.ics.length; q++) { var ic = s.ics[q], ee = Math.max(ic.regIdx + 1, s.c3Start); if (ee <= s.end && ee > busyUntil) { icUsed = ic; e = ee; break; } }
        if (!icUsed) { skip('No IC-CISD'); continue; }
        if (dead(e)) { skip('Invalidated before entry'); continue; }
        if (!timeOk(e)) { skip('Session / news window'); continue; }
        entry = b.o[e];
        if (P.stopMode === 'tight') stopRef = icUsed.swPx;
      } else { // retest limit at the CISD level
        var st = Math.max(s.confirmIdx + 1, s.c3Start, busyUntil + 1);
        for (var j = st; j <= s.end; j++) {
          if (dead(j)) break;
          if (dir > 0 ? b.l[j] <= s.level : b.h[j] >= s.level) {
            if (!timeOk(j)) continue;
            e = j; entry = dir > 0 ? Math.min(b.o[j], s.level) : Math.max(b.o[j], s.level); isLimit = true; break;
          }
        }
        if (e < 0) { skip('No retest fill'); continue; }
      }
      if (e <= busyUntil) { skip('Already in a trade'); continue; }
      if (e >= n) continue;

      // filters -------------------------------------------------------
      var atr = ctx.atr[Math.max(0, e - 1)];
      if (vw) {
        if (P.vwapMode === 'trend' && (dir > 0 ? b.c[e - 1] <= vw.vwap[e - 1] : b.c[e - 1] >= vw.vwap[e - 1])) { skip('VWAP filter'); continue; }
        if (P.vwapMode === 'discount') {
          var x = s.extremeIdx, band = vw.vwap[x] - dir * vw.sd[x];
          if (dir > 0 ? s.extreme > band : s.extreme < band) { skip('VWAP filter'); continue; }
        }
      }
      if (P.frvpMode !== 'off') {
        var lv = frvpLevelsAt(ctx, P.levelVol, s.extremeIdx);
        if (!lv) { skip('FRVP filter'); continue; }
        if (P.frvpMode === 'level') {
          var tol = P.frvpTolATR * ctx.atr[s.extremeIdx], near = lv.levels.some(function (L) { return Math.abs(s.extreme - L.px) <= tol || (dir > 0 ? (s.extreme < L.px && b.c[s.extremeIdx] > L.px) : (s.extreme > L.px && b.c[s.extremeIdx] < L.px)); });
          if (!near) { skip('FRVP filter'); continue; }
        } else if (P.frvpMode === 'value') {
          if (dir > 0 ? s.extreme > lv.profile.poc : s.extreme < lv.profile.poc) { skip('FRVP filter'); continue; }
        }
      }
      if (dl) {
        if (P.deltaMode === 'disp') {
          var sum = 0, endD = Math.min(s.confirmIdx, e - 1);
          for (var k2 = s.extremeIdx + 1; k2 <= endD; k2++) sum += dl.d[k2];
          if (sum * dir <= 0) { skip('Delta filter'); continue; }
        } else if (P.deltaMode === 'div') {
          if (dir > 0 ? !(dl.cvd[s.extremeIdx] > dl.cvd[s.c1ExtremeIdx]) : !(dl.cvd[s.extremeIdx] < dl.cvd[s.c1ExtremeIdx])) { skip('Delta filter'); continue; }
        }
      }

      // risk ---------------------------------------------------------
      var buf = P.bufferATR * atr, stop = stopRef - dir * buf, risk = (entry - stop) * dir;
      if (!(risk > 0)) { skip('Entry beyond stop'); continue; }
      if (risk > P.maxRiskATR * atr) { skip('Stop too wide'); continue; }
      var rangeCisd = Math.abs(s.level - s.extreme);
      if (P.entryModel !== 'retest' && (entry - s.level) * dir > P.maxChase * rangeCisd) { skip('Too extended (chase)'); continue; }
      var tgt;
      if (P.targetMode === 'rr') tgt = entry + dir * P.rr * risk;
      else if (P.targetMode === 'sd') tgt = s.level + dir * P.sd * rangeCisd;
      else { // liquidity: C2 opposite extreme, then C1's
        var c2x = dir > 0 ? s.c2.h : s.c2.l, c1x = dir > 0 ? s.c1.h : s.c1.l;
        tgt = (c2x - entry) * dir >= P.minRR * risk ? c2x : c1x;
      }
      if ((tgt - entry) * dir < P.minRR * risk - 1e-9) { skip('Reward below minimum'); continue; }

      // manage --------------------------------------------------------
      var cur = stop, exitPx = NaN, exitIdx = -1, reason = '', realized = 0, remaining = 1, partDone = P.partialAtR <= 0, beDone = P.beAtR <= 0;
      var partPx = entry + dir * P.partialAtR * risk, bePx = entry + dir * P.beAtR * risk, slipCount = isLimit ? 0 : 1;
      for (var m = e; m < n; m++) {
        if (m > e) {
          var nx = nextNews(ctx, b.t[m]);
          if (P.newsFlatten > 0 && nx - b.t[m] <= P.newsFlatten * MIN + ctx.ltfMin * MIN && nx >= b.t[m]) { exitPx = b.o[m]; exitIdx = m; reason = 'News flatten'; slipCount++; break; }
          if (P.timeExit && m > s.end) { exitPx = b.o[m]; exitIdx = m; reason = 'Time (C4 end)'; slipCount++; break; }
        }
        var hitStop = dir > 0 ? b.l[m] <= cur : b.h[m] >= cur;
        var hitTgt = dir > 0 ? b.h[m] >= tgt : b.l[m] <= tgt;
        // If stop and target are both inside one bar we assume the stop came first (conservative).
        if (hitStop) {
          var gapped = m > e && (dir > 0 ? b.o[m] < cur : b.o[m] > cur);
          exitPx = gapped ? b.o[m] : cur;
          exitIdx = m; reason = cur === stop ? 'Stop' : 'Breakeven'; slipCount++; break;
        }
        // On a limit-fill bar we can't know whether the target traded after the fill, so we ignore it there.
        if (hitTgt && !(m === e && isLimit)) {
          if (!partDone && m > e) { realized += (P.partialPct / 100) * (partPx - entry) * dir; remaining = 1 - P.partialPct / 100; partDone = true; }
          exitPx = m > e && (dir > 0 ? b.o[m] > tgt : b.o[m] < tgt) ? b.o[m] : tgt; exitIdx = m; reason = 'Target'; break;
        }
        // partial and breakeven take effect from the next bar (conservative)
        if (!partDone && (dir > 0 ? b.h[m] >= partPx : b.l[m] <= partPx) && m > e) {
          realized += (P.partialPct / 100) * (partPx - entry) * dir; remaining = 1 - P.partialPct / 100; partDone = true;
        }
        if (!beDone && (dir > 0 ? b.h[m] >= bePx : b.l[m] <= bePx) && m > e) { cur = entry + dir * (P.spread + commPerOz + entry * (P.feeBps || 0) / 1e4); beDone = true; } // breakeven after costs
      }
      if (exitIdx < 0) { exitIdx = n - 1; exitPx = b.c[n - 1]; reason = 'End of data'; }
      var gross = realized + remaining * (exitPx - entry) * dir;
      var cost = P.spread + commPerOz + slipCount * P.slippage + entry * (P.feeBps || 0) / 1e4;
      var pnlOz = gross - cost, R = pnlOz / risk;
      var lots = Math.max(0.01, Math.floor(equity * P.riskPct / 100 / (risk * cs) * 100) / 100);
      var pnl = pnlOz * lots * cs;
      equity += pnl;
      trades.push({ dir: dir, setup: s, entryIdx: e, exitIdx: exitIdx, entryT: b.t[e], exitT: b.t[exitIdx], entry: entry, exit: exitPx, stop: stop, target: tgt,
        risk: risk, R: R, pnl: pnl, lots: lots, equity: equity, reason: reason, oos: b.t[e] >= splitT, model: P.entryModel, cost: cost });
      busyUntil = exitIdx;
    }
    return { trades: trades, skipped: skipped, params: P, splitT: splitT, setups: ctx.setups.length };
  }

  // ------------------------------------------------------------- metrics
  function metrics(trades, equity0) {
    equity0 = equity0 || DEFAULTS.equity;
    var n = trades.length, w = 0, sumR = 0, gp = 0, gl = 0, eq = equity0, peak = equity0, mdd = 0, streak = 0, worst = 0, holdSum = 0;
    var daily = {};
    trades.forEach(function (t) {
      if (t.R > 0) { w++; streak = 0; } else { streak++; worst = Math.max(worst, streak); }
      sumR += t.R; if (t.pnl > 0) gp += t.pnl; else gl -= t.pnl;
      eq += t.pnl; peak = Math.max(peak, eq); mdd = Math.max(mdd, (peak - eq) / peak);
      holdSum += (t.exitT - t.entryT) / MIN;
      var d = Math.floor(t.exitT / DAY); daily[d] = (daily[d] || 0) + t.pnl;
    });
    var dv = Object.keys(daily).map(function (k) { return daily[k] / equity0; });
    var mean = dv.reduce(function (a, x) { return a + x; }, 0) / (dv.length || 1);
    var sd = Math.sqrt(dv.reduce(function (a, x) { return a + (x - mean) * (x - mean); }, 0) / Math.max(1, dv.length - 1));
    var wins = trades.filter(function (t) { return t.R > 0; }), losses = trades.filter(function (t) { return t.R <= 0; });
    var avgW = wins.length ? wins.reduce(function (a, t) { return a + t.R; }, 0) / wins.length : 0;
    var avgL = losses.length ? losses.reduce(function (a, t) { return a + t.R; }, 0) / losses.length : 0;
    return { n: n, winRate: n ? w / n : 0, expR: n ? sumR / n : 0, totalR: sumR, pf: gl > 0 ? gp / gl : (gp > 0 ? Infinity : 0),
      net: eq - equity0, retPct: (eq - equity0) / equity0, maxDD: mdd, avgWinR: avgW, avgLossR: avgL, payoff: avgL < 0 ? avgW / -avgL : 0,
      worstStreak: worst, avgHoldMin: n ? holdSum / n : 0, sharpe: sd > 0 ? mean / sd * Math.sqrt(252) : 0, endEquity: eq,
      longs: trades.filter(function (t) { return t.dir > 0; }).length, shorts: trades.filter(function (t) { return t.dir < 0; }).length };
  }
  function split(res) {
    var all = res.trades, P = res.params;
    var is = all.filter(function (t) { return !t.oos; }), oos = all.filter(function (t) { return t.oos; });
    return { all: metrics(all, P.equity), is: metrics(is, P.equity), oos: metrics(oos, P.equity) };
  }
  // Monte Carlo: reshuffle trade order to estimate drawdown risk (R units, fixed fractional)
  function monteCarlo(trades, riskPct, runs, seed) {
    var rs = trades.map(function (t) { return t.R; }), out = [], rnd = rng(seed || 7);
    if (rs.length < 5) return null;
    for (var r = 0; r < (runs || 1000); r++) {
      var a = rs.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), tmp = a[i]; a[i] = a[j]; a[j] = tmp; }
      var eq = 1, peak = 1, dd = 0;
      a.forEach(function (R) { eq *= 1 + R * riskPct / 100; peak = Math.max(peak, eq); dd = Math.max(dd, (peak - eq) / peak); });
      out.push(dd);
    }
    out.sort(function (x, y) { return x - y; });
    return { p50: out[Math.floor(out.length * 0.5)], p95: out[Math.floor(out.length * 0.95)], p99: out[Math.floor(out.length * 0.99)] };
  }

  // ------------------------------------------------------------- research tools
  // How well each delta source predicts the next k bars, measured on the out-of-sample part only.
  function deltaQuality(ctx, kinds, vols, k, isFrac) {
    var b = ctx.bars, n = b.n, out = [], start = Math.floor(n * (isFrac || 0.67));
    kinds.forEach(function (kind) {
      vols.forEach(function (vol) {
        var ds = deltaSeries(ctx, kind, vol);
        if (!ds.available) return;
        var hit = 0, cnt = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
        for (var i = Math.max(start, k); i + k < n; i += k) {
          var x = ds.cvd[i] - ds.cvd[i - k], y = b.c[i + k] - b.c[i];
          if (x === 0 || y === 0) continue;
          cnt++; if ((x > 0) === (y > 0)) hit++;
          sx += x; sy += y; sxx += x * x; syy += y * y; sxy += x * y;
        }
        var cov = sxy / cnt - (sx / cnt) * (sy / cnt), vx = sxx / cnt - Math.pow(sx / cnt, 2), vy = syy / cnt - Math.pow(sy / cnt, 2);
        out.push({ kind: kind, vol: vol, hitRate: cnt ? hit / cnt : 0, corr: vx > 0 && vy > 0 ? cov / Math.sqrt(vx * vy) : 0, samples: cnt });
      });
    });
    return out;
  }

  // Gold reaction to past news events: move after 15 and 60 minutes, from the open of the release bar.
  function eventStudy(ctx, events) {
    var b = ctx.bars, out = [], lm = ctx.ltfMin;
    events.forEach(function (ev) {
      var lo = 0, hi = b.n - 1;
      while (lo < hi) { var mid = (lo + hi) >> 1; if (b.t[mid] < ev.t) lo = mid + 1; else hi = mid; }
      if (b.t[lo] < ev.t || b.t[lo] - ev.t > lm * MIN) return;
      var i = lo, p0 = b.o[i];
      function after(min) { var j = Math.min(b.n - 1, i + Math.max(0, Math.round(min / lm) - 1)); return b.c[j] - p0; }
      var hh = -Infinity, ll = Infinity;
      for (var j = i; j < Math.min(b.n, i + Math.round(60 / lm)); j++) { hh = Math.max(hh, b.h[j]); ll = Math.min(ll, b.l[j]); }
      out.push({ title: ev.title, type: ev.type || ev.title, t: ev.t, m15: after(15), m60: after(60), range60: hh - ll });
    });
    return out;
  }

  // ------------------------------------------------------------- synthetic data (demo only)
  function rng(seed) { var s = seed >>> 0; return function () { s += 0x6D2B79F5; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function synthetic(endT, days, seed, newsTimes) {
    var rnd = rng(seed || 42), gauss = function () { return Math.sqrt(-2 * Math.log(rnd() + 1e-12)) * Math.cos(2 * Math.PI * rnd()); };
    var start = Math.floor((endT - days * DAY) / MIN) * MIN, T = [], O = [], H = [], L = [], C = [], V = [], EV = [];
    var px = 3950, vol = 1, drift = 0, newsSet = {};
    (newsTimes || []).forEach(function (t) { newsSet[Math.floor(t / MIN) * MIN] = 1; });
    var shock = 0;
    for (var t = start; t < endT; t += MIN) {
      var d = new Date(t), dow = d.getUTCDay(), hr = d.getUTCHours();
      if (dow === 6 || (dow === 5 && hr >= 21) || (dow === 0 && hr < 22) || hr === 21) continue; // weekend + daily break
      var sessMul = hr >= 12 && hr < 16 ? 1.7 : hr >= 7 && hr < 12 ? 1.3 : hr >= 16 && hr < 20 ? 0.9 : 0.55;
      if (newsSet[t]) shock = 6;
      vol = Math.max(0.4, Math.min(3, vol + 0.02 * (1 - vol) + 0.05 * gauss()));
      if (rnd() < 0.002) drift = (rnd() - 0.5) * 0.06;
      var sig = 0.32 * vol * sessMul * (1 + shock);
      shock *= 0.9;
      var o = px, c = o + drift + sig * gauss() - 0.0004 * (px - 3950);
      var h = Math.max(o, c) + Math.abs(sig * gauss()) * 0.6, l = Math.min(o, c) - Math.abs(sig * gauss()) * 0.6;
      var v = Math.round((40 + 120 * sessMul) * (0.6 + Math.abs(c - o) / (sig + 1e-9) * 0.5) * (1 + shock) * (0.7 + 0.6 * rnd()));
      T.push(t); O.push(+o.toFixed(2)); H.push(+h.toFixed(2)); L.push(+l.toFixed(2)); C.push(+c.toFixed(2)); V.push(v);
      EV.push(Math.round(v * (2.5 + rnd())));
      px = c;
    }
    var f = function (a) { return Float64Array.from(a); };
    return { t: f(T), o: f(O), h: f(H), l: f(L), c: f(C), v: f(V), ev: f(EV), td: null, resMin: 1, synthetic: true,
      notes: { rows: T.length, hasVolume: true, synthetic: true, from: T[0], to: T[T.length - 1] } };
  }

  // ------------------------------------------------------------- built-in news calendar
  // High-impact USD releases, verified against BLS / BEA / Fed schedules (Eastern Time).
  var USD_HIGH_IMPACT = [
    ['2026-08-04', '10:00', 'JOLTS Job Openings', 'JOLTS'], ['2026-08-07', '08:30', 'Non-Farm Payrolls', 'NFP'],
    ['2026-08-12', '08:30', 'CPI', 'CPI'], ['2026-08-13', '08:30', 'PPI', 'PPI'], ['2026-08-14', '08:30', 'Retail Sales', 'Retail Sales'],
    ['2026-08-19', '14:00', 'FOMC Minutes', 'FOMC Minutes'], ['2026-08-26', '08:30', 'GDP (2nd est.) + Core PCE', 'GDP/PCE'],
    ['2026-09-01', '10:00', 'JOLTS Job Openings', 'JOLTS'], ['2026-09-04', '08:30', 'Non-Farm Payrolls', 'NFP'],
    ['2026-09-10', '08:30', 'PPI', 'PPI'], ['2026-09-11', '08:30', 'CPI', 'CPI'], ['2026-09-16', '08:30', 'Retail Sales', 'Retail Sales'],
    ['2026-09-16', '14:00', 'FOMC Rate Decision', 'FOMC'], ['2026-09-16', '14:30', 'FOMC Press Conference', 'FOMC'],
    ['2026-09-29', '10:00', 'JOLTS Job Openings', 'JOLTS'], ['2026-09-30', '08:30', 'GDP (3rd est.) + Core PCE', 'GDP/PCE'],
    ['2026-10-02', '08:30', 'Non-Farm Payrolls', 'NFP'], ['2026-10-07', '14:00', 'FOMC Minutes', 'FOMC Minutes'],
    ['2026-10-14', '08:30', 'CPI', 'CPI'], ['2026-10-15', '08:30', 'PPI + Retail Sales', 'PPI'],
    ['2026-10-28', '14:00', 'FOMC Rate Decision', 'FOMC'], ['2026-10-28', '14:30', 'FOMC Press Conference', 'FOMC'],
    ['2026-10-29', '08:30', 'GDP (advance) + Core PCE', 'GDP/PCE'], ['2026-10-30', '08:30', 'Employment Cost Index', 'ECI'],
    ['2026-11-03', '10:00', 'JOLTS Job Openings', 'JOLTS'], ['2026-11-06', '08:30', 'Non-Farm Payrolls', 'NFP'],
    ['2026-11-10', '08:30', 'CPI', 'CPI'], ['2026-11-13', '08:30', 'PPI', 'PPI'], ['2026-11-17', '08:30', 'Retail Sales', 'Retail Sales'],
    ['2026-11-18', '14:00', 'FOMC Minutes', 'FOMC Minutes'], ['2026-11-25', '08:30', 'GDP (2nd est.) + Core PCE', 'GDP/PCE'],
    ['2026-12-01', '10:00', 'JOLTS Job Openings', 'JOLTS'], ['2026-12-04', '08:30', 'Non-Farm Payrolls', 'NFP'],
    ['2026-12-09', '14:00', 'FOMC Rate Decision', 'FOMC'], ['2026-12-09', '14:30', 'FOMC Press Conference', 'FOMC']
  ].map(function (r) {
    var d = r[0].split('-').map(Number), tm = r[1].split(':').map(Number);
    return { t: etToUtc(d[0], d[1], d[2], tm[0], tm[1]), title: r[2], type: r[3], currency: 'USD', impact: 'High', source: 'built-in' };
  });
  // Weekly jobless claims: Thursdays 08:30 ET (Wednesday in Thanksgiving week)
  function weeklyClaims(fromT, toT) {
    var out = [], d = new Date(fromT); d.setUTCHours(12, 0, 0, 0);
    for (; d.getTime() <= toT; d.setUTCDate(d.getUTCDate() + 1)) {
      if (d.getUTCDay() !== 4) continue;
      var y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
      var thanksgiving = m === 11 && day >= 22 && day <= 28;
      var dd = thanksgiving ? day - 1 : day;
      out.push({ t: etToUtc(y, m, dd, 8, 30), title: 'Unemployment Claims', type: 'Claims', currency: 'USD', impact: 'Medium', source: 'rule' });
    }
    return out;
  }

  // Forex Factory weekly JSON (nfs.faireconomy.media/ff_calendar_thisweek.json) or pasted text
  function parseFF(text) {
    var data;
    try { data = JSON.parse(text); } catch (e) { data = null; }
    if (Array.isArray(data)) {
      return data.map(function (x) {
        var t = Date.parse(x.date);
        return { t: t, title: x.title, currency: x.country || x.currency, impact: x.impact, forecast: x.forecast || '', previous: x.previous || '', actual: x.actual || '', type: x.title, source: 'Forex Factory' };
      }).filter(function (x) { return isFinite(x.t); });
    }
    // CSV fallback: date,time,currency,impact,title,forecast,previous  (time in ET)
    var rows = String(text).replace(/\r/g, '').split('\n').filter(function (l) { return l.trim(); }), out = [];
    rows.forEach(function (l) {
      var p = splitLine(l, l.indexOf('\t') >= 0 ? '\t' : ',');
      if (p.length < 5 || !/\d{4}-\d{2}-\d{2}/.test(p[0])) return;
      var d = p[0].trim().split('-').map(Number), tm = (p[1] || '00:00').trim().split(':').map(Number);
      out.push({ t: etToUtc(d[0], d[1], d[2], tm[0] || 0, tm[1] || 0), currency: p[2].trim(), impact: p[3].trim(), title: p[4].trim(), forecast: (p[5] || '').trim(), previous: (p[6] || '').trim(), type: p[4].trim(), source: 'pasted' });
    });
    return out;
  }

  // Direction of a USD surprise for gold. +1 = a higher-than-forecast print is USD-positive (usually gold-negative).
  function usdSurpriseSign(title) {
    var s = String(title).toLowerCase();
    if (/unemployment rate|jobless|claims/.test(s)) return -1;
    if (/payroll|nfp|employment change|cpi|ppi|pce|retail|gdp|ism|pmi|jolts|earnings|eci|employment cost|confidence|sentiment|durable|housing|sales/.test(s)) return 1;
    return 0;
  }

  // ------------------------------------------------------------- pipeline data (data/candles/<ID>.json.gz)
  function unpackMarket(m) {
    var n = m.dt.length, f = function () { return new Float64Array(n); };
    var b = { t: f(), o: f(), h: f(), l: f(), c: f(), v: f(), td: m.td ? f() : null, ev: m.ev ? f() : null, etd: m.etd ? f() : null, resMin: m.resMin || 1 };
    var t = m.t0, sc = m.scale || 1, tv = 0;
    for (var i = 0; i < n; i++) {
      t += m.dt[i] * MIN; b.t[i] = t;
      b.o[i] = m.o[i] / sc; b.h[i] = m.h[i] / sc; b.l[i] = m.l[i] / sc; b.c[i] = m.c[i] / sc; b.v[i] = m.v[i]; tv += m.v[i];
      if (b.td) b.td[i] = m.td[i];
      if (b.ev) { b.ev[i] = m.ev[i]; b.etd[i] = m.etd[i]; }
    }
    b.notes = { rows: n, hasVolume: tv > 0, hasTrueDelta: !!m.td, from: b.t[0], to: b.t[n - 1], external: m.external || null, market: m.id };
    return b;
  }
  // Slice the last `days` days of a base series (for the period picker).
  function lastDays(b, days) {
    var from = b.t[b.t.length - 1] - days * DAY, i0 = 0;
    while (i0 < b.t.length && b.t[i0] < from) i0++;
    if (i0 === 0) return b;
    var out = { resMin: b.resMin, notes: Object.assign({}, b.notes, { from: b.t[i0] }) };
    ['t', 'o', 'h', 'l', 'c', 'v', 'td', 'ev', 'etd'].forEach(function (k) { out[k] = b[k] ? b[k].slice(i0) : null; });
    return out;
  }
  // News events that matter for a market: built-in USD schedule plus calendar events in its currencies.
  function marketNews(currencies, calendar, impacts) {
    impacts = impacts || ['High'];
    var list = currencies.indexOf('USD') >= 0 ? USD_HIGH_IMPACT.slice() : [];
    (calendar || []).forEach(function (e) {
      if (currencies.indexOf(e.currency) >= 0 && impacts.indexOf(e.impact) >= 0) list.push({ t: e.t, title: e.title, currency: e.currency, impact: e.impact, forecast: e.forecast, previous: e.previous, actual: e.actual, type: e.title, source: 'Forex Factory' });
    });
    list.sort(function (a, z) { return a.t - z.t; });
    var out = [];
    list.forEach(function (x) { if (!out.length || Math.abs(out[out.length - 1].t - x.t) >= MIN || out[out.length - 1].currency !== x.currency) out.push(x); });
    return out;
  }

  return { parseCSV: parseCSV, alignExternalVolume: alignExternalVolume, resample: resample, prepare: prepare, simulate: simulate,
    metrics: metrics, split: split, monteCarlo: monteCarlo, deltaQuality: deltaQuality, deltaSeries: deltaSeries, vwapSeries: vwapSeries,
    profiles: profiles, frvpLevelsAt: frvpLevelsAt, eventStudy: eventStudy, synthetic: synthetic, USD_HIGH_IMPACT: USD_HIGH_IMPACT,
    weeklyClaims: weeklyClaims, parseFF: parseFF, unpackMarket: unpackMarket, lastDays: lastDays, marketNews: marketNews, usdSurpriseSign: usdSurpriseSign, etToUtc: etToUtc, nyOffset: nyOffset,
    DEFAULTS: DEFAULTS, DELTA_SOURCES: DELTA_SOURCES, SESSIONS: SESSIONS, MIN: MIN, DAY: DAY };
})();
if (typeof module !== 'undefined') module.exports = ENGINE;
