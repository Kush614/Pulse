# Pulse — AI-Powered News Intelligence Platform

**Real-time news intelligence with bias detection, multi-perspective consensus, voice briefings, and AI-driven portfolio analysis.**

Built with **InsForge** (Backend-as-a-Service + AI Gateway), **ElevenLabs** (Text-to-Speech), and **36 free public APIs** powering a live geopolitical dashboard.

> Built for the Fontaine Founders Hackathon (April 2026, San Francisco)

---

## What It Does

Pulse is a full-stack intelligence platform that aggregates real-time news from multiple free sources, analyzes bias and credibility using AI, and presents actionable insights through an interactive dashboard.

### Core Features

| Feature | Description |
|---------|-------------|
| **Bias Radar** | Analyzes political lean, emotional tone, sensationalism, and credibility across multiple news sources for any topic |
| **Multi-AI Consensus** | Three AI perspectives (Factual Analyst, Critical Skeptic, Context Expert) analyze the same story independently, then synthesize a balanced view |
| **Debate Mode** | Generates structured pro/con arguments with cited sources and dual-voice audio playback |
| **Voice Briefing** | ElevenLabs-powered audio briefings in 10 languages with full transcript and source list |
| **AI Portfolio Advisor** | Fetches latest news and predicts impact on your portfolio — per-asset direction, confidence, and actionable advice |
| **What Did I Miss** | Personalized catch-up briefings based on your topics since your last visit |
| **Breaking News** | Real-time feed with urgency scoring and browser notifications |
| **Nova Chat** | Streaming AI news analyst with real-time source context — ask anything about current events |
| **World Monitor Dashboard** | Live map with 36+ data feeds: conflicts, markets, crypto, aviation, maritime, cyber threats, earthquakes, weather, and more |

---

## Architecture

```
                        ┌──────────────────────────────────────┐
                        │          Frontend (Vite + TS)         │
                        │     World Monitor Dashboard + Nova    │
                        │        localhost:3000                 │
                        └──────────┬───────────────────────────┘
                                   │ /nova proxy
                        ┌──────────▼───────────────────────────┐
                        │       Nova Backend (Express + TS)     │
                        │         localhost:3001                │
                        ├───────────────────────────────────────┤
                        │                                       │
  ┌─────────────────┐   │   ┌─────────────┐  ┌──────────────┐  │
  │  Google News RSS │◄──┤   │  InsForge    │  │  ElevenLabs  │  │
  │  GDELT API      │   │   │  AI Gateway  │  │  TTS API     │  │
  │  Hacker News    │   │   │  (GPT-4o-m)  │  │  (10 langs)  │  │
  │  Reddit JSON    │   │   └──────┬───────┘  └──────────────┘  │
  │  CoinGecko      │   │          │                             │
  └─────────────────┘   │   ┌──────▼───────┐                    │
                        │   │  InsForge DB  │                    │
  36 Free Public APIs   │   │  (Postgres)   │                    │
  (Yahoo, USGS, NOAA,  │   │  Auth, Storage│                    │
   OpenSky, ACLED...)   │   └──────────────┘                    │
                        └───────────────────────────────────────┘
```

---

## Tech Stack

### Backend (`/server`)
- **Runtime:** Node.js + TypeScript (tsx)
- **Framework:** Express with CORS, SSE streaming
- **AI Gateway:** InsForge AI Gateway → OpenAI GPT-4o-mini (routed via OpenRouter to 100+ models)
- **Database:** InsForge Postgres (articles, bias scores, reports, user preferences, query history, breaking news)
- **Authentication:** InsForge Auth (signup/login with JWT tokens)
- **TTS:** ElevenLabs API with multilingual v2 model, dual-voice debate audio
- **News Sources:** Google News RSS, GDELT, Hacker News Algolia, Reddit JSON API, CoinGecko

### Frontend (`/worldmonitor`)
- **Build:** Vite + TypeScript (vanilla, no framework)
- **UI:** Panel-based dashboard with drag/drop, resize, maximize/fullscreen
- **Data:** 36+ free APIs for live geopolitical intelligence (conflicts, markets, aviation, maritime, cyber, weather, seismic)
- **Proxy:** Vite dev proxy `/nova` → `localhost:3001`

### Services Used
| Service | Purpose | Tier |
|---------|---------|------|
| **InsForge** | Database, Auth, AI Gateway, Storage | Free |
| **ElevenLabs** | Text-to-Speech (voice briefings, debates) | Free tier |
| **Google News RSS** | News aggregation | Free, no key |
| **GDELT** | Geopolitical event analysis | Free, no key |
| **Hacker News** | Tech news | Free, no key |
| **Reddit** | Social signals | Free, no key |
| **CoinGecko** | Crypto prices | Free, no key |
| + 30 more | See worldmonitor data feeds | Free |

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### News & Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/news` | Fetch news from selected sources |
| POST | `/api/bias-radar` | Bias analysis across sources for a topic |
| POST | `/api/consensus` | Multi-perspective AI consensus analysis |
| POST | `/api/debate` | Generate pro/con debate with optional audio |
| POST | `/api/chat` | Streaming SSE chat with real-time news context |
| POST | `/api/chat/sync` | Non-streaming chat fallback |

### Voice & Audio
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/briefing/voice` | Generate voice briefing (10 languages) |
| POST | `/api/tts` | Raw text-to-speech |

### Portfolio & Intelligence
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/portfolio-advisor` | AI-driven news impact on portfolio |
| GET | `/api/catchup` | "What Did I Miss" personalized briefing |
| GET | `/api/breaking` | Recent breaking news |
| POST | `/api/breaking` | Push breaking news alert |
| GET | `/api/trending` | Trending queries |
| GET | `/api/reports` | User's saved reports |
| GET | `/health` | Service health check |

---

## Quick Start

### Prerequisites
- Node.js 20+
- npm

### 1. Clone & Install

```bash
git clone https://github.com/Kush614/Pulse.git
cd Pulse

# Install backend
cd server
npm install

# Install frontend
cd ../worldmonitor
npm install
```

### 2. Configure Environment

```bash
# Copy example env
cp server/.env.example server/.env
```

Edit `server/.env` with your keys:

```env
# InsForge (required — get from https://insforge.com)
INSFORGE_URL=https://your-project.us-east.insforge.app
INSFORGE_API_KEY=your_anon_jwt
INSFORGE_SERVICE_KEY=ik_your_service_key

# ElevenLabs (required for voice features)
ELEVENLABS_API_KEY=sk_your_key
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb

# Optional
APIFY_API_KEY=your_key
EXA_API_KEY=your_key

# Server
PORT=3001
```

### 3. Create Database Tables

The backend uses InsForge Postgres. Create these tables via the InsForge dashboard or API:

- `articles` �� title, url, source, snippet, published_at, category, metadata
- `bias_scores` — article_id, political_lean, emotional, opinion_ratio, sensationalism, source_credibility, model_used, reasoning
- `reports` — user_id, query, synthesis, sources, consensus, bias_summary, audio_url
- `user_preferences` — user_id, topics, language, voice_enabled, briefing_style, last_seen_at
- `query_history` — user_id, query, report_id
- `breaking_news` — article_id, headline, urgency, regions

### 4. Run

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd worldmonitor
npm run dev
```

Open **http://localhost:3000** — the full dashboard with all Nova panels loads automatically.

---

## Dashboard Panels

### Nova AI Panels (New)
- **Nova Chat** — Ask anything, get AI-analyzed answers with cited real-time sources
- **Bias Radar** — Enter a topic, see bias analysis across all sources with political spectrum visualization
- **Multi-AI Consensus** — Three AI perspectives independently analyze the same story
- **Debate Mode** — Structured pro/con arguments with audio playback
- **Voice Briefing** — Audio news briefings in English, Spanish, French, German, Japanese, Korean, Chinese, Hindi, Arabic, Portuguese
- **What Did I Miss** — Catch up on news since your last visit
- **Breaking News** — Live feed with urgency-based color coding and browser notifications
- **AI Portfolio Advisor** — Edit your portfolio, get per-asset impact predictions based on latest news

### World Monitor Panels (Existing 36+ feeds)
- Geopolitical conflicts (ACLED, UCDP, GDELT)
- Financial markets (Yahoo Finance, CoinGecko, Polymarket)
- Aviation tracking (OpenSky, FAA)
- Maritime intelligence (USNI Fleet Tracker)
- Cyber threats (Feodo, URLhaus, AlienVault OTX, AbuseIPDB)
- Natural disasters (USGS earthquakes, NASA FIRMS fires, NOAA weather)
- Humanitarian data (UNHCR, World Bank)
- Tech news (Hacker News, ArXiv)
- And more...

### Panel Controls
- **Maximize** — Click the expand icon on any panel header to go fullscreen (Escape to exit)
- **Resize** — Drag bottom/right edges to resize
- **Drag & Drop** — Reorder panels by dragging headers
- **Scroll** — All panel content is scrollable

---

## Hackathon Tracks

| Track | Prize | How Pulse Qualifies |
|-------|-------|-------------------|
| **Going Merry AI News** | $1,000 | Full AI news platform with bias detection, consensus, debate, and voice briefings |
| **InsForge** | $500 | Uses InsForge DB (6 tables), Auth (JWT), AI Gateway (GPT-4o-mini), and Storage |
| **ElevenLabs** | $2,000 value | Voice briefings in 10 languages, dual-voice debate audio, breaking news alerts |
| **General** | $700 | Novel portfolio advisor + world intelligence dashboard |

---

## Project Structure

```
Pulse/
├── server/                    # Nova News Backend
│   ├── src/
│   │   ├── index.ts          # Express server, 18 API routes
│   │   ├── insforge.ts       # InsForge REST client (DB, Auth, AI, Storage)
│   │   ├── scrapers.ts       # Google News RSS, GDELT, HN, Reddit, CoinGecko
│   │   ├── bias.ts           # Bias Radar, Multi-Model Consensus, Debate Mode
│   │   ├── elevenlabs.ts     # TTS, voice briefings, debate audio
│   │   └── types.ts          # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── worldmonitor/              # Frontend Dashboard
│   ├── src/
│   │   ├── app/
│   │   │   └── panel-layout.ts    # Panel registration & grid layout
│   │   ├── components/
│   │   │   ├── Panel.ts           # Base panel class (maximize, resize, drag)
│   │   │   ├── ChatbotPanel.ts    # Nova AI Chat (streaming SSE)
│   │   │   ├── BiasRadarPanel.ts  # Bias analysis visualization
│   │   │   ├── ConsensusPanel.ts  # Multi-AI consensus view
│   │   │   ├── DebateModePanel.ts # Pro/con debate with audio
│   │   │   ├── VoiceBriefingPanel.ts    # Multilingual voice briefings
│   │   │   ├── CatchUpPanel.ts          # "What Did I Miss"
│   │   │   ├── BreakingNewsRealtimePanel.ts  # Live breaking feed
│   │   │   └── PortfolioAdvisorPanel.ts      # AI portfolio impact
│   │   └── styles/
│   │       └── main.css           # Panel maximize CSS
│   ├── vite.config.ts             # Dev proxy /nova -> :3001
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## License

MIT
