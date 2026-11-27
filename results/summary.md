## C2 Edge backtest

1-minute data (days per market in the table). In-sample = first 67% of the period, out-of-sample (OOS) = the rest. Costs included. Default settings (CISD close entry, 2R target, London + NY hours, news blackout).

| Market | Days | Fractal | Trades | Win | Avg R | PF | Net | Max DD | IS R | OOS R (n) | Best optimizer setting IS → OOS | Top-10 robust |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| XAUUSD | 365 | 1m-15m | 1944 | 36.4% | -0.10 | 0.78 | -59.2% | 62.0% | -0.11 | -0.08 (620) | ic/sd/vwap trend/frvp level/delta off: 0.51 → 0.09 | 2/10 |
| XAUUSD | 365 | 5m-1H | 521 | 38.2% | -0.06 | 0.85 | -13.1% | 14.4% | -0.08 | -0.01 (156) | retest/sd/vwap trend/frvp level/delta div: 0.45 → -0.40 | 5/10 |
| XAUUSD | 365 | 15m-4H | 140 | 29.3% | -0.13 | 0.72 | -7.9% | 8.6% | -0.08 | -0.22 (45) | cisd/3R/vwap trend/frvp value/delta div: 1.20 → -0.27 | 0/10 |
| XAUUSDT | 90 | 1m-15m | 460 | 15.2% | -1.22 | 0.08 | -94.2% | 94.2% | -1.37 | -0.95 (161) | ic/1.5R/vwap trend/frvp value/delta disp: -0.80 → -0.76 | 0/10 |
| XAUUSDT | 90 | 5m-1H | 161 | 18.0% | -0.97 | 0.14 | -54.6% | 54.6% | -0.97 | -0.96 (50) | ic/3R/vwap discount/frvp value/delta div: -0.22 → -0.45 | 0/10 |
| XAUUSDT | 90 | 15m-4H | 54 | 24.1% | -0.58 | 0.25 | -14.6% | 14.9% | -0.59 | -0.57 (16) | retest/3R/vwap off/frvp level/delta div: -0.26 → -1.57 | 0/10 |
| PAXGUSDT | 90 | 1m-15m | 356 | 2.3% | -4.31 | 0.00 | -108.6% | 108.6% | -5.03 | -3.06 (129) | ic/1.5R/vwap trend/frvp value/delta off: -1.63 → -1.59 | 0/10 |
| PAXGUSDT | 90 | 5m-1H | 136 | 8.8% | -2.01 | 0.02 | -75.2% | 75.2% | -2.00 | -2.03 (48) | ic/3R/vwap off/frvp off/delta div: -0.51 → -1.31 | 0/10 |
| PAXGUSDT | 90 | 15m-4H | 42 | 11.9% | -0.89 | 0.11 | -17.2% | 17.2% | -0.95 | -0.73 (11) | cisd/sd/vwap off/frvp value/delta off: -0.63 → -1.20 | 2/10 |
| EURUSD | 365 | 1m-15m | 1732 | 25.5% | -0.46 | 0.35 | -97.8% | 97.8% | -0.44 | -0.50 (576) | ic/sd/vwap discount/frvp level/delta disp: -0.07 → -0.24 | 0/10 |
| EURUSD | 365 | 5m-1H | 527 | 35.7% | -0.19 | 0.63 | -39.3% | 40.2% | -0.19 | -0.19 (168) | retest/liq/vwap trend/frvp level/delta disp: 0.41 → -0.02 | 0/10 |
| EURUSD | 365 | 15m-4H | 149 | 37.6% | -0.09 | 0.78 | -6.5% | 10.8% | -0.16 | 0.04 (54) | cisd/sd/vwap trend/frvp value/delta div: 0.37 → 0.94 | 6/10 |
| GBPUSD | 90 | 1m-15m | 434 | 24.6% | -0.47 | 0.30 | -64.1% | 64.5% | -0.47 | -0.48 (127) | ic/3R/vwap off/frvp level/delta off: 0.03 → -0.10 | 3/10 |
| GBPUSD | 90 | 5m-1H | 122 | 36.1% | -0.18 | 0.61 | -10.6% | 11.9% | -0.09 | -0.38 (40) | cisd/2R/vwap discount/frvp value/delta disp: 0.24 → -0.21 | 0/10 |
| GBPUSD | 90 | 15m-4H | 47 | 36.2% | -0.09 | 0.78 | -2.1% | 4.1% | -0.13 | -0.01 (15) | retest/liq/vwap discount/frvp off/delta off: 0.51 → 0.23 | 4/10 |
| AUDUSD | 90 | 1m-15m | 446 | 18.4% | -0.77 | 0.13 | -81.8% | 81.8% | -0.82 | -0.66 (143) | cisd/1.5R/vwap off/frvp level/delta div: -0.31 → -0.73 | 0/10 |
| AUDUSD | 90 | 5m-1H | 115 | 26.1% | -0.43 | 0.33 | -21.8% | 21.9% | -0.37 | -0.53 (42) | retest/3R/vwap trend/frvp off/delta disp: 0.04 → -0.29 | 0/10 |
| AUDUSD | 90 | 15m-4H | 35 | 34.3% | -0.13 | 0.65 | -2.2% | 2.5% | -0.15 | -0.09 (12) | cisd/1.5R/vwap discount/frvp off/delta off: 0.06 → -0.17 | 1/10 |

### Delta sources (5m-1H, used as a filter)

| Market | Best in-sample | OOS R with it | OOS R without | Next-3-bar hit rate |
|---|---|---:|---:|---:|
| XAUUSD | Body / range ratio · unit · div | -0.02 | -0.01 | 50.2% |
| XAUUSDT | True taker delta · broker · div | -0.73 | -0.96 | 49.5% |
| PAXGUSDT | Intrabar tick rule · unit · div | -2.15 | -2.03 | 48.8% |
| EURUSD | Intrabar tick rule · broker · div | -0.24 | -0.19 | 49.0% |
| GBPUSD | Candle-direction (tick rule) · broker · div | -0.36 | -0.38 | 49.5% |
| AUDUSD | Body / range ratio · broker · div | -0.24 | -0.53 | 50.7% |

### Deep dive: XAUUSD 1m-15m (364 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **82 trades, win 24%, avg -0.30R, total -24.37R, max drawdown 25.35R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-27 → 2026-03-27 | → 2026-04-26 | cisd · 2R · vwap off · frvp level · delta div · buf 0.1 | 0.32 (27) | -0.34 (11) |
| 2025-12-27 → 2026-04-26 | → 2026-05-26 | cisd · 2R · vwap discount · frvp level · delta off · buf 0.3 | 0.32 (22) | -0.02 (13) |
| 2026-01-26 → 2026-05-26 | → 2026-06-25 | cisd · liquidity · vwap trend · frvp value · delta div · buf 0.1 | 0.38 (19) | -0.71 (5) |
| 2026-02-25 → 2026-06-25 | → 2026-07-25 | cisd · 3R · vwap discount · frvp level · delta div · buf 0.1 | 0.60 (17) | -1.16 (2) |
| 2026-03-27 → 2026-07-25 | → 2026-08-24 | retest · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 0.24 (104) | 0.10 (21) |
| 2026-04-26 → 2026-08-24 | → 2026-09-23 | cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 1.21 (15) | -0.50 (10) |
| 2026-05-26 → 2026-09-23 | → 2026-10-23 | cisd · liquidity · vwap off · frvp level · delta disp · buf 0.1 | 0.74 (18) | -0.50 (8) |
| 2026-06-25 → 2026-10-23 | → 2026-11-22 | cisd · 2SD · vwap trend · frvp value · delta disp · buf 0.3 | 0.33 (41) | -0.64 (12) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · liquidity · vwap off · frvp level · delta div · buf 0.1 | 4/5 | 30 | 43% | 0.24 |
| ic · 2SD · vwap off · frvp level · delta off · buf 0.1 | 6/8 | 49 | 45% | 0.14 |
| ic · 2SD · vwap off · frvp off · delta off · buf 0.3 | 6/8 | 394 | 40% | 0.02 |
| ic · 2SD · vwap trend · frvp off · delta disp · buf 0.3 | 6/8 | 142 | 37% | -0.04 |
| ic · 2SD · vwap off · frvp off · delta off · buf 0.1 | 6/8 | 480 | 36% | -0.05 |
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 5/7 | 42 | 36% | 0.21 |
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.3 | 5/7 | 38 | 34% | 0.17 |
| cisd · 2SD · vwap trend · frvp level · delta off · buf 0.1 | 5/7 | 67 | 34% | 0.09 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 1476 | 36% | -0.09 |
| London 07–12 | 1012 | 34% | -0.15 |
| NY overlap 12–16 | 740 | 39% | -0.02 |
| NY afternoon 16–22 | 957 | 35% | -0.18 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 1959 | 39% | -0.12 | -0.12 | -0.12 |
| cisd | 2R | 1944 | 36% | -0.10 | -0.11 | -0.08 |
| cisd | 3R | 1933 | 34% | -0.10 | -0.11 | -0.09 |
| cisd | liquidity | 638 | 28% | -0.12 | -0.14 | -0.09 |
| retest | 1.5R | 2664 | 37% | -0.16 | -0.15 | -0.17 |
| retest | 2R | 2635 | 33% | -0.15 | -0.15 | -0.16 |
| retest | 3R | 2624 | 30% | -0.15 | -0.14 | -0.18 |
| retest | liquidity | 1406 | 27% | -0.18 | -0.17 | -0.21 |
| ic | 1.5R | 1061 | 40% | -0.09 | -0.06 | -0.14 |
| ic | 2R | 1060 | 39% | -0.07 | -0.05 | -0.12 |
| ic | 3R | 1060 | 37% | -0.09 | -0.06 | -0.14 |
| ic | liquidity | 207 | 27% | -0.21 | -0.18 | -0.26 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 1965 | -0.10 | | 0 | 0.02 |
| 15 | 1950 | -0.10 | | 0.5 | -0.04 |
| 30 | 1944 | -0.10 | | 1 | -0.10 |
| 60 | 1927 | -0.10 | | 1.5 | -0.16 |

### Deep dive: XAUUSD 5m-1H (364 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **74 trades, win 24%, avg -0.26R, total -19.03R, max drawdown 20.26R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-27 → 2026-03-27 | → 2026-04-26 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.37 (26) | -0.08 (4) |
| 2025-12-27 → 2026-04-26 | → 2026-05-26 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.25 (25) | 0.07 (7) |
| 2026-01-26 → 2026-05-26 | → 2026-06-25 | retest · 2SD · vwap trend · frvp level · delta div · buf 0.1 | 0.42 (15) | -1.12 (1) |
| 2026-02-25 → 2026-06-25 | → 2026-07-25 | retest · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 0.51 (18) | 0.21 (7) |
| 2026-03-27 → 2026-07-25 | → 2026-08-24 | retest · 2SD · vwap trend · frvp level · delta disp · buf 0.3 | 0.53 (17) | -0.57 (2) |
| 2026-04-26 → 2026-08-24 | → 2026-09-23 | retest · 2SD · vwap trend · frvp value · delta off · buf 0.3 | 0.49 (38) | -0.12 (9) |
| 2026-05-26 → 2026-09-23 | → 2026-10-23 | cisd · 2SD · vwap off · frvp off · delta disp · buf 0.1 | 0.37 (87) | -0.40 (23) |
| 2026-06-25 → 2026-10-23 | → 2026-11-22 | cisd · 2SD · vwap off · frvp off · delta disp · buf 0.1 | 0.22 (88) | -0.39 (21) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| retest · 2SD · vwap trend · frvp level · delta div · buf 0.1 | 4/5 | 38 | 37% | 0.35 |
| ic · 2SD · vwap trend · frvp off · delta disp · buf 0.1 | 6/8 | 39 | 46% | 0.25 |
| retest · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 6/8 | 55 | 38% | 0.21 |
| ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 6/8 | 39 | 41% | 0.12 |
| ic · 1.5R · vwap trend · frvp value · delta disp · buf 0.1 | 6/8 | 48 | 42% | 0.11 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.3 | 6/8 | 138 | 44% | 0.07 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.1 | 6/8 | 139 | 42% | 0.05 |
| cisd · 1.5R · vwap off · frvp value · delta div · buf 0.1 | 6/8 | 200 | 45% | 0.05 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 213 | 40% | 0.02 |
| NY afternoon 16–22 | 237 | 46% | 0.01 |
| Asia 22–07 | 306 | 32% | -0.10 |
| London 07–12 | 259 | 36% | -0.12 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 524 | 41% | -0.05 | -0.05 | -0.04 |
| cisd | 2R | 521 | 38% | -0.06 | -0.08 | -0.01 |
| cisd | 3R | 521 | 37% | -0.04 | -0.06 | 0.02 |
| cisd | liquidity | 148 | 23% | -0.18 | -0.23 | -0.10 |
| retest | 1.5R | 684 | 38% | -0.07 | -0.05 | -0.14 |
| retest | 2R | 679 | 33% | -0.09 | -0.07 | -0.14 |
| retest | 3R | 676 | 31% | -0.08 | -0.07 | -0.11 |
| retest | liquidity | 311 | 25% | -0.13 | -0.10 | -0.21 |
| ic | 1.5R | 248 | 40% | -0.04 | -0.09 | 0.08 |
| ic | 2R | 248 | 37% | -0.06 | -0.13 | 0.09 |
| ic | 3R | 248 | 35% | -0.07 | -0.13 | 0.09 |
| ic | liquidity | 46 | 24% | -0.29 | -0.45 | 0.03 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 526 | -0.06 | | 0 | -0.01 |
| 15 | 525 | -0.06 | | 0.5 | -0.03 |
| 30 | 521 | -0.06 | | 1 | -0.06 |
| 60 | 519 | -0.06 | | 1.5 | -0.09 |

### Deep dive: XAUUSD 15m-4H (364 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **30 trades, win 33%, avg 0.03R, total 1.02R, max drawdown 5.70R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-27 → 2026-03-27 | → 2026-04-26 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.49 (16) | 0.06 (4) |
| 2025-12-27 → 2026-04-26 | → 2026-05-26 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.3 | 1.06 (16) | 0.40 (2) |
| 2026-01-26 → 2026-05-26 | → 2026-06-25 | cisd · 3R · vwap trend · frvp value · delta div · buf 0.3 | 1.19 (15) | 2.99 (1) |
| 2026-02-25 → 2026-06-25 | → 2026-07-25 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.3 | 1.21 (15) | -0.73 (2) |
| 2026-03-27 → 2026-07-25 | → 2026-08-24 | cisd · 3R · vwap off · frvp level · delta disp · buf 0.3 | 0.76 (15) | -0.09 (2) |
| 2026-04-26 → 2026-08-24 | → 2026-09-23 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.32 (24) | 0.34 (4) |
| 2026-05-26 → 2026-09-23 | → 2026-10-23 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.51 (24) | -0.20 (11) |
| 2026-06-25 → 2026-10-23 | → 2026-11-22 | cisd · liquidity · vwap discount · frvp off · delta disp · buf 0.1 | 0.31 (18) | -0.13 (4) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 3R · vwap off · frvp level · delta off · buf 0.1 | 6/8 | 53 | 38% | 0.23 |
| ic · 3R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 37 | 49% | 0.24 |
| ic · 3R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 37 | 49% | 0.23 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 37 | 49% | 0.20 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 37 | 49% | 0.20 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 37 | 51% | 0.16 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 37 | 51% | 0.16 |
| cisd · 2R · vwap off · frvp level · delta div · buf 0.1 | 4/6 | 37 | 43% | 0.25 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 45 | 24% | -0.29 |
| London 07–12 | 45 | 16% | -0.32 |
| NY afternoon 16–22 | 72 | 39% | 0.04 |
| Asia 22–07 | 96 | 43% | 0.09 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 141 | 34% | -0.12 | -0.09 | -0.19 |
| cisd | 2R | 140 | 29% | -0.13 | -0.08 | -0.22 |
| cisd | 3R | 139 | 27% | -0.14 | -0.06 | -0.31 |
| cisd | liquidity | 47 | 23% | -0.16 | -0.08 | -0.26 |
| retest | 1.5R | 197 | 34% | -0.08 | -0.10 | -0.05 |
| retest | 2R | 195 | 29% | -0.13 | -0.10 | -0.20 |
| retest | 3R | 194 | 25% | -0.17 | -0.11 | -0.27 |
| retest | liquidity | 106 | 26% | -0.07 | 0.04 | -0.31 |
| ic | 1.5R | 61 | 36% | -0.09 | -0.00 | -0.24 |
| ic | 2R | 61 | 33% | -0.07 | 0.02 | -0.25 |
| ic | 3R | 61 | 31% | -0.11 | -0.03 | -0.26 |
| ic | liquidity | 16 | 19% | -0.43 | -0.23 | -1.04 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 142 | -0.13 | | 0 | -0.10 |
| 15 | 142 | -0.13 | | 0.5 | -0.11 |
| 30 | 140 | -0.13 | | 1 | -0.13 |
| 60 | 139 | -0.13 | | 1.5 | -0.14 |

### Deep dive: EURUSD 5m-1H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **39 trades, win 33%, avg -0.25R, total -9.60R, max drawdown 11.13R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-27 → 2026-03-27 | → 2026-04-26 | cisd · 3R · vwap trend · frvp level · delta disp · buf 0.3 | 0.14 (39) | 0.38 (4) |
| 2025-12-27 → 2026-04-26 | → 2026-05-26 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.52 (15) | -0.34 (5) |
| 2026-01-26 → 2026-05-26 | → 2026-06-25 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.32 (16) | -0.33 (3) |
| 2026-02-25 → 2026-06-25 | → 2026-07-25 | cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 0.29 (21) | 0.05 (6) |
| 2026-03-27 → 2026-07-25 | → 2026-08-24 | cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 0.31 (22) | -0.45 (7) |
| 2026-04-26 → 2026-08-24 | → 2026-09-23 | cisd · 2R · vwap trend · frvp level · delta div · buf 0.3 | 0.23 (15) | -0.73 (4) |
| 2026-05-26 → 2026-09-23 | → 2026-10-23 | retest · liquidity · vwap off · frvp value · delta div · buf 0.3 | 0.31 (23) | 0.60 (3) |
| 2026-06-25 → 2026-10-23 | → 2026-11-22 | retest · liquidity · vwap off · frvp value · delta div · buf 0.3 | 0.51 (18) | -0.64 (7) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| ic · 2SD · vwap off · frvp level · delta disp · buf 0.1 | 4/5 | 30 | 37% | -0.08 |
| ic · 2SD · vwap off · frvp level · delta off · buf 0.1 | 4/5 | 33 | 33% | -0.12 |
| retest · liquidity · vwap off · frvp level · delta div · buf 0.1 | 4/5 | 32 | 34% | -0.26 |
| cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 6/8 | 69 | 41% | -0.03 |
| cisd · 2SD · vwap trend · frvp value · delta off · buf 0.3 | 6/8 | 73 | 45% | -0.05 |
| cisd · 3R · vwap off · frvp level · delta div · buf 0.3 | 6/8 | 69 | 36% | -0.05 |
| retest · 2SD · vwap off · frvp level · delta div · buf 0.3 | 6/8 | 76 | 34% | -0.14 |
| cisd · 3R · vwap trend · frvp level · delta div · buf 0.1 | 4/6 | 38 | 39% | 0.14 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 434 | 29% | -0.36 |
| London 07–12 | 249 | 34% | -0.24 |
| NY overlap 12–16 | 212 | 38% | -0.16 |
| NY afternoon 16–22 | 254 | 30% | -0.29 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 528 | 39% | -0.21 | -0.23 | -0.17 |
| cisd | 2R | 527 | 36% | -0.19 | -0.19 | -0.19 |
| cisd | 3R | 522 | 33% | -0.19 | -0.18 | -0.21 |
| cisd | liquidity | 137 | 29% | -0.40 | -0.40 | -0.41 |
| retest | 1.5R | 721 | 34% | -0.28 | -0.30 | -0.25 |
| retest | 2R | 715 | 30% | -0.29 | -0.29 | -0.29 |
| retest | 3R | 714 | 27% | -0.28 | -0.26 | -0.33 |
| retest | liquidity | 297 | 25% | -0.39 | -0.40 | -0.37 |
| ic | 1.5R | 245 | 39% | -0.17 | -0.24 | -0.03 |
| ic | 2R | 245 | 37% | -0.16 | -0.20 | -0.08 |
| ic | 3R | 244 | 36% | -0.16 | -0.18 | -0.10 |
| ic | liquidity | 30 | 20% | -0.52 | -0.45 | -0.73 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 541 | -0.20 | | 0 | 0.05 |
| 15 | 539 | -0.20 | | 0.5 | -0.07 |
| 30 | 527 | -0.19 | | 1 | -0.19 |
| 60 | 524 | -0.19 | | 1.5 | -0.31 |

### Deep dive: EURUSD 15m-4H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **41 trades, win 54%, avg 0.02R, total 0.95R, max drawdown 5.68R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-27 → 2026-03-27 | → 2026-04-26 | retest · 3R · vwap trend · frvp value · delta div · buf 0.3 | 0.27 (17) | -0.26 (2) |
| 2025-12-27 → 2026-04-26 | → 2026-05-26 | retest · 3R · vwap trend · frvp value · delta div · buf 0.3 | 0.35 (16) | 0.95 (2) |
| 2026-01-26 → 2026-05-26 | → 2026-06-25 | retest · 2R · vwap trend · frvp value · delta off · buf 0.3 | 0.19 (32) | -0.50 (10) |
| 2026-02-25 → 2026-06-25 | → 2026-07-25 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.32 (21) | 0.33 (4) |
| 2026-03-27 → 2026-07-25 | → 2026-08-24 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.39 (18) | 0.38 (6) |
| 2026-04-26 → 2026-08-24 | → 2026-09-23 | cisd · 1.5R · vwap off · frvp value · delta div · buf 0.3 | 0.49 (17) | 0.12 (2) |
| 2026-05-26 → 2026-09-23 | → 2026-10-23 | cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.1 | 0.34 (41) | 0.05 (9) |
| 2026-06-25 → 2026-10-23 | → 2026-11-22 | cisd · 1.5R · vwap off · frvp value · delta off · buf 0.1 | 0.30 (42) | 0.06 (6) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 1.5R · vwap off · frvp value · delta off · buf 0.1 | 7/8 | 117 | 49% | 0.04 |
| cisd · 1.5R · vwap off · frvp value · delta div · buf 0.1 | 7/8 | 48 | 46% | 0.03 |
| cisd · 1.5R · vwap discount · frvp value · delta off · buf 0.1 | 7/8 | 111 | 48% | 0.03 |
| cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.1 | 6/7 | 105 | 49% | 0.01 |
| cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.3 | 6/7 | 105 | 48% | 0.01 |
| cisd · 1.5R · vwap discount · frvp value · delta disp · buf 0.1 | 6/7 | 100 | 48% | 0.01 |
| cisd · 1.5R · vwap discount · frvp value · delta disp · buf 0.3 | 6/7 | 100 | 47% | 0.00 |
| cisd · 1.5R · vwap discount · frvp value · delta div · buf 0.1 | 6/7 | 44 | 43% | -0.04 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 51 | 27% | -0.26 |
| London 07–12 | 41 | 39% | 0.07 |
| NY afternoon 16–22 | 80 | 45% | -0.08 |
| Asia 22–07 | 84 | 25% | -0.33 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 150 | 43% | -0.05 | -0.11 | 0.04 |
| cisd | 2R | 149 | 38% | -0.09 | -0.16 | 0.04 |
| cisd | 3R | 148 | 35% | -0.10 | -0.17 | 0.02 |
| cisd | liquidity | 40 | 35% | 0.09 | 0.11 | 0.07 |
| retest | 1.5R | 238 | 34% | -0.20 | -0.28 | -0.06 |
| retest | 2R | 236 | 28% | -0.22 | -0.31 | -0.05 |
| retest | 3R | 236 | 26% | -0.23 | -0.31 | -0.08 |
| retest | liquidity | 103 | 21% | -0.20 | -0.34 | 0.05 |
| ic | 1.5R | 74 | 39% | -0.15 | -0.20 | -0.06 |
| ic | 2R | 74 | 35% | -0.17 | -0.24 | -0.04 |
| ic | 3R | 74 | 35% | -0.14 | -0.22 | -0.01 |
| ic | liquidity | 14 | 43% | 0.28 | 0.06 | 0.44 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 153 | -0.10 | | 0 | 0.02 |
| 15 | 153 | -0.10 | | 0.5 | -0.03 |
| 30 | 149 | -0.09 | | 1 | -0.09 |
| 60 | 149 | -0.09 | | 1.5 | -0.16 |

A setting is only worth trading if it stays positive out-of-sample with a reasonable number of trades. Ran in 28s.
