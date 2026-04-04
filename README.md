# Pulse

Real-time news intelligence across web and mobile, with live feed clustering, bias-aware story framing, AI briefings, portfolio context, and a world-monitor dashboard.

Built for the Fontaine Founders Hackathon, April 2026, San Francisco.

## Overview

Pulse combines three product surfaces in one repo:

- `backend/`: the live intelligence API, feed pipeline, briefing engine, story analysis, portfolio impact, and Pulse AI session/chat services.
- `worldmonitor/`: the browser dashboard with large-scale geopolitical, market, infrastructure, and public-data monitoring.
- `mobile/`: the Expo mobile client for real-time briefings, personalized dashboards, live feed drilldown, and source-lens analysis.

This README keeps the original hackathon pitch intact while also documenting what is actually implemented in this branch.

## What Pulse Does

### Hackathon Product Vision

- Bias Radar: compare how the same topic is framed across outlets, with objectivity and bias distribution.
- Multi-perspective consensus: synthesize multiple analytical viewpoints into a balanced read.
- Debate mode: pro and con framing for contentious stories, with optional audio.
- Voice briefing: spoken daily or intraday summaries powered by ElevenLabs.
- Portfolio-aware intelligence: connect active stories to tickers, sectors, and likely market impact.
- Breaking and trending monitoring: continuously surface high-urgency developments.
- Nova or Pulse AI chat: ask follow-up questions against live story context.
- World Monitor dashboard: 36+ public feeds spanning geopolitics, markets, aviation, maritime, cyber, weather, and disasters.

### What Is Implemented In This Repo

- Live feed ingest and clustering through `GET /api/feed`
- Trade signal generation through `GET /api/signals`
- Focus intelligence for sector, ticker, topic, and horizon setup through `GET /api/focus`
- Portfolio dashboard generation through `POST /api/dashboard`
- Personalized briefing generation and briefing chat through `GET /api/briefing` and `POST /api/briefing/chat`
- Story detail pages, framing analysis, and story chat through `GET /api/stories/:storyId` and `POST /api/stories/:storyId/chat`
- Pulse AI session and follow-up chat through `GET|POST /api/pulse-ai` and `POST /api/pulse-ai/chat`
- Portfolio impact scoring through `POST /api/portfolio-impact`
- Expo mobile app with live feed, live briefing, dashboard, story detail, and source lens

## Realtime Mobile App

The mobile app lives in `mobile/` and runs on Expo for iOS, Android, and web.

### Current Mobile Experience

- Splash and onboarding flow
- Focus setup backed by live focus intelligence
- Personalized briefing screen with transcript, audio entry point, and follow-up chat
- Personalized dashboard with holdings, signal strength, focus sectors, and trending stories
- Live feed view filtered by sectors, tickers, and themes
- Story detail screen with framing distribution, integrity score, brief bullets, related tickers, and chat
- Source Lens screen for left, center, and right framing comparison

### Mobile Realtime Data Path

- Focus setup calls `GET /api/focus`
- Feed calls `GET /api/feed`
- Dashboard calls `POST /api/dashboard`
- Briefing calls `GET /api/briefing`
- Briefing follow-up chat calls `POST /api/briefing/chat`
- Story detail calls `GET /api/stories/:storyId`
- Story follow-up chat calls `POST /api/stories/:storyId/chat`

### Mobile Fallback Behavior

If live data or AI providers are unavailable, the mobile app falls back to committed local demo data so the product remains demoable during hackathon judging.

## Architecture

```text
                                 +-----------------------+
                                 |   Mobile App (Expo)   |
                                 |  iOS / Android / Web  |
                                 +-----------+-----------+
                                             |
                                             | live JSON APIs
                                             |
                   +-------------------------v-------------------------+
                   |            Pulse Backend (Express + TS)          |
                   |                  localhost:8787                  |
                   +--------------------+---------------+-------------+
                                        |               |
                           feed ingest  |               | AI / voice / sync
                                        |               |
        +-------------------------------v--+      +----v--------------------+
        | RSS + public source catalogs      |      | Optional integrations   |
        | World Monitor-derived feed data   |      | MiniMax / OpenAI        |
        | Live news and market references   |      | ElevenLabs              |
        +-----------------------------------+      | Memori                 |
                                                   | InsForge mirror        |
                                                   | Alpha Vantage          |
                                                   +------------------------+

                                 +-----------------------+
                                 |  Web Dashboard (Vite) |
                                 |  worldmonitor/:3000   |
                                 +-----------------------+
```

## Tech Stack

### Backend

- Node.js + TypeScript
- Express
- Local runtime store in `backend/data/runtime-store.json`
- Optional InsForge mirroring through `@insforge/sdk`
- Optional MiniMax, OpenAI, ElevenLabs, Memori, and Alpha Vantage integrations

### Web Dashboard

- Vite
- TypeScript
- World Monitor data pipeline and public-source proxies
- Large multi-feed dashboard experience in `worldmonitor/`

### Mobile

- Expo
- React Native
- TypeScript
- Shared live backend contract over HTTP

## Service Integrations

| Service | Role In Pulse | Status |
| --- | --- | --- |
| World Monitor data sources | Public-feed catalogs and dashboard intelligence coverage | Active |
| MiniMax / OpenAI | Briefing chat, story chat, Pulse AI, and embeddings workflows | Optional |
| ElevenLabs | Voice briefing and audio delivery | Optional |
| InsForge | Mirror events, signals, briefings, and portfolio-impact data | Optional |
| Memori | Prompt memory attribution and recall | Optional |
| Alpha Vantage | Live market context for pricing-sensitive flows | Optional |

## Hackathon Tracks

| Track | Why Pulse Fits |
| --- | --- |
| AI news intelligence | Bias-aware feed clustering, briefing, story analysis, and Pulse AI follow-up chat |
| InsForge | Optional mirror and hackathon integration path for backend persistence |
| ElevenLabs | Voice-enabled briefings and audio-first intelligence surfaces |
| General hackathon product | Web dashboard plus mobile app for realtime information delivery |

## Public API

These are the routes implemented by the current backend in this repo.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/api/feed` | Live clustered feed events |
| GET | `/api/signals` | Trade signals generated from active events |
| GET | `/api/focus` | Focus setup intelligence for mobile |
| POST | `/api/dashboard` | Personalized dashboard payload |
| GET, POST | `/api/pulse-ai` | Pulse AI session bootstrap |
| POST | `/api/pulse-ai/chat` | Pulse AI follow-up chat |
| GET | `/api/briefing` | Current personalized briefing |
| POST | `/api/briefing/chat` | Briefing follow-up chat |
| POST | `/api/portfolio-impact` | Portfolio impact analysis |
| POST | `/api/portfolio` | Compatibility alias for portfolio impact |
| GET | `/api/stories/:storyId` | Story detail payload |
| GET | `/api/story/:storyId` | Compatibility alias for story detail |
| POST | `/api/stories/:storyId/chat` | Story-specific chat |
| POST | `/api/story/:storyId/chat` | Compatibility alias for story chat |

### Internal Operator Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/internal/ingest` | Run ingest step |
| POST | `/api/internal/analyze` | Run analyze step |
| POST | `/api/internal/feed/refresh` | Refresh feed pipeline |
| POST | `/api/internal/signals/refresh` | Refresh signals |
| POST | `/api/internal/briefing/refresh` | Refresh briefing |

## Note On Earlier Pitch Endpoints

Earlier hackathon planning referenced routes such as `/api/news`, `/api/bias-radar`, `/api/consensus`, `/api/debate`, and `/api/chat`. In this branch, those ideas are represented through the current feed, story-detail, briefing, Pulse AI, and dashboard contracts listed above.

## Environment

Copy `.env.example` to `.env` at the repo root.

### Backend Variables

```env
PORT=8787
PULSE_STORE_PATH=backend/data/runtime-store.json
PULSE_STRICT_LIVE_MODE=false
OPENAI_API_KEY=
OPENAI_EMBEDDINGS_MODEL=text-embedding-3-small
MINIMAX_API_KEY=
MINIMAX_BASE_URL=https://api.minimax.io/v1
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID=
MEMORI_API_KEY=
ALPHA_VANTAGE_API_KEY=
INSFORGE_BASE_URL=
INSFORGE_ANON_KEY=
INSFORGE_API_KEY=
APIFY_API_KEY=
```

Notes:

- `INSFORGE_URL` is also supported by the backend. If present, it overrides `INSFORGE_BASE_URL`.
- Without provider keys, the app still runs using fallback/demo data.
- Set `PULSE_STRICT_LIVE_MODE=true` if you want live failures to hard-fail instead of falling back.

### Mobile Variable

Set this before starting Expo if your backend is not on the default local URL:

```powershell
$env:EXPO_PUBLIC_PULSE_API_BASE_URL="http://localhost:8787"
```

The mobile app already defaults to `http://localhost:8787` on desktop/web and `http://10.0.2.2:8787` on Android emulators.

## Quick Start

### 1. Install Root and Backend Dependencies

```bash
npm install
npm run sync:worldmonitor-data
```

Optional demo-data seeding:

```bash
npm run seed:demo
```

### 2. Start The Backend

```bash
npm run dev
```

The backend will start on `http://localhost:8787`.

### 3. Start The Web Dashboard

```bash
cd worldmonitor
npm install
npm run dev
```

The web dashboard runs on `http://localhost:3000`.

### 4. Start The Mobile App

```bash
cd mobile
npm install
npm run start
```

Useful Expo commands:

```bash
npm run android
npm run ios
npm run web
npm run typecheck
```

## Quality Checks

### Backend

```bash
npm run typecheck
npm test
npm run build
```

### Mobile

```bash
cd mobile
npm run typecheck
```

### Web Dashboard

```bash
cd worldmonitor
npm run typecheck
```

## Data Flow

1. `npm run sync:worldmonitor-data` ports local source catalogs and feed metadata into `backend/data/`.
2. The backend refreshes live feed events from configured public sources.
3. Feed events are clustered, scored, and written into the runtime store.
4. Signals, dashboard payloads, briefings, story detail pages, and Pulse AI sessions are built from the live event set.
5. The web dashboard and mobile app consume those outputs in real time and fall back gracefully when providers are unavailable.

## Repo Structure

```text
.
|-- backend/
|   |-- src/
|   |   |-- app.ts
|   |   |-- server.ts
|   |   |-- contracts.ts
|   |   `-- services/
|   `-- data/
|-- mobile/
|   |-- App.tsx
|   |-- app.json
|   `-- src/
|       |-- api/
|       |-- features/
|       |-- theme/
|       `-- components/
|-- worldmonitor/
|-- scripts/
|-- docs/
|-- package.json
`-- README.md
```

## Hackathon Positioning

Pulse was designed to compete as:

- AI news intelligence product
- realtime market and geopolitical monitoring tool
- voice-enabled briefing platform
- mobile-first and web-first hackathon demo

The worldmonitor directory extends the World Monitor codebase and preserves its AGPL obligations, while the Pulse backend and mobile experience layer the hackathon-specific intelligence workflow on top.

## License

MIT
