"""Offline tests for the data fetchers. Run: python -m unittest discover -s tests"""
import gzip
import io
import json
import lzma
import os
import struct
import sys
import tempfile
import unittest
import zipfile
from datetime import date, datetime, timezone
from unittest import mock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import c2data  # noqa: E402


def make_bi5(rows, point):
    """rows: (sec, o, h, l, c, v) -> Dukascopy layout (sec, open, close, low, high, vol)."""
    raw = b"".join(struct.pack(">iiiiif", s, round(o * point), round(c * point), round(l * point), round(h * point), v)
                   for s, o, h, l, c, v in rows)
    return lzma.compress(raw, format=lzma.FORMAT_ALONE)


def make_zip(lines, name="X-1m.csv"):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr(name, "\n".join(lines) + "\n")
    return buf.getvalue()


class Dukascopy(unittest.TestCase):
    def test_decodes_documented_layout(self):
        rows = [(0, 4000.0, 4001.5, 3999.2, 4001.0, 12.5), (60, 4001.0, 4002.0, 4000.1, 4000.4, 8.0),
                (120, 4000.4, 4000.9, 3998.0, 3998.5, 20.0)]
        bars = c2data.parse_bi5_candles(make_bi5(rows, 1000), date(2026, 9, 1), 1000)
        self.assertEqual(len(bars), 3)
        t0 = int(datetime(2026, 9, 1, tzinfo=timezone.utc).timestamp() * 1000)
        self.assertEqual(bars[1]["t"], t0 + 60_000)
        b = bars[2]
        self.assertAlmostEqual(b["o"], 4000.4); self.assertAlmostEqual(b["h"], 4000.9)
        self.assertAlmostEqual(b["l"], 3998.0); self.assertAlmostEqual(b["c"], 3998.5)
        self.assertAlmostEqual(b["v"], 20.0)

    def test_drops_flat_filler_and_handles_empty(self):
        rows = [(0, 1.1, 1.1, 1.1, 1.1, 0.0), (60, 1.1, 1.1002, 1.0999, 1.1001, 3.0)]
        bars = c2data.parse_bi5_candles(make_bi5(rows, 100000), date(2026, 9, 1), 100000)
        self.assertEqual(len(bars), 1)
        self.assertEqual(c2data.parse_bi5_candles(b"", date(2026, 9, 1), 1000), [])

    def test_url_month_is_zero_based(self):
        url = c2data.DUKA_URL.format(sym="XAUUSD", y=2026, m=9 - 1, d=1)
        self.assertIn("/2026/08/01/", url)


class Binance(unittest.TestCase):
    def test_futures_with_header_and_taker_delta(self):
        z = make_zip(["open_time,open,high,low,close,volume,close_time,quote_volume,count,taker_buy_volume,taker_buy_quote_volume,ignore",
                      "1788220800000,4000,4002,3999,4001,10,1788220859999,40000,50,7,28000,0"])
        bars = c2data.parse_binance_zip(z)
        self.assertEqual(len(bars), 1)
        self.assertEqual(bars[0]["t"], 1788220800000)
        self.assertAlmostEqual(bars[0]["td"], 4.0)  # 7 bought, 3 sold

    def test_spot_microseconds(self):
        z = make_zip(["1788220800000000,4000,4002,3999,4001,10,1788220859999999,40000,50,2,8000,0"])
        bars = c2data.parse_binance_zip(z)
        self.assertEqual(bars[0]["t"], 1788220800000)
        self.assertAlmostEqual(bars[0]["td"], -6.0)


class News(unittest.TestCase):
    def test_normalise_and_merge_keeps_actuals(self):
        feed = [{"title": "CPI m/m", "country": "USD", "date": "2026-11-10T08:30:00-05:00", "impact": "High", "forecast": "0.3%", "previous": "0.2%"}]
        ev = c2data.normalise_ff(feed)
        self.assertEqual(ev[0]["t"], int(datetime(2026, 11, 10, 13, 30, tzinfo=timezone.utc).timestamp() * 1000))
        old = [dict(ev[0], actual="0.4%")]
        merged = c2data.merge_events(old, ev)
        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["actual"], "0.4%")


class Packing(unittest.TestCase):
    def test_pack_round_trip_and_external_alignment(self):
        m = {"id": "XAUUSD", "name": "Gold", "source": "dukascopy", "symbol": "XAUUSD", "point": 1000, "digits": 2}
        t = 1788220800000
        bars = [{"t": t + i * 60000, "o": 4000 + i, "h": 4001 + i, "l": 3999 + i, "c": 4000.5 + i, "v": 1.0} for i in range(5)]
        ext = [{"t": t + 60000, "v": 9.0, "td": 3.0}]
        p = c2data.pack_market(m, bars, ext, "test")
        self.assertEqual(p["dt"], [0, 1, 1, 1, 1])
        self.assertEqual(p["o"][2], 4002000)
        self.assertEqual(p["ev"], [0, 9.0, 0, 0, 0])
        self.assertEqual(p["etd"][1], 3.0)
        self.assertEqual(p["external"]["coverage"], 0.2)
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "x.json.gz")
            c2data.write_gz_json(path, p)
            self.assertEqual(json.loads(gzip.open(path).read())["bars"], 5)

    def test_check_bars_rejects_broken_data(self):
        good = [{"o": 1, "h": 2, "l": 0.5, "c": 1.5}] * 2000
        self.assertEqual(c2data.check_bars(good, "x"), 0)
        with self.assertRaises(ValueError):
            c2data.check_bars(good + [{"o": 1, "h": 0.9, "l": 0.5, "c": 1.5}] * 10, "x")


class Cache(unittest.TestCase):
    def test_immutable_days_are_not_refetched(self):
        with tempfile.TemporaryDirectory() as d, mock.patch.object(c2data, "http_get", return_value=b"abc") as g:
            self.assertEqual(c2data.cached_get(d, "k/a", "http://x", True), b"abc")
            self.assertEqual(c2data.cached_get(d, "k/a", "http://x", True), b"abc")
            self.assertEqual(g.call_count, 1)


if __name__ == "__main__":
    unittest.main()
