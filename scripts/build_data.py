#!/usr/bin/env python3
"""
Build the data folder the web app and the backtest read:

  <out>/markets.json             manifest of markets that downloaded
  <out>/candles/<ID>.json.gz     90 days of 1-minute bars per market
  <out>/news/calendar.json       Forex Factory events (this + next week) merged into a rolling history
  <out>/status.json              what ran, what failed

Usage:
  python scripts/build_data.py --out site/data --cache .cache
  python scripts/build_data.py --out site/data --prev-url https://you.github.io/c2-edge/   # keep news history
  python scripts/build_data.py --out site/data --only XAUUSD --days 30
"""
import argparse
import json
import os
import sys
import time
import urllib.parse

sys.path.insert(0, os.path.dirname(__file__))
import c2data  # noqa: E402

HERE = os.path.dirname(__file__)


def load_prev_history(prev_url):
    if not prev_url:
        return []
    url = urllib.parse.urljoin(prev_url.rstrip("/") + "/", "data/news/calendar.json")
    try:
        body = c2data.http_get(url, retries=1)
        return json.loads(body).get("events", []) if body else []
    except Exception as e:
        c2data.log(f"No previous news history at {url} ({e}); starting fresh.")
        return []


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="site/data")
    ap.add_argument("--cache", default=".cache")
    ap.add_argument("--config", default=os.path.join(HERE, "markets.json"))
    ap.add_argument("--days", type=int)
    ap.add_argument("--only", help="comma-separated market ids")
    ap.add_argument("--prev-url", help="URL of the deployed site, to carry the news history forward")
    ap.add_argument("--skip-news", action="store_true")
    ap.add_argument("--budget-min", type=float, default=45, help="stop starting new markets after this many minutes")
    a = ap.parse_args()

    cfg = json.load(open(a.config))
    days = a.days or cfg.get("days", 90)
    only = set(a.only.split(",")) if a.only else None
    status = {"startedAt": int(time.time() * 1000), "days": days, "markets": {}, "news": {}}
    manifest = []

    started = time.time()
    for m in cfg["markets"]:
        if only and m["id"] not in only:
            continue
        if (time.time() - started) / 60 > a.budget_min:
            status["markets"][m["id"]] = {"ok": False, "error": "skipped: time budget used up; the next run continues from the cache"}
            c2data.log(f"{m['id']}: skipped, time budget used up")
            continue
        t0 = time.time()
        c2data.log(f"{m['id']}: fetching {days} days from {m['source']} …")
        try:
            bars, missing = c2data.fetch_market_bars(m, days, a.cache)
            if len(bars) < 1000:
                raise ValueError(f"only {len(bars)} bars downloaded")
            bad = c2data.check_bars(bars, m["id"])
            ext, ext_label = None, None
            for src in m.get("external", []):
                try:
                    eb, _ = c2data.fetch_binance(src["source"], src["symbol"], days, a.cache)
                    if len(eb) > 1000:
                        ext, ext_label = eb, src["label"]
                        break
                    c2data.log(f"  external {src['symbol']}: no data, trying next")
                except Exception as e:
                    c2data.log(f"  external {src['symbol']}: {e}")
            packed = c2data.pack_market(m, bars, ext, ext_label)
            size = c2data.write_gz_json(os.path.join(a.out, "candles", m["id"] + ".json.gz"), packed)
            entry = {k: m.get(k) for k in ("id", "name", "source", "symbol", "digits", "currencies", "costs")}
            entry.update({"file": f"candles/{m['id']}.json.gz", "from": packed["from"], "to": packed["to"], "bars": packed["bars"],
                          "trueDelta": packed["td"] is not None, "external": packed.get("external")})
            manifest.append(entry)
            status["markets"][m["id"]] = {"ok": True, "bars": len(bars), "missingDays": missing, "badBars": bad,
                                          "external": packed.get("external"), "rawBytes": size, "seconds": round(time.time() - t0, 1)}
            c2data.log(f"  {len(bars):,} bars, {missing} missing days, external: {packed.get('external')}")
        except Exception as e:
            status["markets"][m["id"]] = {"ok": False, "error": str(e)}
            c2data.log(f"  FAILED: {e}")

    os.makedirs(a.out, exist_ok=True)
    json.dump({"generatedAt": int(time.time() * 1000), "days": days, "markets": manifest},
              open(os.path.join(a.out, "markets.json"), "w"), indent=1)

    if not a.skip_news:
        old = load_prev_history(a.prev_url)
        new, errors = c2data.fetch_ff()
        events = c2data.merge_events(old, new)
        os.makedirs(os.path.join(a.out, "news"), exist_ok=True)
        json.dump({"updatedAt": int(time.time() * 1000), "source": "Forex Factory (nfs.faireconomy.media)",
                   "fetched": len(new), "errors": errors, "events": events},
                  open(os.path.join(a.out, "news", "calendar.json"), "w"), separators=(",", ":"))
        status["news"] = {"fetched": len(new), "history": len(events), "errors": errors}
        c2data.log(f"News: {len(new)} fetched, {len(events)} in history, errors: {errors or 'none'}")

    status["finishedAt"] = int(time.time() * 1000)
    json.dump(status, open(os.path.join(a.out, "status.json"), "w"), indent=1)
    if not manifest:
        c2data.log("No market downloaded. Failing so the old site stays live.")
        sys.exit(1)


if __name__ == "__main__":
    main()
