## C2 Edge backtest

1-minute data (days per market in the table). In-sample = first 67% of the period, out-of-sample (OOS) = the rest. Costs included. Default settings (CISD close entry, 2R target, London + NY hours, news blackout).

| Market | Days | Fractal | Trades | Win | Avg R | PF | Net | Max DD | IS R | OOS R (n) | Best optimizer setting IS → OOS | Top-10 robust |
|---|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---|---:|
| XAUUSD | 365 | 1m-15m | 1956 | 36.1% | -0.10 | 0.78 | -59.4% | 62.6% | -0.10 | -0.10 (627) | ic/sd/vwap trend/frvp level/delta off: 0.51 → 0.09 | 2/10 |
| XAUUSD | 365 | 5m-1H | 526 | 38.4% | -0.05 | 0.90 | -9.3% | 14.1% | -0.06 | -0.01 (163) | retest/sd/vwap trend/frvp level/delta div: 0.45 → -0.36 | 6/10 |
| XAUUSD | 365 | 15m-4H | 143 | 30.1% | -0.10 | 0.77 | -6.7% | 8.9% | -0.03 | -0.24 (45) | cisd/3R/vwap trend/frvp value/delta div: 1.20 → -0.27 | 0/10 |
| XAUUSDT | 90 | 1m-15m | 454 | 15.4% | -1.26 | 0.09 | -94.5% | 94.5% | -1.35 | -1.10 (158) | ic/sd/vwap trend/frvp off/delta off: -0.63 → -0.78 | 0/10 |
| XAUUSDT | 90 | 5m-1H | 161 | 18.6% | -0.99 | 0.13 | -55.4% | 55.4% | -1.01 | -0.95 (56) | ic/3R/vwap discount/frvp off/delta div: -0.21 → -0.60 | 0/10 |
| XAUUSDT | 90 | 15m-4H | 56 | 19.6% | -0.66 | 0.18 | -16.9% | 16.9% | -0.69 | -0.59 (17) | retest/liq/vwap off/frvp off/delta div: -0.53 → -1.02 | 0/10 |
| PAXGUSDT | 90 | 1m-15m | 346 | 2.3% | -4.38 | 0.00 | -106.3% | 106.3% | -4.72 | -3.68 (112) | ic/1.5R/vwap trend/frvp value/delta off: -1.48 → -1.74 | 0/10 |
| PAXGUSDT | 90 | 5m-1H | 135 | 8.9% | -2.09 | 0.02 | -76.3% | 76.3% | -2.10 | -2.08 (47) | ic/3R/vwap discount/frvp off/delta off: -0.45 → -1.14 | 0/10 |
| PAXGUSDT | 90 | 15m-4H | 44 | 9.1% | -0.92 | 0.09 | -18.3% | 18.3% | -0.93 | -0.87 (13) | retest/sd/vwap off/frvp value/delta div: -0.62 → -0.92 | 1/10 |
| EURUSD | 365 | 1m-15m | 1729 | 25.6% | -0.45 | 0.37 | -97.7% | 97.7% | -0.41 | -0.53 (577) | cisd/sd/vwap discount/frvp level/delta div: -0.09 → -0.40 | 0/10 |
| EURUSD | 365 | 5m-1H | 528 | 35.6% | -0.19 | 0.63 | -40.2% | 40.5% | -0.19 | -0.21 (166) | retest/liq/vwap trend/frvp level/delta disp: 0.31 → -0.02 | 0/10 |
| EURUSD | 365 | 15m-4H | 146 | 37.0% | -0.10 | 0.77 | -6.8% | 11.0% | -0.20 | 0.10 (50) | retest/liq/vwap off/frvp level/delta div: 0.52 → -0.09 | 7/10 |
| GBPUSD | 90 | 1m-15m | 441 | 25.4% | -0.46 | 0.34 | -63.5% | 64.4% | -0.46 | -0.46 (139) | ic/3R/vwap trend/frvp level/delta off: 0.30 → -0.47 | 0/10 |
| GBPUSD | 90 | 5m-1H | 122 | 36.1% | -0.20 | 0.58 | -11.5% | 11.5% | -0.12 | -0.35 (41) | cisd/2R/vwap discount/frvp value/delta disp: 0.25 → -0.19 | 0/10 |
| GBPUSD | 90 | 15m-4H | 47 | 34.0% | -0.13 | 0.70 | -3.1% | 4.7% | -0.11 | -0.18 (16) | retest/liq/vwap off/frvp value/delta disp: 0.68 → -0.14 | 0/10 |
| AUDUSD | 90 | 1m-15m | 454 | 17.6% | -0.80 | 0.12 | -83.6% | 83.6% | -0.83 | -0.72 (143) | cisd/1.5R/vwap off/frvp level/delta div: -0.36 → -0.88 | 0/10 |
| AUDUSD | 90 | 5m-1H | 117 | 25.6% | -0.44 | 0.31 | -22.7% | 23.4% | -0.43 | -0.45 (40) | retest/3R/vwap trend/frvp value/delta disp: -0.12 → -0.57 | 0/10 |
| AUDUSD | 90 | 15m-4H | 36 | 30.6% | -0.23 | 0.47 | -4.1% | 4.3% | -0.38 | -0.00 (14) | cisd/1.5R/vwap discount/frvp off/delta disp: -0.14 → -0.07 | 0/10 |

### Delta sources (5m-1H, used as a filter)

| Market | Best in-sample | OOS R with it | OOS R without | Next-3-bar hit rate |
|---|---|---:|---:|---:|
| XAUUSD | Candle-direction (tick rule) · unit · div | -0.03 | -0.01 | 49.7% |
| XAUUSDT | Body / range ratio · unit · div | -1.25 | -0.95 | 48.8% |
| PAXGUSDT | Intrabar tick rule · unit · div | -1.99 | -2.08 | 51.1% |
| EURUSD | Intrabar tick rule · broker · div | -0.24 | -0.21 | 49.3% |
| GBPUSD | Candle-direction (tick rule) · unit · div | -0.25 | -0.35 | 49.8% |
| AUDUSD | Body / range ratio · broker · div | -0.55 | -0.45 | 50.9% |

### Deep dive: XAUUSD 1m-15m (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **79 trades, win 28%, avg -0.26R, total -20.88R, max drawdown 20.92R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-20 → 2026-03-20 | → 2026-04-19 | cisd · 2R · vwap off · frvp level · delta div · buf 0.1 | 0.39 (25) | -0.38 (12) |
| 2025-12-20 → 2026-04-19 | → 2026-05-19 | cisd · 2R · vwap discount · frvp level · delta off · buf 0.3 | 0.31 (23) | -0.01 (9) |
| 2026-01-19 → 2026-05-19 | → 2026-06-18 | cisd · 3R · vwap discount · frvp level · delta off · buf 0.3 | 0.39 (26) | -0.23 (7) |
| 2026-02-18 → 2026-06-18 | → 2026-07-18 | cisd · 3R · vwap discount · frvp level · delta div · buf 0.1 | 0.60 (17) | -1.16 (2) |
| 2026-03-20 → 2026-07-18 | → 2026-08-17 | retest · liquidity · vwap discount · frvp off · delta div · buf 0.3 | 0.28 (98) | -0.07 (23) |
| 2026-04-19 → 2026-08-17 | → 2026-09-16 | cisd · 2R · vwap trend · frvp level · delta disp · buf 0.1 | 0.43 (24) | -0.48 (16) |
| 2026-05-19 → 2026-09-16 | → 2026-10-16 | cisd · liquidity · vwap off · frvp level · delta disp · buf 0.1 | 0.73 (17) | -0.25 (9) |
| 2026-06-18 → 2026-10-16 | → 2026-11-15 | cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 0.53 (22) | -0.72 (1) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 6/7 | 42 | 36% | 0.21 |
| cisd · 2SD · vwap trend · frvp level · delta disp · buf 0.3 | 6/7 | 38 | 34% | 0.17 |
| cisd · 2SD · vwap trend · frvp level · delta off · buf 0.1 | 6/8 | 67 | 34% | 0.09 |
| ic · 2SD · vwap off · frvp off · delta off · buf 0.3 | 6/8 | 394 | 40% | 0.02 |
| cisd · liquidity · vwap off · frvp value · delta div · buf 0.3 | 6/8 | 177 | 29% | -0.03 |
| cisd · 2SD · vwap off · frvp level · delta disp · buf 0.3 | 5/7 | 92 | 34% | 0.11 |
| ic · 2SD · vwap off · frvp level · delta off · buf 0.3 | 5/7 | 43 | 44% | 0.09 |
| cisd · liquidity · vwap off · frvp level · delta disp · buf 0.1 | 4/6 | 53 | 36% | 0.10 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 1475 | 36% | -0.10 |
| London 07–12 | 1022 | 34% | -0.16 |
| NY overlap 12–16 | 748 | 39% | -0.02 |
| NY afternoon 16–22 | 951 | 35% | -0.18 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 1971 | 39% | -0.12 | -0.12 | -0.13 |
| cisd | 2R | 1956 | 36% | -0.10 | -0.10 | -0.10 |
| cisd | 3R | 1945 | 34% | -0.10 | -0.10 | -0.09 |
| cisd | liquidity | 642 | 29% | -0.11 | -0.11 | -0.09 |
| retest | 1.5R | 2670 | 37% | -0.15 | -0.16 | -0.15 |
| retest | 2R | 2641 | 33% | -0.15 | -0.15 | -0.15 |
| retest | 3R | 2631 | 30% | -0.15 | -0.15 | -0.16 |
| retest | liquidity | 1403 | 27% | -0.17 | -0.17 | -0.18 |
| ic | 1.5R | 1067 | 40% | -0.09 | -0.06 | -0.15 |
| ic | 2R | 1066 | 39% | -0.07 | -0.04 | -0.13 |
| ic | 3R | 1066 | 37% | -0.08 | -0.05 | -0.14 |
| ic | liquidity | 211 | 28% | -0.18 | -0.12 | -0.31 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 1977 | -0.10 | | 0 | 0.02 |
| 15 | 1962 | -0.10 | | 0.5 | -0.04 |
| 30 | 1956 | -0.10 | | 1 | -0.10 |
| 60 | 1941 | -0.10 | | 1.5 | -0.16 |

### Deep dive: XAUUSD 5m-1H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **29 trades, win 31%, avg 0.03R, total 0.75R, max drawdown 2.36R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-20 → 2026-03-20 | → 2026-04-19 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.37 (26) | -0.03 (3) |
| 2025-12-20 → 2026-04-19 | → 2026-05-19 | retest · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.34 (25) | -0.03 (7) |
| 2026-01-19 → 2026-05-19 | → 2026-06-18 | retest · 2SD · vwap trend · frvp level · delta div · buf 0.1 | 0.42 (15) | -1.12 (1) |
| 2026-02-18 → 2026-06-18 | → 2026-07-18 | ic · 3R · vwap trend · frvp value · delta off · buf 0.3 | 0.28 (25) | 0.36 (5) |
| 2026-03-20 → 2026-07-18 | → 2026-08-17 | ic · 2SD · vwap trend · frvp off · delta disp · buf 0.1 | 0.49 (16) | 2.12 (1) |
| 2026-04-19 → 2026-08-17 | → 2026-09-16 | ic · 3R · vwap trend · frvp value · delta disp · buf 0.1 | 0.64 (17) | -0.01 (4) |
| 2026-05-19 → 2026-09-16 | → 2026-10-16 | ic · 3R · vwap trend · frvp value · delta off · buf 0.1 | 0.70 (20) | -0.04 (6) |
| 2026-06-18 → 2026-10-16 | → 2026-11-15 | cisd · 2SD · vwap trend · frvp level · delta off · buf 0.1 | 0.61 (20) | -0.74 (2) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| retest · 2SD · vwap trend · frvp level · delta disp · buf 0.1 | 7/8 | 54 | 39% | 0.23 |
| ic · 2SD · vwap trend · frvp off · delta disp · buf 0.1 | 6/7 | 38 | 47% | 0.29 |
| ic · 2SD · vwap trend · frvp off · delta off · buf 0.1 | 6/7 | 51 | 43% | 0.23 |
| ic · 1.5R · vwap trend · frvp off · delta div · buf 0.1 | 6/7 | 50 | 46% | 0.18 |
| ic · 1.5R · vwap trend · frvp off · delta div · buf 0.3 | 6/7 | 50 | 44% | 0.13 |
| retest · 2SD · vwap trend · frvp level · delta div · buf 0.1 | 5/6 | 37 | 38% | 0.39 |
| ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 5/6 | 40 | 45% | 0.23 |
| retest · 1.5R · vwap trend · frvp level · delta div · buf 0.1 | 5/6 | 37 | 41% | 0.08 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| Asia 22–07 | 311 | 32% | -0.10 |
| London 07–12 | 260 | 35% | -0.12 |
| NY afternoon 16–22 | 242 | 47% | 0.02 |
| NY overlap 12–16 | 215 | 40% | 0.04 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 529 | 41% | -0.04 | -0.04 | -0.03 |
| cisd | 2R | 526 | 38% | -0.05 | -0.06 | -0.01 |
| cisd | 3R | 525 | 37% | -0.03 | -0.05 | 0.01 |
| cisd | liquidity | 148 | 23% | -0.17 | -0.23 | -0.07 |
| retest | 1.5R | 687 | 38% | -0.07 | -0.05 | -0.12 |
| retest | 2R | 682 | 33% | -0.09 | -0.06 | -0.15 |
| retest | 3R | 679 | 31% | -0.08 | -0.06 | -0.12 |
| retest | liquidity | 312 | 25% | -0.13 | -0.09 | -0.21 |
| ic | 1.5R | 252 | 40% | -0.04 | -0.09 | 0.07 |
| ic | 2R | 252 | 37% | -0.06 | -0.12 | 0.07 |
| ic | 3R | 252 | 35% | -0.07 | -0.14 | 0.09 |
| ic | liquidity | 45 | 24% | -0.27 | -0.45 | 0.11 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 531 | -0.04 | | 0 | 0.01 |
| 15 | 530 | -0.05 | | 0.5 | -0.02 |
| 30 | 526 | -0.05 | | 1 | -0.05 |
| 60 | 524 | -0.04 | | 1.5 | -0.07 |

### Deep dive: XAUUSD 15m-4H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **32 trades, win 28%, avg -0.01R, total -0.35R, max drawdown 10.76R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-20 → 2026-03-20 | → 2026-04-19 | cisd · 3R · vwap off · frvp level · delta off · buf 0.1 | 0.57 (16) | 0.74 (3) |
| 2025-12-20 → 2026-04-19 | → 2026-05-19 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.1 | 0.97 (15) | 0.19 (3) |
| 2026-01-19 → 2026-05-19 | → 2026-06-18 | cisd · 3R · vwap trend · frvp value · delta div · buf 0.3 | 1.19 (15) | 2.99 (1) |
| 2026-02-18 → 2026-06-18 | → 2026-07-18 | cisd · 3R · vwap trend · frvp off · delta div · buf 0.3 | 1.13 (16) | -0.39 (3) |
| 2026-03-20 → 2026-07-18 | → 2026-08-17 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.62 (24) | -1.05 (3) |
| 2026-04-19 → 2026-08-17 | → 2026-09-16 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.44 (24) | -0.12 (6) |
| 2026-05-19 → 2026-09-16 | → 2026-10-16 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.3 | 0.51 (24) | -0.72 (6) |
| 2026-06-18 → 2026-10-16 | → 2026-11-15 | retest · liquidity · vwap off · frvp value · delta disp · buf 0.1 | 0.15 (23) | 0.46 (7) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 3R · vwap off · frvp level · delta off · buf 0.1 | 6/8 | 53 | 38% | 0.23 |
| ic · 3R · vwap trend · frvp off · delta off · buf 0.1 | 6/8 | 39 | 46% | 0.22 |
| ic · 3R · vwap trend · frvp off · delta off · buf 0.3 | 6/8 | 39 | 46% | 0.20 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.1 | 6/8 | 39 | 46% | 0.18 |
| ic · 2R · vwap trend · frvp off · delta off · buf 0.3 | 6/8 | 39 | 46% | 0.18 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.1 | 6/8 | 39 | 49% | 0.15 |
| ic · 1.5R · vwap trend · frvp off · delta off · buf 0.3 | 6/8 | 39 | 49% | 0.14 |
| cisd · 2R · vwap off · frvp level · delta disp · buf 0.3 | 5/7 | 38 | 50% | 0.33 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 46 | 24% | -0.26 |
| NY afternoon 16–22 | 74 | 39% | 0.04 |
| London 07–12 | 46 | 17% | -0.26 |
| Asia 22–07 | 95 | 43% | 0.10 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 145 | 35% | -0.09 | -0.05 | -0.18 |
| cisd | 2R | 143 | 30% | -0.10 | -0.03 | -0.24 |
| cisd | 3R | 142 | 27% | -0.11 | -0.00 | -0.33 |
| cisd | liquidity | 48 | 27% | -0.10 | 0.02 | -0.25 |
| retest | 1.5R | 199 | 34% | -0.08 | -0.09 | -0.05 |
| retest | 2R | 197 | 29% | -0.12 | -0.07 | -0.23 |
| retest | 3R | 196 | 26% | -0.15 | -0.08 | -0.30 |
| retest | liquidity | 106 | 27% | -0.07 | 0.08 | -0.36 |
| ic | 1.5R | 65 | 38% | -0.02 | 0.08 | -0.24 |
| ic | 2R | 65 | 34% | -0.03 | 0.08 | -0.25 |
| ic | 3R | 65 | 32% | -0.04 | 0.06 | -0.26 |
| ic | liquidity | 17 | 29% | -0.25 | -0.00 | -1.04 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 145 | -0.10 | | 0 | -0.07 |
| 15 | 145 | -0.10 | | 0.5 | -0.08 |
| 30 | 143 | -0.10 | | 1 | -0.10 |
| 60 | 142 | -0.10 | | 1.5 | -0.11 |

### Deep dive: EURUSD 5m-1H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **40 trades, win 35%, avg -0.32R, total -12.89R, max drawdown 13.77R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-20 → 2026-03-20 | → 2026-04-19 | retest · 2SD · vwap trend · frvp value · delta div · buf 0.3 | 0.17 (23) | -0.66 (3) |
| 2025-12-20 → 2026-04-19 | → 2026-05-19 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.40 (15) | -0.18 (6) |
| 2026-01-19 → 2026-05-19 | → 2026-06-18 | ic · 2SD · vwap trend · frvp off · delta off · buf 0.3 | 0.30 (17) | -0.33 (3) |
| 2026-02-18 → 2026-06-18 | → 2026-07-18 | cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 0.33 (21) | 0.21 (5) |
| 2026-03-20 → 2026-07-18 | → 2026-08-17 | cisd · 2R · vwap off · frvp level · delta div · buf 0.3 | 0.39 (21) | -0.56 (7) |
| 2026-04-19 → 2026-08-17 | → 2026-09-16 | cisd · 2R · vwap trend · frvp level · delta off · buf 0.1 | 0.18 (31) | -0.62 (11) |
| 2026-05-19 → 2026-09-16 | → 2026-10-16 | cisd · 2SD · vwap trend · frvp value · delta disp · buf 0.1 | 0.22 (22) | 0.34 (2) |
| 2026-06-18 → 2026-10-16 | → 2026-11-15 | retest · liquidity · vwap off · frvp value · delta div · buf 0.3 | 0.51 (18) | 0.07 (3) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 2R · vwap off · frvp level · delta div · buf 0.1 | 6/8 | 72 | 38% | -0.05 |
| retest · liquidity · vwap off · frvp value · delta div · buf 0.3 | 6/8 | 70 | 30% | -0.29 |
| ic · 1.5R · vwap trend · frvp level · delta disp · buf 0.1 | 5/7 | 41 | 39% | -0.12 |
| retest · liquidity · vwap discount · frvp value · delta div · buf 0.3 | 4/6 | 51 | 25% | -0.44 |
| cisd · 3R · vwap trend · frvp level · delta div · buf 0.1 | 5/8 | 38 | 39% | 0.14 |
| cisd · 3R · vwap trend · frvp level · delta div · buf 0.3 | 5/8 | 37 | 41% | 0.14 |
| cisd · 2R · vwap trend · frvp level · delta div · buf 0.3 | 5/8 | 37 | 43% | 0.10 |
| cisd · 2R · vwap trend · frvp level · delta div · buf 0.1 | 5/8 | 38 | 42% | 0.10 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| London 07–12 | 251 | 34% | -0.24 |
| NY overlap 12–16 | 213 | 38% | -0.17 |
| NY afternoon 16–22 | 254 | 30% | -0.28 |
| Asia 22–07 | 429 | 30% | -0.35 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 529 | 39% | -0.21 | -0.23 | -0.17 |
| cisd | 2R | 528 | 36% | -0.19 | -0.19 | -0.21 |
| cisd | 3R | 523 | 33% | -0.19 | -0.18 | -0.22 |
| cisd | liquidity | 136 | 29% | -0.41 | -0.41 | -0.40 |
| retest | 1.5R | 722 | 34% | -0.29 | -0.31 | -0.26 |
| retest | 2R | 716 | 30% | -0.29 | -0.29 | -0.29 |
| retest | 3R | 715 | 27% | -0.29 | -0.27 | -0.34 |
| retest | liquidity | 298 | 24% | -0.40 | -0.40 | -0.40 |
| ic | 1.5R | 244 | 39% | -0.18 | -0.24 | -0.05 |
| ic | 2R | 244 | 37% | -0.18 | -0.21 | -0.11 |
| ic | 3R | 243 | 36% | -0.17 | -0.19 | -0.13 |
| ic | liquidity | 30 | 20% | -0.52 | -0.48 | -0.65 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 540 | -0.20 | | 0 | 0.04 |
| 15 | 538 | -0.20 | | 0.5 | -0.07 |
| 30 | 528 | -0.19 | | 1 | -0.19 |
| 60 | 525 | -0.20 | | 1.5 | -0.31 |

### Deep dive: EURUSD 15m-4H (365 days, 810 settings)

**Walk-forward** (re-pick the best setting on 120 days, trade it on the next 30 unseen days, repeat): **49 trades, win 51%, avg -0.03R, total -1.46R, max drawdown 9.31R.** This is the number to trust.

| Train | Test | Pick | Train R (n) | Test R (n) |
|---|---|---|---:|---:|
| 2025-11-20 → 2026-03-20 | → 2026-04-19 | retest · 3R · vwap trend · frvp value · delta div · buf 0.3 | 0.26 (17) | -0.54 (3) |
| 2025-12-20 → 2026-04-19 | → 2026-05-19 | retest · liquidity · vwap off · frvp value · delta off · buf 0.1 | 0.27 (26) | -0.60 (6) |
| 2026-01-19 → 2026-05-19 | → 2026-06-18 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.1 | 0.24 (22) | -0.23 (9) |
| 2026-02-18 → 2026-06-18 | → 2026-07-18 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.29 (22) | 0.75 (4) |
| 2026-03-20 → 2026-07-18 | → 2026-08-17 | cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 0.48 (17) | 0.16 (7) |
| 2026-04-19 → 2026-08-17 | → 2026-09-16 | cisd · 1.5R · vwap off · frvp value · delta div · buf 0.3 | 0.47 (15) | 0.40 (4) |
| 2026-05-19 → 2026-09-16 | → 2026-10-16 | cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.1 | 0.37 (38) | -0.04 (12) |
| 2026-06-18 → 2026-10-16 | → 2026-11-15 | cisd · 1.5R · vwap off · frvp value · delta off · buf 0.1 | 0.33 (43) | 0.15 (4) |

**Most consistent settings** (positive in the most test windows; picked with hindsight, so treat as candidates):

| Setting | Positive windows | All trades | Win | Avg R |
|---|---:|---:|---:|---:|
| cisd · 1.5R · vwap off · frvp value · delta div · buf 0.1 | 6/6 | 48 | 48% | 0.06 |
| cisd · 1.5R · vwap discount · frvp value · delta div · buf 0.1 | 6/6 | 44 | 45% | -0.00 |
| cisd · 1.5R · vwap off · frvp value · delta off · buf 0.3 | 7/8 | 115 | 49% | 0.07 |
| cisd · 1.5R · vwap discount · frvp value · delta off · buf 0.3 | 7/8 | 109 | 48% | 0.05 |
| cisd · 1.5R · vwap off · frvp value · delta disp · buf 0.3 | 7/8 | 103 | 48% | 0.01 |
| cisd · 1.5R · vwap discount · frvp value · delta disp · buf 0.3 | 7/8 | 98 | 47% | 0.01 |
| cisd · 1.5R · vwap trend · frvp value · delta off · buf 0.3 | 5/6 | 62 | 53% | 0.09 |
| cisd · 1.5R · vwap off · frvp value · delta div · buf 0.3 | 5/6 | 48 | 48% | 0.07 |

**Default settings by session** (all hours traded):

| Session (UTC) | Trades | Win | Avg R |
|---|---:|---:|---:|
| NY overlap 12–16 | 50 | 28% | -0.25 |
| NY afternoon 16–22 | 80 | 44% | -0.08 |
| London 07–12 | 40 | 38% | 0.03 |
| Asia 22–07 | 83 | 25% | -0.33 |

**Entry × target** (default filters):

| Entry | Target | Trades | Win | Avg R | IS R | OOS R |
|---|---|---:|---:|---:|---:|---:|
| cisd | 1.5R | 147 | 43% | -0.06 | -0.14 | 0.11 |
| cisd | 2R | 146 | 37% | -0.10 | -0.20 | 0.10 |
| cisd | 3R | 145 | 34% | -0.11 | -0.22 | 0.08 |
| cisd | liquidity | 40 | 35% | 0.09 | -0.05 | 0.25 |
| retest | 1.5R | 239 | 33% | -0.22 | -0.32 | -0.01 |
| retest | 2R | 237 | 27% | -0.24 | -0.34 | -0.02 |
| retest | 3R | 237 | 25% | -0.25 | -0.34 | -0.06 |
| retest | liquidity | 107 | 21% | -0.23 | -0.39 | 0.08 |
| ic | 1.5R | 72 | 40% | -0.15 | -0.22 | 0.01 |
| ic | 2R | 72 | 36% | -0.16 | -0.26 | 0.03 |
| ic | 3R | 72 | 36% | -0.14 | -0.24 | 0.07 |
| ic | liquidity | 15 | 40% | 0.16 | -0.16 | 0.44 |

**News blackout window** and **cost sensitivity**:

| Blackout ±min | Trades | Avg R |   | Costs × | Avg R |
|---:|---:|---:|---|---:|---:|
| 0 | 150 | -0.10 | | 0 | 0.02 |
| 15 | 150 | -0.10 | | 0.5 | -0.04 |
| 30 | 146 | -0.10 | | 1 | -0.10 |
| 60 | 146 | -0.10 | | 1.5 | -0.17 |

A setting is only worth trading if it stays positive out-of-sample with a reasonable number of trades. Ran in 37s.
