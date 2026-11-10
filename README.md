# C2 Edge

A research desk for the FM fractal model (C2 sweep → CISD → IC-CISD) on gold and the USD majors, with your Fixed Range Volume Profile, session VWAP, delta and a news blackout as filters.

GitHub does the work you can't do from a browser tab:

* **Fetches data.** 90 days of 1-minute bars from Dukascopy (XAUUSD, EURUSD, GBPUSD, AUDUSD) and the Binance public archive (gold perpetual, PAXG). The Binance files carry real taker buy/sell volume, so delta is measured, not guessed.
* **Fetches news.** The Forex Factory calendar several times a day, kept as a growing history so actual figures fill in after each release.
* **Runs the backtest.** Every market × fractal (1m–15m, 5m–1H, 15m–4H), the parameter search and the Delta Lab, with costs. The results table is posted on each Actions run and saved to the `results` branch.
* **Deep dives** (markets with `research` in `scripts/markets.json`, a year of history for gold and EURUSD): rolling walk-forward over all 810 settings, the settings that held up across test windows, and breakdowns by session, entry × target, news window and trading costs.
* **Writes an AI news brief** with Claude, if you add an API key.
* **Publishes the app** to GitHub Pages: a market strip, a period picker, **Run history test**, upcoming news with expected ranges, and the latest GitHub results.

## Set it up (about 5 minutes)

1. Push this folder to a new GitHub repository (public is simplest: Actions minutes are free and Pages works on every plan).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Optional, for the AI brief: **Settings → Secrets and variables → Actions → New repository secret**, name `ANTHROPIC_API_KEY`. To pick a model, add a variable `AI_MODEL` (default `claude-sonnet-5-5`).
4. **Actions → "Data, backtest and site" → Run workflow.** The first run downloads everything (about 5–10 minutes); later runs only fetch new days.
5. Open the run to see the backtest summary, then open your Pages site (`https://<you>.github.io/<repo>/`).

The **CI** workflow runs on every push: engine tests (including a lookahead test), fetcher tests, a full pipeline run on fixture data, and a small live-data probe that reports whether Dukascopy and Binance answer from GitHub's servers.

## Run it on your own machine

```bash
python3 scripts/build_data.py --out site/data --days 90        # needs internet; caches in .cache/
node scripts/run_backtest.mjs --data site/data                 # writes site/data/results/
python3 scripts/ai_brief.py site/data                          # optional, needs ANTHROPIC_API_KEY
node web/build.mjs --out site && python3 -m http.server -d site 8000
```

No dependencies beyond Python 3.10+ and Node 20+. To try it offline: `node tests/make_fixture_data.mjs site/data 30` writes clearly labelled fake data.

Tests: `node --test tests/engine.test.mjs` and `python3 -m unittest discover -s tests`.

## The strategy, exactly

| Step | Rule |
|---|---|
| C2 | A higher-timeframe candle trades beyond the previous candle's low (high) and closes back above (below) it. |
| CISD level | From the sweep extreme, walk back through the run of opposite-coloured lower-timeframe candles; the level is the open of the first one. |
| Entry | One of: next open after a close through the CISD level; a limit at the CISD level on retest; or next open after an IC-CISD protected swing (your Pine state machine, ported). Never before C3 opens. |
| Invalidation | Price trades through the C2 extreme (XC2), a C4 close outside the T-spot box, or C4 ends. |
| Stop | Beyond the C2 extreme (or the protected swing), plus an ATR buffer. |
| Target | Fixed R:R, the CISD standard-deviation projection, or C2/C1 liquidity; skipped below the minimum R:R. |
| Management | Breakeven after costs at 1R, optional partial, exit at the end of C4, flat before high-impact news. |
| Filters | Session hours; session VWAP (trend or ±1σ value); prior-session volume profile (POC, VAH, VAL, HVNs, naked POCs, same rules as FRVP Pro); delta (displacement agrees, or CVD divergence at the sweep). |

**How the testing guards against fooling yourself**

* Every decision uses only bars that have closed. The lookahead test truncates the data and checks earlier trades don't change.
* When a stop and target are both inside one bar, the stop is assumed first. A limit fill bar can't also hit the target.
* Spread, commission, slippage and exchange fees are charged on every trade.
* The first 67% of the period is in-sample; the parameter search ranks only on that. The last 33% is out-of-sample and shown next to it. A setting that wins in-sample and loses out-of-sample is curve-fit, and the table tells you how many of the top 10 survived.
* Monte Carlo reshuffles the trades to show the drawdown you should plan for.

## Data sources and limits

| Source | What it gives | Limits |
|---|---|---|
| Dukascopy datafeed | 1-minute bid candles, tick volume | Tick volume, not exchange volume. Free for personal research; check their terms before commercial use. |
| Binance public archive (`data.binance.vision`) | 1-minute klines with taker buy volume (real delta) | Files appear the next day. `api.binance.com` blocks US servers, which is why the archive is used. Fees matter: about 8 bps per round trip on the perpetual. |
| Forex Factory weekly feed | Events, impact, forecast, previous, actual | This week and next only; history builds up from the day you start running the pipeline. Please don't poll it more than every few minutes. |

Order-book data is not used: no free source keeps a history of it.

This is a research tool. Backtests on 90 days are a small sample; paper-trade anything before risking money. Nothing here is financial advice.

## Layout

```
engine/engine.js      strategy, filters, simulator, metrics (shared by the browser and Node)
engine/worker.js      optimizer and Delta Lab jobs
scripts/              data fetchers, backtest runner, AI brief, market config (markets.json)
web/                  app source and build script
tests/                engine, fetcher and fixture tests
.github/workflows/    CI, and the data → backtest → Pages pipeline
```

Add a market by adding an entry to `scripts/markets.json` (Dukascopy symbol and price point, or a Binance symbol, plus costs).
