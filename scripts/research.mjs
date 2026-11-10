// Deep-dive research for one market × fractal:
//   * walk-forward: re-pick the best setting on each rolling training window, trade it on the
//     next unseen window, and stitch those unseen windows together. This is the honest
//     estimate of "optimise, then trade" because every result comes from data the pick never saw.
//   * consistency: which settings were positive in most test windows (a hindsight list of
//     candidates, to confirm on new data, not proof).
//   * breakdowns of the market's default settings by session, weekday, entry × target,
//     news blackout window and trading costs.

const DAY = 86400000;

export function rStats(rs) {
  const n = rs.length;
  let win = 0, sum = 0, gp = 0, gl = 0, eq = 0, peak = 0, dd = 0;
  for (const r of rs) { if (r > 0) { win++; gp += r; } else gl -= r; sum += r; eq += r; peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); }
  return { n, winRate: n ? +(win / n).toFixed(4) : 0, expR: n ? +(sum / n).toFixed(4) : 0, totalR: +sum.toFixed(2), pf: gl > 0 ? +(gp / gl).toFixed(3) : (gp > 0 ? null : 0), maxDDR: +dd.toFixed(2) };
}

export function label(c) {
  const tg = c.targetMode === 'rr' ? c.rr + 'R' : c.targetMode === 'sd' ? c.sd + 'SD' : 'liquidity';
  return `${c.entryModel} · ${tg} · vwap ${c.vwapMode} · frvp ${c.frvpMode} · delta ${c.deltaMode} · buf ${c.bufferATR}`;
}

function inWin(trades, a, b) { const out = []; for (const t of trades) if (t.e >= a && t.e < b) out.push(t.R); return out; }

export function research(E, combos, base, fr, P, news) {
  const t0 = Date.now();
  const ctx = E.prepare(base, fr, { anchor: P.anchor, news });
  const start = base.t[0], end = base.t[base.t.length - 1], spanDays = (end - start) / DAY;

  // 1. every setting once over the whole history (the cheap part of walk-forward)
  const runs = combos.map(c => {
    const p = Object.assign({}, P, c);
    if (c.entryModel !== 'ic') p.stopMode = 'extreme';
    const r = E.simulate(ctx, p);
    return { c, trades: r.trades.map(t => ({ e: t.entryT, R: t.R })) };
  });

  // 2. rolling walk-forward windows
  const trainDays = Math.max(30, Math.round(spanDays * 0.33)), testDays = Math.max(10, Math.round(trainDays / 4));
  const minN = Math.max(8, Math.round(trainDays / 8));
  const folds = [], oosR = [], freq = {};
  for (let a = start; a + (trainDays + testDays) * DAY <= end + DAY; a += testDays * DAY) {
    const split = a + trainDays * DAY, b = split + testDays * DAY;
    let best = null;
    for (const run of runs) {
      const is = inWin(run.trades, a, split);
      if (is.length < minN) continue;
      const s = rStats(is), score = s.expR * Math.sqrt(s.n);
      if (!best || score > best.score) best = { run, score, is: s };
    }
    if (!best) { folds.push({ from: a, split, to: b, pick: null }); continue; }
    const oos = inWin(best.run.trades, split, b);
    oosR.push(...oos);
    const lb = label(best.run.c);
    freq[lb] = (freq[lb] || 0) + 1;
    folds.push({ from: a, split, to: b, pick: lb, is: best.is, oos: rStats(oos) });
  }

  // 3. consistency of each setting across the test windows
  const tests = folds.map(f => [f.split, f.to]);
  const consistent = runs.map(run => {
    let pos = 0, used = 0;
    for (const [a, b] of tests) { const rs = inWin(run.trades, a, b); if (rs.length >= 2) { used++; if (rs.reduce((x, y) => x + y, 0) > 0) pos++; } }
    const all = rStats(run.trades.map(t => t.R));
    return { setting: label(run.c), c: run.c, windows: used, positive: pos, share: used ? +(pos / used).toFixed(3) : 0, all };
  }).filter(x => x.all.n >= 30 && x.windows >= Math.max(2, Math.ceil(tests.length * 0.6)))
    .sort((x, y) => y.share - x.share || y.all.expR - x.all.expR)
    // settings whose filter never changed a trade produce identical results: keep one of each
    .filter((x, i, arr) => arr.findIndex(z => z.all.n === x.all.n && z.all.totalR === x.all.totalR && z.positive === x.positive) === i)
    .slice(0, 8);

  // 4. breakdowns of the default settings
  const simR = extra => E.simulate(ctx, Object.assign({}, P, extra));
  const allHours = simR({ sessions: 'all' });
  const sessionOf = h => h >= 22 || h < 7 ? 'Asia 22–07' : h < 12 ? 'London 07–12' : h < 16 ? 'NY overlap 12–16' : 'NY afternoon 16–22';
  const bySession = {}, byHour = Array.from({ length: 24 }, () => []), byDay = {};
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (const t of allHours.trades) {
    const d = new Date(t.entryT), h = d.getUTCHours();
    (bySession[sessionOf(h)] = bySession[sessionOf(h)] || []).push(t.R);
    byHour[h].push(t.R);
    (byDay[DAYS[d.getUTCDay()]] = byDay[DAYS[d.getUTCDay()]] || []).push(t.R);
  }
  const entryTarget = [];
  for (const en of ['cisd', 'retest', 'ic']) for (const tg of [{ targetMode: 'rr', rr: 1.5 }, { targetMode: 'rr', rr: 2 }, { targetMode: 'rr', rr: 3 }, { targetMode: 'liq' }]) {
    const r = simR(Object.assign({ entryModel: en, stopMode: 'extreme' }, tg)), m = E.split(r);
    entryTarget.push({ entry: en, target: tg.targetMode === 'rr' ? tg.rr + 'R' : 'liquidity', all: rStats(r.trades.map(t => t.R)), is: { n: m.is.n, expR: +m.is.expR.toFixed(4) }, oos: { n: m.oos.n, expR: +m.oos.expR.toFixed(4) } });
  }
  const newsWindows = [0, 15, 30, 60].map(w => ({ minutes: w, ...rStats(simR({ newsBefore: w, newsAfter: w }).trades.map(t => t.R)) }));
  const costs = [0, 0.5, 1, 1.5].map(k => ({ multiple: k, ...rStats(simR({ spread: P.spread * k, slippage: P.slippage * k, commPerLot: P.commPerLot * k, feeBps: (P.feeBps || 0) * k }).trades.map(t => t.R)) }));

  return {
    spanDays: +spanDays.toFixed(1), trainDays, testDays, minTradesToPick: minN, tested: combos.length,
    walkForward: { folds, oos: rStats(oosR), picks: Object.entries(freq).sort((a, b) => b[1] - a[1]).map(([setting, times]) => ({ setting, times })) },
    consistent: consistent.map(({ c, ...rest }) => rest),
    bySession: Object.fromEntries(Object.entries(bySession).map(([k, v]) => [k, rStats(v)])),
    byHour: byHour.map((v, h) => ({ hour: h, ...rStats(v) })),
    byWeekday: Object.fromEntries(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sun'].filter(d => byDay[d]).map(d => [d, rStats(byDay[d])])),
    entryTarget, newsWindows, costs, seconds: Math.round((Date.now() - t0) / 1000)
  };
}

export function researchMarkdown(id, frLabel, R) {
  const r2 = x => x == null ? '–' : (+x).toFixed(2), pc = x => (x * 100).toFixed(0) + '%';
  const fmtD = t => new Date(t).toISOString().slice(0, 10);
  let md = `\n### Deep dive: ${id} ${frLabel} (${R.spanDays} days, ${R.tested} settings)\n\n`;
  const w = R.walkForward;
  md += `**Walk-forward** (re-pick the best setting on ${R.trainDays} days, trade it on the next ${R.testDays} unseen days, repeat): **${w.oos.n} trades, win ${pc(w.oos.winRate)}, avg ${r2(w.oos.expR)}R, total ${r2(w.oos.totalR)}R, max drawdown ${r2(w.oos.maxDDR)}R.** This is the number to trust.\n\n`;
  md += '| Train | Test | Pick | Train R (n) | Test R (n) |\n|---|---|---|---:|---:|\n';
  for (const f of w.folds) md += f.pick ? `| ${fmtD(f.from)} → ${fmtD(f.split)} | → ${fmtD(f.to)} | ${f.pick} | ${r2(f.is.expR)} (${f.is.n}) | ${r2(f.oos.expR)} (${f.oos.n}) |\n` : `| ${fmtD(f.from)} → ${fmtD(f.split)} | → ${fmtD(f.to)} | not enough trades | | |\n`;
  md += '\n**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):\n\n| Setting | Positive windows | All trades | Win | Avg R |\n|---|---:|---:|---:|---:|\n';
  for (const c of R.consistent) md += `| ${c.setting} | ${c.positive}/${c.windows} | ${c.all.n} | ${pc(c.all.winRate)} | ${r2(c.all.expR)} |\n`;
  md += '\n**Default settings by session** (all hours traded):\n\n| Session (UTC) | Trades | Win | Avg R |\n|---|---:|---:|---:|\n';
  for (const [k, v] of Object.entries(R.bySession)) md += `| ${k} | ${v.n} | ${pc(v.winRate)} | ${r2(v.expR)} |\n`;
  md += '\n**Entry × target** (default filters):\n\n| Entry | Target | Trades | Win | Avg R | IS R | OOS R |\n|---|---|---:|---:|---:|---:|---:|\n';
  for (const e of R.entryTarget) md += `| ${e.entry} | ${e.target} | ${e.all.n} | ${pc(e.all.winRate)} | ${r2(e.all.expR)} | ${r2(e.is.expR)} | ${r2(e.oos.expR)} |\n`;
  md += '\n**News blackout window** and **cost sensitivity**:\n\n| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |\n|---:|---:|---:|---|---:|---:|\n';
  for (let i = 0; i < 4; i++) md += `| ${R.newsWindows[i].minutes} | ${R.newsWindows[i].n} | ${r2(R.newsWindows[i].expR)} | | ${R.costs[i].multiple} | ${r2(R.costs[i].expR)} |\n`;
  return md;
}
