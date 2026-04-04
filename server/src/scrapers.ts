// ============================================================
// Nova News — Data Scrapers (Free APIs: Google News RSS, GDELT, HN)
// ============================================================

import type { Article } from './types.js';

// ─── Google News RSS (No API key needed) ────────────────────

export async function fetchNews(query: string, maxItems = 10): Promise<Article[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
    console.log(`[GoogleNews] Fetching: ${query}`);

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`Google News RSS: ${res.status}`);
    const xml = await res.text();

    // Parse RSS XML items
    const articles: Article[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && articles.length < maxItems) {
      const item = match[1];
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const pubDate = extractTag(item, 'pubDate');
      const source = extractTag(item, 'source');
      const description = extractTag(item, 'description');

      if (title && link) {
        articles.push({
          title: decodeEntities(title),
          url: link,
          source: source || extractDomain(link),
          snippet: decodeEntities(stripHtml(description || '')).slice(0, 500),
          published_at: pubDate || null,
          category: 'news',
          metadata: { via: 'google-news-rss' },
        });
      }
    }
    console.log(`[GoogleNews] Found ${articles.length} articles for "${query}"`);
    return articles;
  } catch (e) {
    console.error('fetchNews error:', e);
    return [];
  }
}

// ─── GDELT (No API key needed) ──────────────────────────────

export async function fetchGdelt(query: string, maxItems = 10): Promise<Article[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encoded}&mode=ArtList&maxrecords=${maxItems}&format=json&sort=DateDesc&timespan=7d`;
    console.log(`[GDELT] Fetching: ${query}`);

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`GDELT: ${res.status}`);
    const data = await res.json() as any;

    const articles: Article[] = (data.articles || []).map((a: any) => ({
      title: a.title || '',
      url: a.url || '',
      source: a.domain || extractDomain(a.url || ''),
      snippet: a.title || '',
      published_at: a.seendate ? formatGdeltDate(a.seendate) : null,
      category: 'news',
      metadata: {
        via: 'gdelt',
        tone: a.tone,
        language: a.language,
        socialimage: a.socialimage,
      },
    }));
    console.log(`[GDELT] Found ${articles.length} articles for "${query}"`);
    return articles;
  } catch (e) {
    console.error('fetchGdelt error:', e);
    return [];
  }
}

// ─── Hacker News (No API key needed) ────────────────────────

export async function fetchHackerNews(query: string, maxItems = 5): Promise<Article[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${encoded}&tags=story&hitsPerPage=${maxItems}`;
    console.log(`[HN] Fetching: ${query}`);

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HN: ${res.status}`);
    const data = await res.json() as any;

    const articles: Article[] = (data.hits || []).map((h: any) => ({
      title: h.title || '',
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      source: h.url ? extractDomain(h.url) : 'Hacker News',
      snippet: h.title || '',
      published_at: h.created_at || null,
      category: 'tech',
      metadata: { via: 'hackernews', points: h.points, comments: h.num_comments },
    }));
    console.log(`[HN] Found ${articles.length} articles for "${query}"`);
    return articles;
  } catch (e) {
    console.error('fetchHackerNews error:', e);
    return [];
  }
}

// ─── Social: Reddit via Google News RSS ─────────────────────

export async function fetchReddit(query: string, maxItems = 5): Promise<Article[]> {
  try {
    // Reddit JSON API — no key needed
    const encoded = encodeURIComponent(query);
    const url = `https://www.reddit.com/search.json?q=${encoded}&sort=new&limit=${maxItems}&t=week`;
    console.log(`[Reddit] Fetching: ${query}`);

    const res = await fetch(url, {
      headers: { 'User-Agent': 'NovaNews/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Reddit: ${res.status}`);
    const data = await res.json() as any;

    const articles: Article[] = (data?.data?.children || []).map((c: any) => {
      const p = c.data;
      return {
        title: p.title || '',
        url: p.url || `https://reddit.com${p.permalink}`,
        source: `r/${p.subreddit}`,
        snippet: (p.selftext || p.title || '').slice(0, 500),
        published_at: p.created_utc ? new Date(p.created_utc * 1000).toISOString() : null,
        category: 'social',
        metadata: { via: 'reddit', score: p.score, comments: p.num_comments },
      };
    });
    console.log(`[Reddit] Found ${articles.length} posts for "${query}"`);
    return articles;
  } catch (e) {
    console.error('fetchReddit error:', e);
    return [];
  }
}

// ─── Twitter/X via Google News RSS ──────────────────────────

export async function fetchTweets(query: string, maxItems = 5): Promise<Article[]> {
  // Use Google News RSS with site filter for X/Twitter
  try {
    const encoded = encodeURIComponent(`${query} site:x.com OR site:twitter.com`);
    const url = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const xml = await res.text();

    const articles: Article[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(xml)) && articles.length < maxItems) {
      const item = match[1];
      const title = extractTag(item, 'title');
      const link = extractTag(item, 'link');
      const pubDate = extractTag(item, 'pubDate');

      if (title && link) {
        articles.push({
          title: decodeEntities(title),
          url: link,
          source: 'X/Twitter',
          snippet: decodeEntities(title),
          published_at: pubDate || null,
          category: 'social',
          metadata: { via: 'google-news-twitter' },
        });
      }
    }
    return articles;
  } catch (e) {
    console.error('fetchTweets error:', e);
    return [];
  }
}

// ─── Financial Data (CoinGecko + Yahoo via World Monitor) ───

export async function fetchFinance(query: string): Promise<Article[]> {
  try {
    // CoinGecko for crypto, free no key
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const data = await res.json() as any;

    return (data.coins || []).slice(0, 5).map((coin: any) => ({
      title: `${coin.name} (${coin.symbol?.toUpperCase()})`,
      url: `https://www.coingecko.com/en/coins/${coin.id}`,
      source: 'CoinGecko',
      snippet: `Market cap rank: #${coin.market_cap_rank || 'N/A'}`,
      category: 'finance',
      metadata: { via: 'coingecko', thumb: coin.thumb },
    }));
  } catch (e) {
    console.error('fetchFinance error:', e);
    return [];
  }
}

// ─── EXA Semantic Search (kept for future use) ──────────────

const EXA_API_KEY = process.env.EXA_API_KEY || '';

export async function searchExa(query: string, numResults = 10, type: 'auto' | 'news' = 'auto'): Promise<Article[]> {
  if (!EXA_API_KEY) return [];
  try {
    const body: Record<string, unknown> = {
      query,
      numResults,
      useAutoprompt: true,
      contents: { text: { maxCharacters: 1500 } },
    };

    if (type === 'news') {
      body.category = 'news';
      body.startPublishedDate = new Date(Date.now() - 7 * 86400000).toISOString();
    }

    const res = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': EXA_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`EXA: ${res.status}`);
    const data = await res.json() as any;

    return (data.results || []).map((r: any) => ({
      title: r.title || '',
      url: r.url || '',
      source: extractDomain(r.url || ''),
      snippet: r.text?.slice(0, 500) || '',
      published_at: r.publishedDate || null,
      category: type === 'news' ? 'news' : 'web',
      metadata: { via: 'exa', score: r.score },
    }));
  } catch (e) {
    console.error('searchExa error:', e);
    return [];
  }
}

// ─── Aggregate: fetch all sources for a query ────────────────

export async function fetchAllSources(query: string): Promise<Article[]> {
  console.log(`[Scrapers] Fetching all sources for: "${query}"`);

  const [news, gdelt, hn, reddit, tweets] = await Promise.allSettled([
    fetchNews(query, 8),
    fetchGdelt(query, 8),
    fetchHackerNews(query, 5),
    fetchReddit(query, 5),
    fetchTweets(query, 3),
  ]);

  const results: Article[] = [];
  for (const r of [news, gdelt, hn, reddit, tweets]) {
    if (r.status === 'fulfilled') results.push(...r.value);
  }
  console.log(`[Scrapers] Total articles: ${results.length}`);
  return results;
}

// ─── Utils ───────────────────────────────────────────────────

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
  return match?.[1]?.trim() || '';
}

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

function formatGdeltDate(gdeltDate: string): string {
  // GDELT dates: "20260404T123000Z" -> ISO
  try {
    const y = gdeltDate.slice(0, 4);
    const m = gdeltDate.slice(4, 6);
    const d = gdeltDate.slice(6, 8);
    const h = gdeltDate.slice(9, 11);
    const min = gdeltDate.slice(11, 13);
    return `${y}-${m}-${d}T${h}:${min}:00Z`;
  } catch {
    return gdeltDate;
  }
}
