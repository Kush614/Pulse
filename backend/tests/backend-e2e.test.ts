import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RuntimeStore } from '../src/contracts.js';

const EMPTY_STORE: RuntimeStore = {
  articles: [],
  events: [],
  signals: [],
  portfolios: [],
  briefings: [],
  memoryEntries: [],
};

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PULSE Test Feed</title>
    <item>
      <title>China rare earth export controls trigger supply fears</title>
      <description>China signals tighter rare earth export control rules for strategic minerals.</description>
      <link>https://example.com/rare-earth</link>
      <pubDate>Sat, 04 Apr 2026 09:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Fed pause keeps rates elevated as inflation cools slowly</title>
      <description>Markets are reassessing real estate and dollar sensitivity after a Fed pause.</description>
      <link>https://example.com/fed-pause</link>
      <pubDate>Sat, 04 Apr 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>OPEC shipping disruption pushes oil risk premium higher</title>
      <description>Oil and freight markets reprice after a new OPEC and shipping disruption warning.</description>
      <link>https://example.com/oil-shipping</link>
      <pubDate>Sat, 04 Apr 2026 11:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

async function writeStore(path: string, store: RuntimeStore) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(store, null, 2), 'utf8');
}

describe.sequential('backend end-to-end flow', () => {
  let tempDir = '';
  let storePath = '';
  let app: Express;
  const originalFetch = globalThis.fetch;
  const originalStorePath = process.env.PULSE_STORE_PATH;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'pulse-backend-e2e-'));
    storePath = join(tempDir, 'runtime-store.json');
    process.env.PULSE_STORE_PATH = storePath;
    vi.resetModules();
    vi.doMock('../src/services/source-catalog.js', () => ({
      loadSourceCatalog: async () => ([
        { name: 'Reuters', url: 'https://example.com/reuters.xml', category: 'markets', lean: 'center', propagandaRisk: 'low' },
        { name: 'BBC', url: 'https://example.com/bbc.xml', category: 'world', lean: 'center', propagandaRisk: 'low' },
        { name: 'Guardian', url: 'https://example.com/guardian.xml', category: 'world', lean: 'left', propagandaRisk: 'medium' },
      ]),
    }));
    vi.doMock('../src/services/market-catalog.js', () => ({
      loadMarketReference: async () => ({
        symbols: [
          { symbol: 'MP', display: 'MP', name: 'MP Materials' },
          { symbol: 'IYR', display: 'IYR', name: 'iShares U.S. Real Estate ETF' },
          { symbol: 'XLE', display: 'XLE', name: 'Energy Select Sector SPDR Fund' },
        ],
        sectors: [],
      }),
    }));
    vi.doMock('../src/services/minimax.js', () => ({
      analyzeClusterWithMinimax: async () => null,
    }));
    const module = await import('../src/app.js');
    app = module.createApp();
  });

  beforeEach(async () => {
    await writeStore(storePath, EMPTY_STORE);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(SAMPLE_RSS, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })));
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    globalThis.fetch = originalFetch;
    if (originalStorePath === undefined) {
      delete process.env.PULSE_STORE_PATH;
    } else {
      process.env.PULSE_STORE_PATH = originalStorePath;
    }
    await rm(tempDir, { recursive: true, force: true });
  });

  it('runs ingest and analyze through the internal endpoints', async () => {
    const ingestResponse = await request(app).post('/api/internal/ingest');
    expect(ingestResponse.status).toBe(200);
    expect(ingestResponse.body.count).toBeGreaterThan(0);
    expect(Array.isArray(ingestResponse.body.articles)).toBe(true);

    const analyzeResponse = await request(app)
      .post('/api/internal/analyze')
      .send({ articles: ingestResponse.body.articles });

    expect(analyzeResponse.status).toBe(200);
    expect(analyzeResponse.body.count).toBe(ingestResponse.body.articles.length);
    expect(Array.isArray(analyzeResponse.body.events)).toBe(true);
    expect(analyzeResponse.body.events.length).toBeGreaterThan(0);
    expect(analyzeResponse.body.events[0]).toHaveProperty('viewpoints');
    expect(analyzeResponse.body.events[0]).toHaveProperty('biasDistribution');
  }, 15000);

  it('runs the refresh-to-delivery flow across all public endpoints', async () => {
    const refreshResponse = await request(app)
      .post('/api/internal/feed/refresh')
      .send({ force: true });
    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.articles.length).toBeGreaterThan(0);
    expect(refreshResponse.body.events.length).toBeGreaterThan(0);

    const signalsRefresh = await request(app)
      .post('/api/internal/signals/refresh')
      .send({ force: true });
    expect(signalsRefresh.status).toBe(200);
    expect(Array.isArray(signalsRefresh.body.signals)).toBe(true);
    expect(signalsRefresh.body.signals.length).toBeGreaterThan(0);

    const briefingRefresh = await request(app)
      .post('/api/internal/briefing/refresh')
      .send({ force: true });
    expect(briefingRefresh.status).toBe(200);
    expect(briefingRefresh.body.briefing).toHaveProperty('transcript');
    expect(briefingRefresh.body.briefing.transcript).toContain('Good morning.');

    const feedResponse = await request(app).get('/api/feed');
    expect(feedResponse.status).toBe(200);
    expect(feedResponse.body.length).toBe(refreshResponse.body.events.length);

    const signalsResponse = await request(app).get('/api/signals');
    expect(signalsResponse.status).toBe(200);
    expect(signalsResponse.body.length).toBe(signalsRefresh.body.signals.length);

    const holdings = [
      { ticker: 'MP', shares: 20, avgCost: 24.5 },
      { ticker: 'IYR', shares: 10, avgCost: 85 },
      { ticker: 'XLE', shares: 8, avgCost: 92 },
    ];

    const portfolioImpact = await request(app)
      .post('/api/portfolio-impact')
      .send({ holdings });
    expect(portfolioImpact.status).toBe(200);
    expect(portfolioImpact.body.totalValue).toBeGreaterThan(0);
    expect(portfolioImpact.body.aggregateRisk).toBeGreaterThan(0);
    expect(portfolioImpact.body.holdings).toHaveLength(3);

    const portfolioAlias = await request(app)
      .post('/api/portfolio')
      .send({ holdings });
    expect(portfolioAlias.status).toBe(200);
    expect(portfolioAlias.body.aggregateRisk).toBe(portfolioImpact.body.aggregateRisk);

    const briefingResponse = await request(app).get('/api/briefing');
    expect(briefingResponse.status).toBe(200);
    expect(briefingResponse.body.transcript).toContain('Good morning.');
    expect(briefingResponse.body.storiesCount).toBeGreaterThan(0);
  }, 15000);
});
