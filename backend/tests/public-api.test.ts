import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

describe('public api', () => {
  const app = createApp();

  it('returns feed events', async () => {
    const response = await request(app).get('/api/feed');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('headline');
    expect(response.body[0]).toHaveProperty('viewpoints');
  });

  it('returns trade signals', async () => {
    const response = await request(app).get('/api/signals');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0]).toHaveProperty('ticker');
  });

  it('returns portfolio impact for both route aliases', async () => {
    const payload = {
      holdings: [{ ticker: 'MP', shares: 10, avgCost: 24.5 }],
    };
    const response = await request(app).post('/api/portfolio-impact').send(payload);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('aggregateRisk');
    expect(response.body.holdings[0]).toHaveProperty('ticker', 'MP');
  });

  it('returns briefing payload', async () => {
    const response = await request(app).get('/api/briefing');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('audioUrl');
    expect(response.body).toHaveProperty('transcript');
  });
});
