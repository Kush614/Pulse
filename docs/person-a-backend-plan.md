# Person A Backend Plan — WorldMonitor-Informed PULSE

## Goal

Build PULSE's backend as a standalone InsForge project. Port WorldMonitor's **data assets** (feed URLs, propaganda risk scores, threat keywords, stock/sector data) as static JSON configs. Build your own edge functions that use these configs. Frontend never touches WorldMonitor.

---

## What to Port (Copy as Static Data)

| WorldMonitor Source | PULSE Destination | What You Get |
|---|---|---|
| `src/config/feeds.ts` lines 296-424 (finance + geopolitics feeds) | `backend/data/sources.json` | ~60 curated RSS URLs with source names |
| `SOURCE_PROPAGANDA_RISK` (lines 112-145) | `backend/data/sources.json` (merged) | Bias baseline: low/medium/high per source + state affiliation |
| `src/services/threat-classifier.ts` keywords | `backend/data/urgency-keywords.json` | 200+ keywords across 4 severity tiers |
| `shared/stocks.json` + `shared/sectors.json` | `backend/data/market-reference.json` | 50 tickers + 12 sector ETFs for portfolio mapping |
| RSS caching pattern (30min TTL, failure cooldown) | Edge function design | Architecture pattern, not code |

---

## What to Build Fresh in InsForge

| Edge Function | Core Logic | WorldMonitor Pattern Used |
|---|---|---|
| `/ingest` | Fetch RSS, parse XML, store articles | WM's fetch+parse flow, but simplified (no multi-lang, no geo-hub) |
| `/analyze` | Minimax bias score + summary per event | WM's propaganda risk as baseline, Minimax for fine-grained scoring |
| `/signals` | Claude generates trade signals from events + patterns | Fresh — WM doesn't have this |
| `/briefing` | Build script from top events, call ElevenLabs TTS | Fresh — WM doesn't have this |
| `/portfolio` | Cross-reference holdings with event sector impacts | Uses WM's sector ETF mapping as reference |

---

## Integration Boundary (Strict)

```
Frontend (React)
    |
    v ONLY these 4 endpoints
+----------------------------+
|  GET  /api/feed            |
|  GET  /api/signals         |
|  POST /api/portfolio       |
|  GET  /api/briefing        |
+-----------+----------------+
            |
    InsForge Edge Functions
            |
    +-------+-------+
    |  InsForge DB  | <-- events, signals, portfolios
    +---------------+
            |
    External APIs (Minimax, Claude, ElevenLabs, RSS feeds)
```

Frontend imports ZERO from WorldMonitor. No shared types, no shared components, no shared API client.

---

## Fallback Strategy (Demo Resilience)

| Fallback | Contents | When Used |
|---|---|---|
| `backend/data/cached-events.json` | 10 pre-processed news events with full bias/viewpoint data | `/api/feed` if RSS + Minimax pipeline fails |
| `backend/data/cached-signals.json` | 10 pre-built trade signals | `/api/signals` if Claude call fails |
| `backend/data/cached-briefings/` | 5 pre-generated audio files + transcripts | `/api/briefing` if ElevenLabs fails |

Edge functions check live pipeline first, fall back to cached data on any error. Demo never breaks.

---

## Files to Create

```
pulse/
├── backend/
│   ├── data/
│   │   ├── sources.json              <-- Ported from WM feeds.ts + propaganda risk
│   │   ├── urgency-keywords.json     <-- Ported from WM threat-classifier.ts
│   │   ├── market-reference.json     <-- Ported from WM stocks.json + sectors.json
│   │   ├── patterns.json             <-- Person C creates (50 historical patterns)
│   │   ├── cached-events.json        <-- Pre-generated feed response
│   │   ├── cached-signals.json       <-- Pre-generated signals response
│   │   └── cached-briefings/         <-- Pre-generated audio + transcripts
│   └── edge-functions/
│       ├── ingest.ts                 <-- RSS fetch + parse + store
│       ├── analyze.ts                <-- Minimax bias + summary + viewpoints
│       ├── signals.ts                <-- Claude trade signal generation
│       ├── briefing.ts               <-- ElevenLabs TTS generation
│       └── portfolio.ts              <-- Holdings impact calculation
```

---

## Steps (Person A's 6-Hour Timeline)

### Hour 0-0.5: InsForge Setup
- Create InsForge project via `insforge.dev/promo/FONTAINE`
- DB schema: `events`, `signals`, `portfolios` tables (skip `users`/`articles` for now)

### Hour 0.5-1: Port WorldMonitor Data
- Extract feed URLs + propaganda risk -> `sources.json`
- Extract threat keywords -> `urgency-keywords.json`
- Extract stocks + sectors -> `market-reference.json`

### Hour 1-2.5: Build `/api/feed`
- Pre-ingest 15 articles manually or via script
- Run through Minimax for bias scoring + summary
- Store processed events in InsForge DB
- Endpoint reads from DB, returns API contract shape

### Hour 2.5-3.5: Build `/api/signals` (Hero Feature)
- Claude prompt with: event summary + sector data + historical patterns
- Returns structured JSON: action, ticker, rationale, expectedMove, confidence, timeframe, historicalMatch
- Store in InsForge `signals` table

### Hour 3.5-4.5: Build `/api/portfolio`
- Accept holdings array, cross-reference with event sector impacts
- Compute per-holding exposure score
- Math-heavy, minimal AI needed

### Hour 4.5-5: Build `/api/briefing`
- Generate briefing script from top 5 events
- Call ElevenLabs TTS, return audio URL + transcript

### Hour 5-6: Fallbacks + Integration
- Pre-generate all cached fallback JSON/audio
- Wire frontend to live endpoints (replace mock data)
- End-to-end test

---

## WorldMonitor Data Available for Porting

### Feed Sources (from `src/config/feeds.ts`)

**Finance feeds (~56 total across 14 categories):**
- markets: CNBC, MarketWatch, Yahoo Finance, Seeking Alpha, Reuters Markets, Bloomberg Markets, Investing.com, Nikkei Asia
- forex: Forex News, Dollar Watch, Central Bank Rates
- bonds: Bond Market, Treasury Watch, Corporate Bonds
- commodities: Oil & Gas, Gold & Metals, Agriculture, Commodity Trading
- crypto: CoinDesk, Cointelegraph, The Block, Crypto News, DeFi News
- centralbanks: Federal Reserve, ECB Watch, BoJ Watch, BoE Watch, PBoC Watch, Global Central Banks
- economic: Economic Data, Trade & Tariffs, Housing Market
- ipo: IPO News, Earnings Reports, M&A News
- derivatives: Options Market, Futures Trading
- fintech: Fintech News, Trading Tech, Blockchain Finance
- regulation: SEC, Financial Regulation, Banking Rules, Crypto Regulation
- institutional: Hedge Fund News, Private Equity, Sovereign Wealth
- analysis: Market Outlook, Risk & Volatility, Bank Research

**Geopolitical feeds (representative):**
- BBC World, Guardian World, AP News, Reuters World, CNN World
- NPR, WSJ, Politico, Fox News, Axios
- France 24, EuroNews, DW News, Le Monde
- Al Jazeera, Al Arabiya, Haaretz, Arab News
- SCMP, Nikkei Asia, The Diplomat

### Propaganda Risk Database (from `SOURCE_PROPAGANDA_RISK`)

**HIGH RISK (State-controlled):**
| Source | State | Note |
|---|---|---|
| Xinhua | China | Official CCP news agency |
| TASS | Russia | Russian state news agency |
| RT | Russia | Russian state media, banned in EU |
| CGTN | China | Chinese state broadcaster |
| Press TV | Iran | Iranian state media |
| KCNA | North Korea | North Korean state media |
| Sputnik | Russia | Russian state media |

**MEDIUM RISK (State-affiliated or known bias):**
| Source | Affiliation | Note |
|---|---|---|
| Al Jazeera | Qatar | Qatari state-funded, independent editorial |
| Al Arabiya | Saudi Arabia | Saudi-owned, reflects Gulf perspective |
| TRT World | Turkey | Turkish state broadcaster |
| France 24 | France | French state-funded, editorially independent |
| DW News | Germany | German state-funded, editorially independent |
| Voice of America | USA | US government-funded |
| Kyiv Independent | Pro-Ukraine | Ukrainian perspective on Russia-Ukraine war |
| Moscow Times | Anti-Kremlin | Independent, critical of Russian government |

**LOW RISK (Independent with editorial standards):**
| Source | Note |
|---|---|
| Reuters | Wire service, strict editorial standards |
| AP News | Wire service, nonprofit cooperative |
| AFP | Wire service, editorially independent |
| BBC World | Public broadcaster, editorial independence charter |
| Guardian World | Center-left bias, Scott Trust ownership |
| Financial Times | Business focus, Nikkei-owned |
| Bellingcat | Open-source investigations, methodology transparent |
| Le Monde | French newspaper of record |

### Threat/Urgency Keywords (from `threat-classifier.ts`)

**CRITICAL (102 keywords):** nuclear strike, nuclear attack, nuclear war, invasion, declaration of war, declares war, all-out war, full-scale war, genocide, ethnic cleansing, martial law, coup, coup attempt, massive strikes, military strikes, retaliatory strikes, chemical attack, biological attack, dirty bomb, pandemic declared, health emergency, NATO article 5, evacuation order, meltdown, nuclear meltdown

**HIGH (53 keywords):** war, armed conflict, airstrike, airstrikes, drone strike, drone strikes, missile, missile launch, missiles fired, troops deployed, military escalation, ground offensive, bombing, bombardment, shelling, casualties, killed in, hostage, terrorist, terror attack, assassination, cyber attack, ransomware, data breach, sanctions, embargo, earthquake, tsunami, hurricane, typhoon, explosions

**MEDIUM (34 keywords):** protest, protests, riot, riots, unrest, demonstration, strike action, military exercise, naval exercise, arms deal, weapons sale, diplomatic crisis, ambassador recalled, expel diplomats, trade war, tariff, recession, inflation, market crash, flood, flooding, wildfire, volcano, eruption, outbreak, epidemic, infection spread, oil spill, pipeline explosion, blackout, power outage, internet outage, derailment

**LOW (27 keywords):** election, vote, referendum, summit, treaty, agreement, negotiation, talks, peacekeeping, humanitarian aid, ceasefire, peace treaty, climate change, emissions, pollution, deforestation, drought, vaccine, vaccination, disease, virus, public health, covid, interest rate, gdp, unemployment, regulation

**EXCLUSION LIST (22 terms):** protein, couples, relationship, dating, diet, fitness, recipe, cooking, shopping, fashion, celebrity, movie, tv show, sports, game, concert, festival, wedding, vacation, travel tips, life hack, self-care, wellness, strikes deal, strikes agreement, strikes partnership

### Market Reference Data (from `shared/`)

**Stock Symbols (50 total, first 20):**
SPX (^GSPC), DOW (^DJI), NDX (^IXIC), AAPL, MSFT, NVDA, GOOGL, AMZN, META, BRK.B, TSLA, JPM, V, UNH, JNJ, WMT, PG, XOM, HD, MA

**Sector ETFs (12 total):**
| ETF | Sector |
|---|---|
| XLK | Technology |
| XLF | Financials |
| XLE | Energy |
| XLV | Health Care |
| XLY | Consumer Discretionary |
| XLI | Industrials |
| XLP | Consumer Staples |
| XLU | Utilities |
| XLB | Materials |
| XLRE | Real Estate |
| XLC | Communication Services |
| SMH | Semiconductors |

---

## Legal Note

WorldMonitor is AGPL-3.0. For the hackathon prototype: porting curated data (feed URLs, keyword lists) as static config is fine — URLs are facts, not copyrightable expression. If PULSE goes commercial post-hackathon, re-derive the data independently or negotiate the commercial license noted in WorldMonitor's README.
