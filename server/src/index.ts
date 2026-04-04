// ============================================================
// Nova News — Express Server (All Routes)
// ============================================================

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  dbSelect, dbInsert, dbUpdate,
  authSignUp, authLogin, authGetUser,
  aiChat, aiChatStream, aiEmbedding,
  publishBreakingNews, storageGetPublicUrl,
} from './insforge.js';
import { fetchAllSources, fetchNews, fetchGdelt, fetchHackerNews, searchExa, fetchTweets, fetchReddit, fetchFinance } from './scrapers.js';
import { biasRadar, multiModelConsensus, generateDebate, analyzeBias } from './bias.js';
import { generateBriefingAudio, generateDebateAudio, generateBreakingAlert, generateMultiLangBriefing, textToSpeech } from './elevenlabs.js';
import type { Article, Report, UserPreferences } from './types.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ─── Middleware: extract auth token ──────────────────────────

function getToken(req: express.Request): string | undefined {
  return req.headers.authorization?.replace('Bearer ', '');
}

async function getUser(req: express.Request) {
  const token = getToken(req);
  if (!token) return null;
  try {
    return await authGetUser(token);
  } catch {
    return null;
  }
}

// =============================================================
// AUTH ROUTES
// =============================================================

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, topics } = req.body;
    const result = await authSignUp(email, password);
    // Create default preferences
    if (result.user?.id) {
      await dbInsert('user_preferences', {
        user_id: result.user.id,
        topics: topics || ['world', 'tech', 'finance'],
        language: 'en',
        voice_enabled: true,
        briefing_style: 'concise',
      });
    }
    res.json(result);
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authLogin(email, password);
    // Update last_seen
    if (result.user?.id) {
      await dbUpdate('user_preferences', `user_id=eq.${result.user.id}`, {
        last_seen_at: new Date().toISOString(),
      }).catch(() => {});
    }
    res.json(result);
  } catch (e: any) {
    res.status(401).json({ error: e.message });
  }
});

app.get('/api/auth/me', async (req, res) => {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json(user);
});

// =============================================================
// USER PREFERENCES
// =============================================================

app.get('/api/preferences', async (req, res) => {
  try {
    const token = getToken(req);
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const prefs = await dbSelect<UserPreferences>('user_preferences', `user_id=eq.${user.id}`, token);
    res.json(prefs[0] || { topics: ['world', 'tech', 'finance'], language: 'en', voice_enabled: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/preferences', async (req, res) => {
  try {
    const token = getToken(req);
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    const updated = await dbUpdate('user_preferences', `user_id=eq.${user.id}`, req.body, token);
    res.json(updated[0] || req.body);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// NEWS + BIAS RADAR
// =============================================================

// Fetch news with bias analysis
app.post('/api/news', async (req, res) => {
  try {
    const { query, sources = ['news', 'exa'] } = req.body;

    // Fetch from selected sources in parallel
    const fetchers: Promise<Article[]>[] = [];
    if (sources.includes('news')) fetchers.push(fetchNews(query, 8));
    if (sources.includes('exa')) fetchers.push(searchExa(query, 8, 'news'));
    if (sources.includes('twitter')) fetchers.push(fetchTweets(query, 5));
    if (sources.includes('reddit')) fetchers.push(fetchReddit(query, 5));
    if (sources.includes('finance')) fetchers.push(fetchFinance(query));

    const results = await Promise.allSettled(fetchers);
    const articles: Article[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') articles.push(...r.value);
    }

    // Store articles in InsForge DB
    const stored = await storeArticles(articles);

    res.json({ articles: stored, count: stored.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Bias Radar — analyze bias across sources for a topic
app.post('/api/bias-radar', async (req, res) => {
  try {
    const { query } = req.body;

    // Fetch from multiple sources
    const articles = await fetchAllSources(query);

    // Store articles
    const stored = await storeArticles(articles);

    // Analyze bias for each article
    const radar = await biasRadar(stored.slice(0, 10));

    // Store bias scores
    for (const r of radar) {
      for (const score of r.scores) {
        if (r.article.id) {
          score.article_id = r.article.id;
          await dbInsert('bias_scores', score as any).catch(() => {});
        }
      }
    }

    // Compute aggregate bias summary
    const leans = radar.map(r => r.avg.political_lean);
    const avgLean = leans.reduce((a, b) => a + b, 0) / (leans.length || 1);
    const spread = Math.max(...leans) - Math.min(...leans);
    const mostObjective = radar.reduce((best, r) =>
      Math.abs(r.avg.political_lean) < Math.abs(best.avg.political_lean) ? r : best
    , radar[0]);

    res.json({
      query,
      radar,
      summary: {
        avg_lean: avgLean,
        spread,
        lean_label: leanLabel(avgLean),
        most_objective_source: mostObjective?.article.source || 'N/A',
        article_count: radar.length,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// MULTI-MODEL CONSENSUS
// =============================================================

app.post('/api/consensus', async (req, res) => {
  try {
    const { query } = req.body;
    const articles = await fetchAllSources(query);
    const stored = await storeArticles(articles);
    const consensus = await multiModelConsensus(query, stored);
    res.json(consensus);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// DEBATE MODE
// =============================================================

app.post('/api/debate', async (req, res) => {
  try {
    const { topic, with_audio = false } = req.body;
    const user = await getUser(req);

    const articles = await fetchAllSources(topic);
    await storeArticles(articles);

    const debate = await generateDebate(topic, articles);

    // Generate audio for both sides if requested
    if (with_audio && user) {
      const proScript = `${debate.pro?.position || topic}. ${(debate.pro?.arguments || []).join('. ')}`;
      const conScript = `${debate.con?.position || 'Counter argument'}. ${(debate.con?.arguments || []).join('. ')}`;

      const { proUrl, conUrl } = await generateDebateAudio(proScript, conScript, user.id || 'anon');
      debate.audio_pro_url = proUrl;
      debate.audio_con_url = conUrl;
    }

    res.json(debate);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// AI CHAT (streaming)
// =============================================================

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    const user = await getUser(req);

    // Fetch real-time context
    const articles = await fetchAllSources(message);
    const stored = await storeArticles(articles);
    const topArticles = stored.slice(0, 8);

    const articleContext = topArticles
      .map(a => `[${a.source}] ${a.title}\n${a.snippet?.slice(0, 200)}\nURL: ${a.url}`)
      .join('\n\n');

    // Log query
    if (user?.id) {
      await dbInsert('query_history', { user_id: user.id, query: message }).catch(() => {});
    }

    const systemPrompt = `You are Nova, an AI news analyst that provides objective, bias-aware intelligence briefings.

You have access to real-time news data. Always cite your sources with URLs.
When covering controversial topics, present multiple perspectives.
Be concise but thorough. Flag when coverage is one-sided.

Current real-time sources:
${articleContext}

Guidelines:
- Lead with facts, not opinions
- Note source diversity (or lack thereof)
- Highlight what's missing from coverage
- Use data and numbers when available`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: message },
    ];

    // Use non-streaming call and emit SSE manually (InsForge stream format varies)
    const aiResult = await aiChat({ messages, temperature: 0.3, max_tokens: 2048 }) as any;
    const fullResponse = aiResult.choices?.[0]?.message?.content || aiResult.text || '';

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Emit response as SSE chunks (word-by-word for streaming feel)
    const words = fullResponse.split(' ');
    for (let i = 0; i < words.length; i += 3) {
      const chunk = words.slice(i, i + 3).join(' ') + (i + 3 < words.length ? ' ' : '');
      const sseData = JSON.stringify({ choices: [{ delta: { content: chunk } }] });
      res.write(`data: ${sseData}\n\n`);
    }
    res.write('data: [DONE]\n\n');

    // Store report after streaming completes
    if (fullResponse && user?.id) {
      await dbInsert('reports', {
        user_id: user.id,
        query: message,
        synthesis: fullResponse,
        sources: topArticles.map(a => ({ title: a.title, url: a.url, source: a.source })),
      }).catch(() => {});
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (e: any) {
    if (!res.headersSent) {
      res.status(500).json({ error: e.message });
    } else {
      res.end();
    }
  }
});

// Non-streaming chat for simple queries
app.post('/api/chat/sync', async (req, res) => {
  try {
    const { message } = req.body;
    const articles = await fetchAllSources(message);
    const stored = await storeArticles(articles);

    const articleContext = stored.slice(0, 8)
      .map(a => `[${a.source}] ${a.title}: ${a.snippet?.slice(0, 200)}`)
      .join('\n');

    const result = await aiChat({
      messages: [
        { role: 'system', content: `You are Nova, an objective AI news analyst. Sources:\n${articleContext}` },
        { role: 'user', content: message },
      ],
      temperature: 0.3,
    }) as any;

    const response = result.choices?.[0]?.message?.content || 'No response';
    res.json({ response, sources: stored.slice(0, 8) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// VOICE BRIEFING (ElevenLabs)
// =============================================================

// Generate personalized voice briefing
app.post('/api/briefing/voice', async (req, res) => {
  try {
    const { query, language = 'en' } = req.body;
    const user = await getUser(req);
    const userId = user?.id || 'anon';

    // Get personalized topics if authenticated
    let topics = [query];
    if (user?.id && !query) {
      const prefs = await dbSelect<UserPreferences>('user_preferences', `user_id=eq.${user.id}`);
      topics = prefs[0]?.topics || ['world news'];
    }

    // Fetch news for each topic
    const allArticles: Article[] = [];
    for (const topic of topics.slice(0, 3)) {
      const articles = await fetchNews(topic, 5);
      allArticles.push(...articles);
    }

    // Generate briefing text via AI
    const articleCtx = allArticles
      .slice(0, 12)
      .map(a => `[${a.source}] ${a.title}`)
      .join('\n');

    const briefingResult = await aiChat({
      messages: [
        {
          role: 'system',
          content: 'You are Nova, a professional AI news anchor. Write a 2-minute spoken briefing script (about 250-300 words). Be conversational but authoritative. Start with "Good morning, here\'s your Nova briefing." Cover the most important stories. No markdown formatting — this will be spoken aloud.',
        },
        { role: 'user', content: `Generate a briefing for these stories:\n${articleCtx}` },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    }) as any;

    const script = briefingResult.choices?.[0]?.message?.content || 'Unable to generate briefing.';

    // Convert to audio
    let audioUrl: string;
    if (language !== 'en') {
      audioUrl = await generateMultiLangBriefing(script, language, userId);
    } else {
      audioUrl = await generateBriefingAudio(script, userId, 'briefing');
    }

    // Store report
    if (user?.id) {
      await dbInsert('reports', {
        user_id: user.id,
        query: `Voice briefing: ${topics.join(', ')}`,
        synthesis: script,
        sources: allArticles.slice(0, 12).map(a => ({ title: a.title, url: a.url, source: a.source })),
        audio_url: audioUrl,
      }).catch(() => {});
    }

    res.json({ script, audio_url: audioUrl, sources: allArticles.slice(0, 12) });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Quick TTS for any text
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;
    const audio = await textToSpeech(text);
    res.set('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// "WHAT DID I MISS?" — Personalized Catch-Up
// =============================================================

app.get('/api/catchup', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Login required for catch-up' });

    const token = getToken(req);

    // Get user's last seen time
    const prefs = await dbSelect<UserPreferences>('user_preferences', `user_id=eq.${user.id}`, token);
    const lastSeen = prefs[0]?.last_seen_at || new Date(Date.now() - 24 * 3600000).toISOString();
    const topics = prefs[0]?.topics || ['world', 'tech'];

    // Fetch recent articles since last visit
    const recentArticles = await dbSelect<Article>(
      'articles',
      `fetched_at=gte.${lastSeen}&order=fetched_at.desc&limit=20`
    );

    // If no stored articles, fetch fresh
    let articles = recentArticles;
    if (articles.length < 5) {
      const fresh: Article[] = [];
      for (const topic of topics.slice(0, 3)) {
        const fetched = await fetchNews(topic, 5);
        fresh.push(...fetched);
      }
      articles = await storeArticles(fresh);
    }

    // Generate catch-up synthesis
    const articleCtx = articles.slice(0, 15)
      .map(a => `[${a.source}] ${a.title}: ${a.snippet?.slice(0, 150)}`)
      .join('\n');

    const catchupResult = await aiChat({
      messages: [
        {
          role: 'system',
          content: `You are Nova. The user was last active at ${lastSeen}. Generate a catch-up briefing of what they missed. Focus on: 1) Most impactful stories 2) Surprising developments 3) Ongoing stories with updates. Be concise, use bullet points.`,
        },
        { role: 'user', content: `My topics: ${topics.join(', ')}\n\nRecent stories:\n${articleCtx}` },
      ],
      temperature: 0.3,
    }) as any;

    const synthesis = catchupResult.choices?.[0]?.message?.content || 'No updates found.';

    // Update last_seen
    await dbUpdate('user_preferences', `user_id=eq.${user.id}`, {
      last_seen_at: new Date().toISOString(),
    }, token).catch(() => {});

    res.json({
      since: lastSeen,
      synthesis,
      articles: articles.slice(0, 15),
      topics,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// BREAKING NEWS (Realtime)
// =============================================================

app.post('/api/breaking', async (req, res) => {
  try {
    const { query } = req.body;

    // Fetch latest news
    const articles = await fetchNews(query, 5);
    const stored = await storeArticles(articles);

    if (stored.length > 0) {
      const top = stored[0];
      // Publish to InsForge Realtime channel
      await publishBreakingNews(top.title, top.id || 0, 3);

      // Generate audio alert
      const alertAudio = await generateBreakingAlert(top.title);

      res.json({
        headline: top.title,
        article: top,
        audio_size: alertAudio.length,
        pushed: true,
      });
    } else {
      res.json({ headline: null, pushed: false });
    }
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Get recent breaking news
app.get('/api/breaking', async (req, res) => {
  try {
    const items = await dbSelect('breaking_news', 'order=pushed_at.desc&limit=20');
    res.json(items);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// SEARCH HISTORY + REPORTS
// =============================================================

app.get('/api/reports', async (req, res) => {
  try {
    const user = await getUser(req);
    if (!user?.id) return res.status(401).json({ error: 'Login required' });
    const reports = await dbSelect<Report>('reports', `user_id=eq.${user.id}&order=created_at.desc&limit=50`, getToken(req));
    res.json(reports);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Semantic search — falls back to keyword search since pgvector needs custom setup
app.post('/api/search/semantic', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    // Text-based search over stored articles as fallback
    const results = await dbSelect('articles', `limit=${limit}&order=created_at.desc`);
    res.json(results);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// TRENDING — what are people asking about?
// =============================================================

app.get('/api/trending', async (req, res) => {
  try {
    const queries = await dbSelect<{ query: string; created_at: string }>(
      'query_history',
      'order=created_at.desc&limit=100'
    );
    // Simple frequency count
    const freq: Record<string, number> = {};
    for (const q of queries) {
      const key = q.query.toLowerCase().trim();
      freq[key] = (freq[key] || 0) + 1;
    }
    const trending = Object.entries(freq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));

    res.json(trending);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// PORTFOLIO ADVISOR — AI-driven news impact on user portfolio
// =============================================================

const PORTFOLIO_PROMPT = `You are an expert AI financial analyst integrated into a news-based investment dashboard.

Given: a user's portfolio and the latest real-time news, analyze the news impact on each asset.

Return ONLY valid JSON with this exact structure:
{
  "news_insight": "<2-3 sentence summary of what is happening and why it matters for markets>",
  "impacts": [
    {
      "asset": "<ticker>",
      "direction": "Up" | "Down" | "Neutral",
      "move": "<expected % range, e.g. +3% to +6%>",
      "confidence": "Low" | "Medium" | "High",
      "reason": "<1 sentence tying directly to news>"
    }
  ],
  "overall": {
    "direction": "Gain" | "Loss" | "Neutral",
    "move": "<estimated portfolio % range>",
    "risk": "Low" | "Medium" | "High"
  },
  "advice": ["<actionable advice item 1>", "<item 2>", "<item 3>"],
  "opportunities": ["<opportunity signal 1>", "<signal 2>"]
}

Rules:
- Base predictions on logical cause-effect (e.g., war -> oil up -> energy stocks up -> airline stocks down)
- Be concise, data-driven, directly actionable
- Avoid generic statements
- One impact entry per portfolio asset
- Only return valid JSON, no other text`;

app.post('/api/portfolio-advisor', async (req, res) => {
  try {
    const { portfolio } = req.body;
    if (!portfolio?.length) return res.status(400).json({ error: 'Portfolio required' });

    // Build search queries from portfolio tickers/names
    const tickers = portfolio.map((a: any) => a.ticker || a.name).join(' ');
    const sectors = portfolio.map((a: any) => a.name).join(', ');

    // Fetch latest news relevant to portfolio
    const [general, specific] = await Promise.allSettled([
      fetchNews('stock market today economy', 6),
      fetchNews(tickers, 6),
    ]);

    const allNews: any[] = [];
    if (general.status === 'fulfilled') allNews.push(...general.value);
    if (specific.status === 'fulfilled') allNews.push(...specific.value);

    // Deduplicate
    const seen = new Set<string>();
    const news = allNews.filter(a => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return true;
    }).slice(0, 12);

    const newsContext = news
      .map(a => `[${a.source}] ${a.title}\n${(a.snippet || '').slice(0, 200)}`)
      .join('\n\n');

    const portfolioContext = portfolio
      .map((a: any) => `${a.ticker} (${a.name}): ${a.quantity} shares @ $${a.avgPrice}, ${a.allocation}% allocation`)
      .join('\n');

    const userMsg = `PORTFOLIO:\n${portfolioContext}\n\nLATEST NEWS:\n${newsContext}`;

    const aiResult = await aiChat({
      messages: [
        { role: 'system', content: PORTFOLIO_PROMPT },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    }) as any;

    const text = aiResult.choices?.[0]?.message?.content || '{}';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch?.[0] || '{}');

    // Attach news sources used
    parsed.news_used = news.slice(0, 8).map((n: any) => ({ title: n.title, source: n.source }));

    res.json(parsed);
  } catch (e: any) {
    console.error('Portfolio advisor error:', e);
    res.status(500).json({ error: e.message });
  }
});

// =============================================================
// HEALTH
// =============================================================

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Nova News',
    version: '1.0.0',
    insforge: !!process.env.INSFORGE_URL,
    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
    apify: !!process.env.APIFY_API_KEY,
    exa: !!process.env.EXA_API_KEY,
  });
});

// =============================================================
// HELPERS
// =============================================================

async function storeArticles(articles: Article[]): Promise<Article[]> {
  if (!articles.length) return [];
  try {
    // Deduplicate by URL
    const unique = articles.filter((a, i, arr) =>
      a.url && arr.findIndex(b => b.url === a.url) === i
    );

    const toInsert = unique.map(a => ({
      title: a.title,
      url: a.url,
      source: a.source,
      snippet: a.snippet,
      published_at: a.published_at,
      category: a.category,
      metadata: a.metadata || {},
    }));

    // Try to store — if DB fails (duplicates, etc.), still return articles for analysis
    const stored = await dbInsert<Article>('articles', toInsert);
    return stored.length > 0 ? stored : unique as Article[];
  } catch (e) {
    // If bulk insert fails (duplicate URLs), return original articles
    console.error('storeArticles error (likely duplicates, continuing):', (e as Error).message);
    return articles;
  }
}

function leanLabel(lean: number): string {
  if (lean < -0.6) return 'Far Left';
  if (lean < -0.2) return 'Left-Leaning';
  if (lean <= 0.2) return 'Center';
  if (lean <= 0.6) return 'Right-Leaning';
  return 'Far Right';
}

// =============================================================
// START
// =============================================================

app.listen(PORT, () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │         NOVA NEWS — AI News Agent       │
  │────────��────────────────────────────────│
  │  Server:     http://localhost:${PORT}       │
  │  InsForge:   ${process.env.INSFORGE_URL ? 'Connected' : 'Not configured'}            │
  │  ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? 'Connected' : 'Not configured'}            │
  │  Apify:      ${process.env.APIFY_API_KEY ? 'Connected' : 'Not configured'}            │
  │  EXA:        ${process.env.EXA_API_KEY ? 'Connected' : 'Not configured'}            │
  └───────────��─────────────────────────────┘
  `);
});

export default app;
