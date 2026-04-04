# PULSE Backend

Person A backend implementation for the PULSE hackathon build.

## What is shipped

- `GET /api/feed`
  Live RSS ingest, event clustering, objectivity scoring, bias distribution, viewpoint synthesis, sector impact, related tickers.
- `GET /api/signals`
  Trade signals generated from active events plus historical pattern matches, with Claude refinement when configured.
- `POST /api/portfolio-impact`
  Portfolio exposure scoring using direct ticker matches, sector matches, and active signals.
- `GET /api/briefing`
  Daily voice-briefing payload with transcript and generated audio URL when ElevenLabs is configured.

The frontend integration boundary is fixed at those four routes.

## Internal routes

- `POST /api/internal/ingest`
- `POST /api/internal/analyze`
- `POST /api/internal/feed/refresh`
- `POST /api/internal/signals/refresh`
- `POST /api/internal/briefing/refresh`

These are backend/operator routes. The frontend should not call them.

## Data flow

1. `npm run sync:worldmonitor-data`
   Ports curated feed URLs, propaganda-risk metadata, urgency keywords, and market reference data from the local `worldmonitor/` copy into `backend/data/`.
2. `POST /api/internal/feed/refresh`
   Fetches RSS feeds, parses articles, deduplicates, clusters related coverage, and stores the top events.
3. `POST /api/internal/signals/refresh`
   Generates trade signals from the active events and historical patterns.
4. `POST /api/internal/briefing/refresh`
   Builds the transcript and optionally synthesizes audio through ElevenLabs.

## Memory layer

PULSE uses two memory layers:

- Local process memory in `runtime-store.json`
  This stores recent articles, events, signals, briefings, and execution notes for the app itself.
- Memori, when `MEMORI_API_KEY` is configured
  The MiniMax and Claude clients are wrapped with Memori attribution so feed-analysis and signal-generation prompts can be remembered and recalled across runs.

Memori is optional at runtime. Without `MEMORI_API_KEY`, the backend still works and falls back to local process memory only.

## InsForge integration

The backend runs locally by default with a file-backed store. If `INSFORGE_URL` and `INSFORGE_API_KEY` are configured, the backend also mirrors:

- `events`
- `signals`
- `briefings`
- `portfolio_impacts`

to InsForge via `@insforge/sdk`.

## Environment

Copy `.env.example` to `.env` and set the keys you have.

Important variables:

- `MINIMAX_API_KEY`
- `CLAUDE_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `MEMORI_API_KEY`
- `INSFORGE_URL`
- `INSFORGE_API_KEY`

## Commands

```bash
npm install
npm run sync:worldmonitor-data
npm run seed:demo
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm test
npm run build
```

## Notes for integration

- `POST /api/portfolio` is kept as a compatibility alias for `POST /api/portfolio-impact`.
- If live AI providers fail or are not configured, the backend falls back to committed demo data in `backend/data/`.
- The RSS feed pipeline is real and currently ingests from the generated WorldMonitor-derived source catalog.
