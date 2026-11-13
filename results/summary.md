## C2 Edge backtest

1-minute data (days per market in the table). In-sample = first 67% of the period, out-of-sample (OOS) = the rest. Costs included. Default settings (CISD close entry, 2R target, London + NY hours, news blackout).

| Market | Days | Fractal | Trades | Win | Avg R | PF | Net | Max DD | IS R | OOS R (n) | Best optimizer setting IS → OOS | Top-10 robust |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| XAUUSD | 365 | 1m-15m | 1960 | 36.2% | -0.10 | 0.79 | -59.0% | 62.6% | -0.09 | -0.11 (642) | ic/sd/vwap trend/frvp level/delta off: 0.51 → 0.09 | 2/10 |
| XAUUSD | 365 | 5m-1H | 527 | 38.9% | -0.04 | 0.91 | -7.6% | 14.4% | -0.06 | 0.02 (165) | retest/sd/vwap trend/frvp level/delta div: 0.45 → -0.36 | 5/10 |
| XAUUSD | 365 | 15m-4H | 142 | 28.9% | -0.11 | 0.75 | -7.2% | 8.8% | -0.03 | -0.29 (43) | cisd/3R/vwap trend/frvp value/delta div: 1.20 → -0.27 | 0/10 |
| XAUUSDT | 90 | 1m-15m | 469 | 15.1% | -1.41 | 0.05 | -96.5% | 96.5% | -1.56 | -1.12 (157) | cisd/liq/vwap discount/frvp off/delta div: -0.73 → -1.80 | 0/10 |
| XAUUSDT | 90 | 5m-1H | 161 | 18.0% | -1.03 | 0.12 | -56.9% | 56.9% | -1.03 | -1.03 (58) | ic/3R/vwap discount/frvp off/delta div: -0.12 → -0.73 | 0/10 |
| XAUUSDT | 90 | 15m-4H | 54 | 20.4% | -0.74 | 0.17 | -18.1% | 18.1% | -0.89 | -0.34 (15) | retest/3R/vwap trend/frvp level/delta off: -0.54 → -2.47 | 0/10 |
| PAXGUSDT | 90 | 1m-15m | 351 | 2.0% | -4.30 | 0.00 | -104.0% | 104.0% | -4.70 | -3.38 (108) | ic/1.5R/vwap trend/frvp value/delta off: -1.45 → -1.94 | 0/10 |
| PAXGUSDT | 90 | 5m-1H | 131 | 9.9% | -2.11 | 0.02 | -75.6% | 75.6% | -2.06 | -2.21 (44) | ic/3R/vwap off/frvp off/delta div: -0.13 → -2.24 | 0/10 |
| PAXGUSDT | 90 | 15m-4H | 42 | 9.5% | -1.09 | 0.08 | -20.6% | 20.6% | -1.18 | -0.84 (11) | cisd/3R/vwap trend/frvp off/delta off: -0.76 → 0.54 | 0/10 |
| EURUSD | 365 | 1m-15m | 1723 | 25.6% | -0.45 | 0.38 | -97.7% | 97.7% | -0.41 | -0.54 (583) | retest/liq/vwap trend/frvp level/delta div: -0.13 → -0.95 | 0/10 |
| EURUSD | 365 | 5m-1H | 525 | 36.0% | -0.19 | 0.64 | -39.1% | 40.2% | -0.17 | -0.22 (168) | cisd/2R/vwap trend/frvp level/delta div: 0.27 → -0.21 | 0/10 |
| EURUSD | 365 | 15m-4H | 144 | 36.1% | -0.10 | 0.77 | -6.6% | 11.1% | -0.21 | 0.13 (49) | retest/liq/vwap off/frvp level/delta div: 0.52 → -0.09 | 6/10 |
| GBPUSD | 90 | 1m-15m | 432 | 26.6% | -0.45 | 0.35 | -62.0% | 62.5% | -0.44 | -0.47 (135) | ic/3R/vwap trend/frvp level/delta off: 0.17 → -0.08 | 5/10 |
| GBPUSD | 90 | 5m-1H | 123 | 36.6% | -0.21 | 0.56 | -12.2% | 12.2% | -0.23 | -0.18 (41) | retest/3R/vwap discount/frvp value/delta div: 0.26 → -0.67 | 0/10 |
| GBPUSD | 90 | 15m-4H | 40 | 35.0% | -0.15 | 0.69 | -2.9% | 4.7% | -0.23 | 0.01 (13) | retest/liq/vwap off/frvp value/delta disp: 0.57 → 0.41 | 6/10 |
| AUDUSD | 90 | 1m-15m | 439 | 16.9% | -0.81 | 0.13 | -83.0% | 83.0% | -0.77 | -0.88 (147) | ic/1.5R/vwap discount/frvp value/delta div: -0.38 → -0.93 | 0/10 |
| AUDUSD | 90 | 5m-1H | 110 | 25.4% | -0.45 | 0.30 | -21.7% | 21.9% | -0.49 | -0.33 (34) | retest/liq/vwap trend/frvp off/delta off: -0.32 → -0.75 | 1/10 |
| AUDUSD | 90 | 15m-4H | 34 | 35.3% | -0.11 | 0.74 | -1.9% | 4.6% | -0.24 | 0.13 (12) | cisd/1.5R/vwap discount/frvp off/delta off: -0.14 → 0.11 | 10/10 |

### Delta sources (5m-1H, used as a filter)

| Market | Best in-sample | OOS R with it | OOS R without | Next-3-bar hit rate |
|---|---|---:|---:|---:|
| XAUUSD | Candle-direction (tick rule) · unit · div | -0.03 | 0.02 | 49.7% |
| XAUUSDT | Body / range ratio · unit · div | -1.59 | -1.03 | 48.8% |
| PAXGUSDT | Intrabar tick rule · unit · div | -1.93 | -2.21 | 50.6% |
| EURUSD | Intrabar CLV · broker · div | -0.27 | -0.22 | 48.6% |
| GBPUSD | Candle-direction (tick rule) · unit · div | -0.12 | -0.18 | 49.1% |
| AUDUSD | Body / range ratio · broker · div | -0.06 | -0.33 | 50.1% |

### Deep dive: XAUUSD 1m-15m (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **120 trades, win 29%, avg -0.27R, total -31.80R, max drawdown 31.83R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-13 → 2026-03-13 | → 2026-04-12 | cisd · 2R · vwap off · frvp level · delta div · buf 0.1 | 0.39 (25) | -0.34 (10) |
| 2025-12-13 → 2026-04-12 | → 2026-05-12 | ic · liquidity · vwap discount · frvp off · delta disp · buf 0.1 | 0.36 (17) | 0.02 (10) |
| 2026-01-12 → 2026-05-12 | → 2026-06-11 | ic · 3R · vwap discount · frvp off · delta div · buf 0.1 | 0.22 (70) | -0.40 (25) |
| 2026-02-11 → 2026-06-11 | → 2026-07-11 | cisd · 3R · vwap discount · frvp level · delta div · buf 0.1 | 0.50 (18) | -1.16 (2) |
| 2026-03-13 → 2026-07-11 | → 2026-08-10 | retest · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 0.26 (95) | 0.02 (23) |
| 2026-04-12 → 2026-08-10 | → 2026-09-09 | retest · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 0.20 (106) | -0.31 (26) |
| 2026-05-12 → 2026-09-09 | → 2026-10-09 | cisd · 2SD · vwap off · frvp level · delta disp · buf 0.1 | 0.52 (38) | -0.28 (22) |
| 2026-06-11 → 2026-10-09 | → 2026-11-08 | cisd · liquidity · vwap off · frvp level · delta disp · buf 0.3 | 0.66 (15) | -1.26 (2) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 4/5 | 42 | 36% | 0.21 |
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.3 | 4/5 | 38 | 34% | 0.17 |
| cisd · 2SD · vwap trend · frvp level · delta off · buf 0.1 | 6/8 | 67 | 34% | 0.09 |
| retest · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 6/8 | 271 | 33% | -0.01 |
| retest · liquidity · vwap discount · frvp off · delta div · buf 0.1 | 6/8 | 297 | 29% | -0.06 |
| cisd · liquidity · vwap off · frvp off · delta div · buf 0.3 | 6/8 | 264 | 30% | -0.08 |
| cisd · liquidity · vwap trend · frvp value · delta div · buf 0.3 | 5/7 | 36 | 28% | 0.04 |
| cisd · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 5/7 | 120 | 33% | -0.00 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 1479 | 36% | -0.10 |
| London 07–12 | 1026 | 34% | -0.16 |
| NY overlap 12–16 | 748 | 39% | -0.02 |
| NY afternoon 16–22 | 961 | 35% | -0.19 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 1975 | 39% | -0.12 | -0.11 | -0.14 |
| cisd | 2R | 1960 | 36% | -0.10 | -0.09 | -0.11 |
| cisd | 3R | 1949 | 34% | -0.10 | -0.09 | -0.11 |
| cisd | liquidity | 643 | 29% | -0.10 | -0.09 | -0.12 |
| retest | 1.5R | 2662 | 37% | -0.15 | -0.16 | -0.15 |
| retest | 2R | 2634 | 33% | -0.15 | -0.15 | -0.15 |
| retest | 3R | 2624 | 30% | -0.15 | -0.15 | -0.15 |
| retest | liquidity | 1396 | 27% | -0.17 | -0.16 | -0.19 |
| ic | 1.5R | 1071 | 40% | -0.09 | -0.06 | -0.15 |
| ic | 2R | 1070 | 39% | -0.07 | -0.04 | -0.14 |
| ic | 3R | 1070 | 38% | -0.08 | -0.05 | -0.14 |
| ic | liquidity | 208 | 28% | -0.20 | -0.10 | -0.39 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 1979 | -0.10 | | 0 | 0.02 |
| 15 | 1965 | -0.10 | | 0.5 | -0.04 |
| 30 | 1960 | -0.10 | | 1 | -0.10 |
| 60 | 1946 | -0.10 | | 1.5 | -0.16 |

### Deep dive: XAUUSD 5m-1H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **54 trades, win 24%, avg -0.23R, total -12.34R, max drawdown 14.26R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-13 → 2026-03-13 | → 2026-04-12 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.37 (26) | 0.48 (2) |
| 2025-12-13 → 2026-04-12 | → 2026-05-12 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.38 (28) | -0.05 (3) |
| 2026-01-12 → 2026-05-12 | → 2026-06-11 | cisd · 2SD · vwap off · frvp value · delta div · buf 0.1 | 0.23 (41) | -0.32 (14) |
| 2026-02-11 → 2026-06-11 | → 2026-07-11 | ic · 3R · vwap trend · frvp value · delta off · buf 0.3 | 0.29 (26) | 0.19 (3) |
| 2026-03-13 → 2026-07-11 | → 2026-08-10 | cisd · 2SD · vwap off · frvp level · delta disp · buf 0.3 | 0.47 (18) | -0.31 (3) |
| 2026-04-12 → 2026-08-10 | → 2026-09-09 | ic · 2R · vwap trend · frvp value · delta off · buf 0.3 | 0.66 (20) | -0.02 (6) |
| 2026-05-12 → 2026-09-09 | → 2026-10-09 | retest · liquidity · vwap trend · frvp off · delta div · buf 0.1 | 0.82 (16) | -0.88 (5) |
| 2026-06-11 → 2026-10-09 | → 2026-11-08 | cisd · 2SD · vwap off · frvp off · delta disp · buf 0.1 | 0.29 (92) | -0.21 (18) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.3 | 7/8 | 142 | 44% | 0.06 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.1 | 7/8 | 143 | 42% | 0.06 |
| ic · 2SD · vwap trend · frvp off · delta disp · buf 0.1 | 6/7 | 38 | 47% | 0.29 |
| ic · 2SD · vwap trend · frvp off · delta off · buf 0.1 | 6/7 | 52 | 42% | 0.21 |
| ic · 2R · vwap trend · frvp level · delta off · buf 0.3 | 5/6 | 30 | 40% | 0.21 |
| ic · 1.5R · vwap trend · frvp level · delta off · buf 0.3 | 5/6 | 30 | 43% | 0.20 |
| ic · 2R · vwap trend · frvp level · delta off · buf 0.1 | 5/6 | 30 | 37% | 0.16 |
| ic · 1.5R · vwap trend · frvp level · delta off · buf 0.1 | 5/6 | 30 | 40% | 0.15 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 316 | 33% | -0.08 |
| London 07–12 | 262 | 36% | -0.11 |
| NY afternoon 16–22 | 242 | 46% | 0.02 |
| NY overlap 12–16 | 213 | 40% | 0.04 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 531 | 42% | -0.03 | -0.04 | 0.01 |
| cisd | 2R | 527 | 39% | -0.04 | -0.06 | 0.02 |
| cisd | 3R | 526 | 37% | -0.02 | -0.04 | 0.03 |
| cisd | liquidity | 148 | 24% | -0.15 | -0.22 | -0.04 |
| retest | 1.5R | 687 | 39% | -0.06 | -0.05 | -0.08 |
| retest | 2R | 682 | 34% | -0.08 | -0.06 | -0.12 |
| retest | 3R | 679 | 32% | -0.07 | -0.06 | -0.10 |
| retest | liquidity | 314 | 26% | -0.11 | -0.09 | -0.15 |
| ic | 1.5R | 252 | 40% | -0.04 | -0.10 | 0.08 |
| ic | 2R | 252 | 37% | -0.06 | -0.11 | 0.06 |
| ic | 3R | 252 | 35% | -0.06 | -0.13 | 0.07 |
| ic | liquidity | 44 | 25% | -0.28 | -0.44 | 0.04 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 532 | -0.04 | | 0 | 0.02 |
| 15 | 531 | -0.04 | | 0.5 | -0.01 |
| 30 | 527 | -0.04 | | 1 | -0.04 |
| 60 | 525 | -0.03 | | 1.5 | -0.06 |

### Deep dive: XAUUSD 15m-4H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **33 trades, win 33%, avg 0.03R, total 1.11R, max drawdown 9.70R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-13 → 2026-03-13 | → 2026-04-12 | cisd · 3R · vwap off · frvp level · delta off · buf 0.1 | 0.57 (16) | 1.35 (2) |
| 2025-12-13 → 2026-04-12 | → 2026-05-12 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.1 | 0.92 (15) | 0.43 (3) |
| 2026-01-12 → 2026-05-12 | → 2026-06-11 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.3 | 1.08 (16) | -0.39 (2) |
| 2026-02-11 → 2026-06-11 | → 2026-07-11 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.3 | 1.03 (17) | 0.46 (4) |
| 2026-03-13 → 2026-07-11 | → 2026-08-10 | cisd · 3R · vwap trend · frvp value · delta off · buf 0.3 | 0.88 (15) | -0.52 (2) |
| 2026-04-12 → 2026-08-10 | → 2026-09-09 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.44 (24) | -0.65 (5) |
| 2026-05-12 → 2026-09-09 | → 2026-10-09 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.42 (23) | -0.11 (5) |
| 2026-06-11 → 2026-10-09 | → 2026-11-08 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.1 | 0.39 (22) | 0.09 (10) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| ic · 3R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 40 | 45% | 0.22 |
| ic · 3R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 40 | 45% | 0.20 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 40 | 45% | 0.18 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 40 | 45% | 0.18 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.1 | 5/7 | 40 | 48% | 0.14 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.3 | 5/7 | 40 | 48% | 0.14 |
| cisd · 2R · vwap off · frvp level · delta off · buf 0.1 | 5/8 | 51 | 41% | 0.18 |
| cisd · 3R · vwap trend · frvp off · delta off · buf 0.1 | 5/8 | 75 | 39% | 0.15 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| London 07–12 | 47 | 17% | -0.29 |
| Asia 22–07 | 97 | 44% | 0.14 |
| NY afternoon 16–22 | 73 | 37% | 0.03 |
| NY overlap 12–16 | 45 | 24% | -0.25 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 144 | 34% | -0.10 | -0.04 | -0.22 |
| cisd | 2R | 142 | 29% | -0.11 | -0.03 | -0.29 |
| cisd | 3R | 141 | 26% | -0.12 | 0.00 | -0.38 |
| cisd | liquidity | 46 | 28% | -0.08 | 0.05 | -0.28 |
| retest | 1.5R | 199 | 34% | -0.08 | -0.07 | -0.10 |
| retest | 2R | 197 | 28% | -0.13 | -0.05 | -0.28 |
| retest | 3R | 196 | 25% | -0.16 | -0.06 | -0.35 |
| retest | liquidity | 104 | 27% | -0.07 | 0.10 | -0.41 |
| ic | 1.5R | 67 | 37% | -0.04 | 0.05 | -0.24 |
| ic | 2R | 67 | 33% | -0.04 | 0.05 | -0.25 |
| ic | 3R | 67 | 31% | -0.06 | 0.03 | -0.26 |
| ic | liquidity | 17 | 29% | -0.25 | -0.00 | -1.04 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 144 | -0.11 | | 0 | -0.08 |
| 15 | 144 | -0.11 | | 0.5 | -0.10 |
| 30 | 142 | -0.11 | | 1 | -0.11 |
| 60 | 142 | -0.11 | | 1.5 | -0.12 |

### Deep dive: EURUSD 5m-1H (364 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **42 trades, win 43%, avg -0.08R, total -3.52R, max drawdown 9.49R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-13 → 2026-03-13 | → 2026-04-12 | retest · 2SD · vwap trend · frvp value · delta div · buf 0.3 | 0.17 (23) | -0.66 (3) |
| 2025-12-13 → 2026-04-12 | → 2026-05-12 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.29 (15) | 0.19 (5) |
| 2026-01-12 → 2026-05-12 | → 2026-06-11 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.36 (16) | -0.42 (4) |
| 2026-02-11 → 2026-06-11 | → 2026-07-11 | cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 0.32 (22) | -0.00 (4) |
| 2026-03-13 → 2026-07-11 | → 2026-08-10 | cisd · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.28 (32) | -0.02 (6) |
| 2026-04-12 → 2026-08-10 | → 2026-09-09 | cisd · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.26 (31) | -0.72 (9) |
| 2026-05-12 → 2026-09-09 | → 2026-10-09 | cisd · 3R · vwap trend · frvp value · delta disp · buf 0.1 | 0.13 (37) | 0.49 (7) |
| 2026-06-11 → 2026-10-09 | → 2026-11-08 | retest · liquidity · vwap off · frvp value · delta div · buf 0.3 | 0.40 (18) | 0.58 (4) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| retest · liquidity · vwap off · frvp level · delta div · buf 0.1 | 4/5 | 30 | 37% | -0.21 |
| cisd · 3R · vwap trend · frvp level · delta disp · buf 0.3 | 6/8 | 92 | 43% | 0.05 |
| cisd · 3R · vwap trend · frvp value · delta off · buf 0.1 | 6/8 | 141 | 45% | -0.00 |
| cisd · 2R · vwap trend · frvp level · delta disp · buf 0.3 | 6/8 | 92 | 45% | -0.00 |
| cisd · 2SD · vwap trend · frvp value · delta disp · buf 0.3 | 6/8 | 65 | 49% | -0.01 |
| cisd · 1.5R · vwap trend · frvp level · delta disp · buf 0.3 | 6/8 | 92 | 45% | -0.06 |
| ic · 1.5R · vwap off · frvp level · delta disp · buf 0.1 | 6/8 | 66 | 41% | -0.10 |
| ic · 1.5R · vwap off · frvp level · delta off · buf 0.1 | 6/8 | 71 | 39% | -0.11 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 423 | 31% | -0.34 |
| NY overlap 12–16 | 209 | 37% | -0.17 |
| London 07–12 | 254 | 35% | -0.23 |
| NY afternoon 16–22 | 250 | 31% | -0.25 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 526 | 39% | -0.21 | -0.21 | -0.19 |
| cisd | 2R | 525 | 36% | -0.19 | -0.17 | -0.22 |
| cisd | 3R | 520 | 34% | -0.19 | -0.17 | -0.23 |
| cisd | liquidity | 137 | 28% | -0.41 | -0.42 | -0.37 |
| retest | 1.5R | 716 | 34% | -0.29 | -0.30 | -0.25 |
| retest | 2R | 710 | 30% | -0.28 | -0.28 | -0.29 |
| retest | 3R | 709 | 28% | -0.28 | -0.26 | -0.32 |
| retest | liquidity | 294 | 24% | -0.39 | -0.41 | -0.34 |
| ic | 1.5R | 246 | 39% | -0.17 | -0.21 | -0.10 |
| ic | 2R | 246 | 37% | -0.17 | -0.18 | -0.15 |
| ic | 3R | 245 | 36% | -0.16 | -0.16 | -0.17 |
| ic | liquidity | 31 | 19% | -0.51 | -0.47 | -0.65 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 535 | -0.19 | | 0 | 0.05 |
| 15 | 533 | -0.19 | | 0.5 | -0.07 |
| 30 | 525 | -0.19 | | 1 | -0.19 |
| 60 | 523 | -0.19 | | 1.5 | -0.31 |

### Deep dive: EURUSD 15m-4H (364 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **48 trades, win 46%, avg -0.10R, total -4.59R, max drawdown 10.25R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-13 → 2026-03-13 | → 2026-04-12 | retest · liquidity · vwap off · frvp level · delta off · buf 0.1 | 0.27 (21) | 0.00 (0) |
| 2025-12-13 → 2026-04-12 | → 2026-05-12 | retest · liquidity · vwap off · frvp level · delta off · buf 0.1 | 0.36 (15) | -1.28 (5) |
| 2026-01-12 → 2026-05-12 | → 2026-06-11 | retest · 2R · vwap trend · frvp value · delta off · buf 0.1 | 0.15 (35) | -0.34 (11) |
| 2026-02-11 → 2026-06-11 | → 2026-07-11 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.25 (23) | 0.39 (4) |
| 2026-03-13 → 2026-07-11 | → 2026-08-10 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.49 (18) | 0.48 (5) |
| 2026-04-12 → 2026-08-10 | → 2026-09-09 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.44 (21) | 0.16 (4) |
| 2026-05-12 → 2026-09-09 | → 2026-10-09 | cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.1 | 0.41 (38) | 0.03 (15) |
| 2026-06-11 → 2026-10-09 | → 2026-11-08 | cisd · 1.5R · vwap off · frvp value · delta off · buf 0.1 | 0.32 (44) | 0.15 (4) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 3R · vwap trend · frvp value · delta off · buf 0.3 | 7/7 | 61 | 49% | 0.08 |
| cisd · 2R · vwap trend · frvp value · delta disp · buf 0.1 | 6/6 | 52 | 50% | 0.04 |
| cisd · 3R · vwap trend · frvp value · delta disp · buf 0.3 | 6/6 | 52 | 48% | -0.02 |
| cisd · 2R · vwap trend · frvp value · delta disp · buf 0.3 | 6/6 | 52 | 48% | -0.02 |
| cisd · 3R · vwap trend · frvp value · delta disp · buf 0.1 | 6/6 | 52 | 48% | -0.03 |
| cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.1 | 7/8 | 102 | 48% | -0.00 |
| cisd · 1.5R · vwap discount · frvp value · delta disp · buf 0.1 | 7/8 | 97 | 47% | -0.01 |
| cisd · 3R · vwap off · frvp value · delta off · buf 0.3 | 7/8 | 112 | 39% | -0.02 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 51 | 25% | -0.29 |
| NY afternoon 16–22 | 79 | 43% | -0.09 |
| Asia 22–07 | 84 | 25% | -0.33 |
| London 07–12 | 38 | 37% | 0.06 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 145 | 42% | -0.06 | -0.15 | 0.12 |
| cisd | 2R | 144 | 36% | -0.10 | -0.21 | 0.13 |
| cisd | 3R | 143 | 34% | -0.11 | -0.22 | 0.09 |
| cisd | liquidity | 40 | 35% | 0.09 | -0.05 | 0.25 |
| retest | 1.5R | 236 | 31% | -0.23 | -0.33 | -0.02 |
| retest | 2R | 234 | 26% | -0.25 | -0.35 | -0.02 |
| retest | 3R | 234 | 24% | -0.26 | -0.34 | -0.09 |
| retest | liquidity | 105 | 20% | -0.24 | -0.38 | 0.03 |
| ic | 1.5R | 69 | 38% | -0.17 | -0.21 | -0.09 |
| ic | 2R | 69 | 33% | -0.18 | -0.24 | -0.07 |
| ic | 3R | 69 | 33% | -0.16 | -0.22 | -0.02 |
| ic | liquidity | 15 | 40% | 0.16 | -0.16 | 0.44 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 148 | -0.10 | | 0 | 0.02 |
| 15 | 148 | -0.10 | | 0.5 | -0.04 |
| 30 | 144 | -0.10 | | 1 | -0.10 |
| 60 | 144 | -0.10 | | 1.5 | -0.16 |

A setting is only worth trading if it stays positive out-of-sample with a reasonable number of trades. Ran in 36s.
