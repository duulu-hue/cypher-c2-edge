"""
c2data: data fetchers for C2 Edge. Standard library only.

Sources
  * Dukascopy  - free 1-minute bid candles for FX and spot gold (one LZMA file per day).
  * Binance    - the public data archive (data.binance.vision): daily 1-minute kline zips
                 with taker-buy volume, so real aggressive buy/sell delta. The archive is
                 static and is not geo-blocked, unlike api.binance.com from US servers.
  * Forex Factory - the weekly calendar feed at nfs.faireconomy.media.

Every download is cached on disk under the cache directory, so repeated runs only fetch
days that are new. Days that cannot change (any day before yesterday) are reused forever.
"""
import csv
import gzip
import io
import json
import lzma
import os
import struct
import sys
import time
import urllib.error
import urllib.request
import zipfile
from datetime import date, datetime, timedelta, timezone

UA = "Mozilla/5.0 (compatible; C2EdgeBot/1.0; +https://github.com)"
MIN_MS = 60_000


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# --------------------------------------------------------------------------- http + cache
def http_get(url, timeout=30, retries=3):
    """Returns bytes, or None for a 404 (no data for that day). Raises on other failures."""
    last = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            last = e
            if e.code in (403, 451):  # blocked: retrying will not help
                raise
        except Exception as e:  # timeouts, resets
            last = e
        time.sleep(1.5 * (attempt + 1))
    raise last


def cached_get(cache_dir, key, url, immutable):
    """Fetch url, caching the body (or a 404 marker) under cache_dir/key."""
    path = os.path.join(cache_dir, key)
    miss = path + ".404"
    if immutable and os.path.exists(path):
        with open(path, "rb") as f:
            return f.read()
    if immutable and os.path.exists(miss):
        return None
    body = http_get(url)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if body is None:
        if immutable:
            open(miss, "w").close()
        return None
    with open(path, "wb") as f:
        f.write(body)
    return body


def day_range(days, end=None):
    """The last `days` complete UTC days, oldest first (ends yesterday)."""
    end = end or (datetime.now(timezone.utc).date() - timedelta(days=1))
    return [end - timedelta(days=i) for i in range(days - 1, -1, -1)]


def immutable_day(d):
    return d < datetime.now(timezone.utc).date() - timedelta(days=1)


# --------------------------------------------------------------------------- Dukascopy
DUKA_URL = "https://datafeed.dukascopy.com/datafeed/{sym}/{y:04d}/{m:02d}/{d:02d}/BID_candles_min_1.bi5"


def parse_bi5_candles(raw, day, point):
    """Decode one Dukascopy BID_candles_min_1.bi5 day file into bars.

    Records are 24 bytes big-endian: int32 seconds-from-midnight, four int32 prices
    (scaled by `point`) and a float32 volume. The documented order is open, close, low,
    high; we verify that against the data (low <= open/close <= high) and fall back to
    open, high, low, close if the file disagrees, so a format surprise fails loudly
    instead of producing silently wrong candles.
    """
    if not raw:
        return []
    data = lzma.decompress(raw)
    n = len(data) // 24
    recs = [struct.unpack_from(">iiiiif", data, i * 24) for i in range(n)]
    if not recs:
        return []
    day0 = int(datetime(day.year, day.month, day.day, tzinfo=timezone.utc).timestamp() * 1000)
    orders = {"oclh": (1, 4, 3, 2), "ohlc": (1, 2, 3, 4)}  # record index of (o, h, l, c) for each layout

    def score(idx):
        io_, ih, il, ic = idx
        ok = 0
        for r in recs:
            if r[il] <= min(r[io_], r[ic]) and r[ih] >= max(r[io_], r[ic]):
                ok += 1
        return ok / len(recs)

    best = max(orders.values(), key=score)
    if score(best) < 0.98:
        raise ValueError(f"Dukascopy candle layout not recognised for {day} (consistency {score(best):.2f})")
    io_, ih, il, ic = best
    tmul = 1000 if recs[-1][0] <= 86400 else 1  # seconds (documented) or milliseconds
    out = []
    for r in recs:
        if r[ih] == r[il] and r[5] == 0:
            continue  # flat zero-volume minutes are Dukascopy filler outside trading hours
        out.append({
            "t": day0 + r[0] * tmul,
            "o": r[io_] / point, "h": r[ih] / point, "l": r[il] / point, "c": r[ic] / point,
            "v": float(r[5]),
        })
    return out


def fetch_dukascopy(symbol, point, days, cache_dir, end=None):
    bars, missing = [], 0
    for d in day_range(days, end):
        if d.weekday() == 5:  # Saturday: market closed
            continue
        url = DUKA_URL.format(sym=symbol, y=d.year, m=d.month - 1, d=d.day)  # month is zero-based
        key = f"duka/{symbol}/{d.isoformat()}.bi5"
        try:
            raw = cached_get(cache_dir, key, url, immutable_day(d))
        except Exception as e:
            log(f"  {symbol} {d}: {e}")
            missing += 1
            continue
        try:
            bars.extend(parse_bi5_candles(raw, d, point))
        except Exception as e:
            log(f"  {symbol} {d}: {e}")
            missing += 1
    bars.sort(key=lambda b: b["t"])
    return bars, missing


# --------------------------------------------------------------------------- Binance archive
BINANCE_URL = {
    "binance-um": "https://data.binance.vision/data/futures/um/daily/klines/{sym}/1m/{sym}-1m-{d}.zip",
    "binance-spot": "https://data.binance.vision/data/spot/daily/klines/{sym}/1m/{sym}-1m-{d}.zip",
}


def parse_binance_zip(raw):
    """Binance kline CSV: open_time, open, high, low, close, volume, close_time, quote_volume,
    count, taker_buy_volume, taker_buy_quote_volume, ignore. Spot files from 2025 use
    microsecond timestamps; futures files have a header row. Both are handled."""
    if not raw:
        return []
    out = []
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        for name in z.namelist():
            with z.open(name) as f:
                for row in csv.reader(io.TextIOWrapper(f, "utf-8")):
                    if not row or not row[0].strip().lstrip("-").isdigit():
                        continue  # header
                    t = int(row[0])
                    if t > 10**14:
                        t //= 1000  # microseconds -> ms
                    v = float(row[5])
                    buy = float(row[9])
                    out.append({"t": t, "o": float(row[1]), "h": float(row[2]), "l": float(row[3]),
                                "c": float(row[4]), "v": v, "td": 2 * buy - v})
    return out


def fetch_binance(source, symbol, days, cache_dir, end=None):
    bars, missing = [], 0
    for d in day_range(days, end):
        url = BINANCE_URL[source].format(sym=symbol, d=d.isoformat())
        key = f"{source}/{symbol}/{d.isoformat()}.zip"
        try:
            raw = cached_get(cache_dir, key, url, immutable_day(d))
        except Exception as e:
            log(f"  {source}:{symbol} {d}: {e}")
            missing += 1
            continue
        if raw is None:
            missing += 1
            continue
        bars.extend(parse_binance_zip(raw))
    bars.sort(key=lambda b: b["t"])
    return bars, missing


def fetch_market_bars(m, days, cache_dir, end=None):
    if m["source"] == "dukascopy":
        return fetch_dukascopy(m["symbol"], m["point"], days, cache_dir, end)
    if m["source"] in BINANCE_URL:
        return fetch_binance(m["source"], m["symbol"], days, cache_dir, end)
    raise ValueError("unknown source " + m["source"])


# --------------------------------------------------------------------------- packing
def pack_market(m, bars, ext=None, ext_label=None):
    """Compact columnar JSON: prices as integers, time as minute steps."""
    scale = int(m.get("point") or 1000)
    t0 = bars[0]["t"]
    prev = t0
    dt = []
    for b in bars:
        dt.append((b["t"] - prev) // MIN_MS)
        prev = b["t"]
    col = lambda k: [round(b[k] * scale) for b in bars]
    out = {
        "id": m["id"], "name": m["name"], "source": m["source"], "symbol": m["symbol"],
        "digits": m.get("digits", 2), "currencies": m.get("currencies", ["USD"]), "costs": m.get("costs", {}),
        "resMin": 1, "t0": t0, "dt": dt, "scale": scale,
        "o": col("o"), "h": col("h"), "l": col("l"), "c": col("c"),
        "v": [round(b["v"], 3) for b in bars],
        "td": [round(b["td"], 3) for b in bars] if bars and "td" in bars[0] else None,
        "from": bars[0]["t"], "to": bars[-1]["t"], "bars": len(bars),
        "generatedAt": int(time.time() * 1000),
    }
    if ext:
        idx = {b["t"]: b for b in ext}
        ev, etd, hit = [], [], 0
        for b in bars:
            e = idx.get(b["t"])
            if e:
                hit += 1
            ev.append(round(e["v"], 3) if e else 0)
            etd.append(round(e.get("td", 0.0), 3) if e else 0)
        out["ev"], out["etd"] = ev, etd
        out["external"] = {"label": ext_label, "coverage": round(hit / len(bars), 4)}
    return out


def write_gz_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    raw = json.dumps(obj, separators=(",", ":")).encode()
    with gzip.open(path, "wb", compresslevel=9) as f:
        f.write(raw)
    return len(raw)


def check_bars(bars, name):
    """Sanity checks that stop bad data from reaching the backtest."""
    problems = 0
    for b in bars:
        if not (b["l"] <= min(b["o"], b["c"]) + 1e-9 and b["h"] >= max(b["o"], b["c"]) - 1e-9) or b["l"] <= 0:
            problems += 1
    if bars and problems / len(bars) > 0.001:
        raise ValueError(f"{name}: {problems} of {len(bars)} bars fail OHLC checks")
    return problems


# --------------------------------------------------------------------------- Forex Factory
FF_FEEDS = [
    "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
    "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
]


def normalise_ff(items):
    out = []
    for x in items or []:
        try:
            t = int(datetime.fromisoformat(str(x["date"]).replace("Z", "+00:00")).timestamp() * 1000)
        except Exception:
            continue
        out.append({"t": t, "title": x.get("title", ""), "currency": x.get("country", ""), "impact": x.get("impact", ""),
                    "forecast": x.get("forecast", "") or "", "previous": x.get("previous", "") or "",
                    "actual": x.get("actual", "") or ""})
    return out


def merge_events(old, new):
    """Union by (time, currency, title); newer copies win so actuals fill in once released."""
    key = lambda e: (e["t"], e["currency"], e["title"])
    merged = {key(e): e for e in old or []}
    for e in new:
        prev = merged.get(key(e))
        if prev and not e.get("actual") and prev.get("actual"):
            e = dict(e, actual=prev["actual"])
        merged[key(e)] = e
    cutoff = (time.time() - 400 * 86400) * 1000
    return sorted((e for e in merged.values() if e["t"] >= cutoff), key=lambda e: e["t"])


def fetch_ff():
    events, errors = [], []
    for url in FF_FEEDS:
        try:
            body = http_get(url, retries=2)
            if body:
                events.extend(normalise_ff(json.loads(body)))
        except Exception as e:
            errors.append(f"{url}: {e}")
    return events, errors
