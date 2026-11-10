#!/usr/bin/env python3
"""
Writes <data>/news/brief.json: a short news brief for the week, by Claude.

Needs the ANTHROPIC_API_KEY environment variable (add it as a repository secret).
Without it the script exits quietly and the app just shows the calendar.
Optional: AI_MODEL (default claude-sonnet-5-5).

It sends Claude the upcoming high- and medium-impact events for the markets' currencies
plus how each market moved after the same releases in the last 90 days (from results.json).
Claude does not see the future: the brief is scenarios, not predictions of the numbers.
"""
import json
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

DATA = sys.argv[1] if len(sys.argv) > 1 else "site/data"
KEY = os.environ.get("ANTHROPIC_API_KEY", "").strip()
MODEL = os.environ.get("AI_MODEL") or "claude-sonnet-5-5"


def main():
    if not KEY:
        print("ANTHROPIC_API_KEY not set; skipping the AI brief.")
        return
    try:
        cal = json.load(open(os.path.join(DATA, "news", "calendar.json"))).get("events", [])
    except Exception:
        cal = []
    try:
        res = json.load(open(os.path.join(DATA, "results", "results.json")))
    except Exception:
        res = {"markets": {}}
    markets = json.load(open(os.path.join(DATA, "markets.json")))["markets"]
    currencies = sorted({c for m in markets for c in m.get("currencies", ["USD"])})
    now = time.time() * 1000
    upcoming = [e for e in cal if e["t"] >= now - 2 * 3600e3 and e["t"] <= now + 8 * 86400e3
                and e.get("currency") in currencies and e.get("impact") in ("High", "Medium")]
    fmt = lambda t: datetime.fromtimestamp(t / 1000, timezone.utc).strftime("%a %d %b %H:%M UTC")
    ev_lines = "\n".join(f"{fmt(e['t'])} | {e['currency']} | {e['impact']} | {e['title']} | forecast {e.get('forecast') or 'n/a'} | previous {e.get('previous') or 'n/a'}"
                         + (f" | actual {e['actual']}" if e.get("actual") else "") for e in upcoming[:40]) or "none found"
    hist = []
    for mid, m in res.get("markets", {}).items():
        for k, v in (m.get("events") or {}).items():
            if v.get("n"):
                hist.append(f"{mid} after {k}: n={v['n']}, median 60m range {v['medRange60']:.5g}, median |60m move| {v['medAbs60']:.5g}, up after 60m {v['up60']}/{v['n']}")
    fixture = " (FIXTURE DATA: say so and treat the reaction stats as placeholders)" if res.get("fixture") else ""
    prompt = (
        "You are a macro strategist on an institutional FX and gold desk. Today is " + datetime.now(timezone.utc).strftime("%A %d %B %Y, %H:%M UTC") + ".\n"
        "Write the weekly news brief for intraday traders running a liquidity-sweep + CISD model on gold (XAUUSD) and the USD majors.\n\n"
        "Upcoming events (Forex Factory calendar):\n" + ev_lines + "\n\n"
        "How each market moved after the same releases in our last 90 days of data" + fixture + ":\n" + ("\n".join(hist[:60]) or "none") + "\n\n"
        "For each event that matters: what the market is looking for, beat / in-line / miss scenarios with the likely first reaction in gold and the affected pair "
        "(through the dollar and real yields), the expected 60-minute range from the data above, and a rule for the model (stand-aside window, fade or follow the first spike, "
        "which liquidity is likely to be swept). Finish with a short plan for the week. Do not predict the actual figures; the direction depends on the print. "
        "Use short headings and bullets. Under 550 words."
    )
    body = json.dumps({"model": MODEL, "max_tokens": 1800, "messages": [{"role": "user", "content": prompt}]}).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=body, headers={
        "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out = json.loads(r.read())
    except Exception as e:
        print(f"AI brief failed: {e}", file=sys.stderr)
        return  # never fail the pipeline because of the brief
    text = "".join(b.get("text", "") for b in out.get("content", []) if b.get("type") == "text").strip()
    if not text:
        print("AI brief came back empty.", file=sys.stderr)
        return
    os.makedirs(os.path.join(DATA, "news"), exist_ok=True)
    json.dump({"generatedAt": int(time.time() * 1000), "model": out.get("model", MODEL), "events": len(upcoming), "text": text},
              open(os.path.join(DATA, "news", "brief.json"), "w"))
    print(f"AI brief written ({len(text)} chars, model {out.get('model', MODEL)}).")


if __name__ == "__main__":
    main()
