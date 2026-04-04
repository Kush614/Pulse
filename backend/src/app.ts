import cors from 'cors';
import express from 'express';
import { refreshFeedPipeline, runAnalyzeStep, runIngestStep } from './services/feed-pipeline.js';
import {
  getBriefing,
  getFeed,
  getPortfolioImpact,
  getSignals,
} from './services/public-api.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use('/static', express.static('backend/public'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/feed', async (_req, res, next) => {
    try {
      res.json(await getFeed());
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/signals', async (_req, res, next) => {
    try {
      res.json(await getSignals());
    } catch (error) {
      next(error);
    }
  });

  const portfolioHandler = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      res.json(await getPortfolioImpact(req.body));
    } catch (error) {
      next(error);
    }
  };

  app.post('/api/portfolio-impact', portfolioHandler);
  app.post('/api/portfolio', portfolioHandler);

  app.get('/api/briefing', async (_req, res, next) => {
    try {
      const briefing = await getBriefing();
      if (!briefing) {
        res.status(404).json({ error: 'No briefing available' });
        return;
      }
      res.json(briefing);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/internal/ingest', async (_req, res, next) => {
    try {
      const articles = await runIngestStep();
      res.json({ count: articles.length, articles });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/internal/analyze', async (req, res, next) => {
    try {
      const articles = Array.isArray(req.body?.articles) ? req.body.articles : [];
      res.json({ count: articles.length, events: await runAnalyzeStep(articles) });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/internal/feed/refresh', async (req, res, next) => {
    try {
      const force = req.body?.force === true;
      res.json(await refreshFeedPipeline(force));
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown server error',
    });
  });

  return app;
}
