import { XMLParser } from 'fast-xml-parser';
import type { ArticleRecord, FeedEvent, PulseTopic, RelatedTicker, SectorImpact } from '../contracts.js';
import { RuntimeStoreRepository } from '../lib/runtime-store.js';
import { analyzeClusterWithMinimax } from './minimax.js';
import { loadMarketReference } from './market-catalog.js';
import { loadSourceCatalog, type SourceCatalogItem } from './source-catalog.js';
import { loadUrgencyCatalog } from './urgency-catalog.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseTagValue: true,
  trimValues: true,
});

const storeRepo = new RuntimeStoreRepository();

type IngestedArticle = ArticleRecord;

interface ArticleCluster {
  id: string;
  articles: IngestedArticle[];
  tokens: Set<string>;
}

const TOPIC_COLORS: Record<PulseTopic, string> = {
  MACRO: '#00C7BE',
  GEOPOLITICS: '#FF9500',
  EARNINGS: '#34C759',
  TECH: '#7BDFF2',
  COMMODITIES: '#FF3B30',
};

const stopwords = new Set([
  'the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'over', 'after', 'near', 'amid',
  'a', 'an', 'of', 'to', 'in', 'on', 'as', 'by', 'at', 'is', 'are', 'be', 'it', 'its', 'their',
  'new', 'says', 'say', 'will', 'would', 'could', 'into', 'across', 'about',
]);

function cleanText(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeTitle(title: string): string {
  return cleanText(title).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function tokenize(title: string): Set<string> {
  return new Set(
    normalizeTitle(title)
      .split(' ')
      .filter((token) => token.length > 2 && !stopwords.has(token)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function extractAtomLink(entry: Record<string, unknown>): string {
  const link = entry.link;
  if (typeof link === 'string') return link;
  if (Array.isArray(link)) {
    const href = link.find((item) => typeof item === 'object' && item && 'href' in item) as { href?: string } | undefined;
    return href?.href ?? '';
  }
  if (typeof link === 'object' && link && 'href' in link) {
    return typeof (link as { href?: unknown }).href === 'string' ? (link as { href: string }).href : '';
  }
  return '';
}

function parseFeedItems(xml: string) {
  const parsed = parser.parse(xml) as Record<string, any>;

  if (parsed.rss?.channel?.item) {
    return toArray(parsed.rss.channel.item).map((item) => ({
      title: cleanText(String(item.title ?? '')),
      body: cleanText(String(item.description ?? item['content:encoded'] ?? item.summary ?? '')),
      url: cleanText(String(item.link ?? '')),
      published: new Date(String(item.pubDate ?? item.published ?? item.updated ?? Date.now())).toISOString(),
    }));
  }

  if (parsed.feed?.entry) {
    return toArray(parsed.feed.entry).map((entry) => ({
      title: cleanText(String(entry.title ?? '')),
      body: cleanText(String(entry.summary ?? entry.content ?? '')),
      url: cleanText(extractAtomLink(entry)),
      published: new Date(String(entry.published ?? entry.updated ?? Date.now())).toISOString(),
    }));
  }

  return [];
}

async function fetchSourceItems(source: SourceCatalogItem): Promise<IngestedArticle[]> {
  try {
    const response = await fetch(source.url, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'PULSE/0.1 (+https://github.com/Kush614/Pulse)' },
    });

    if (!response.ok) return [];
    const xml = await response.text();
    const items = parseFeedItems(xml);

    return items
      .filter((item) => item.title)
      .slice(0, 5)
      .map((item) => ({
        id: crypto.randomUUID(),
        sourceUrl: item.url || source.url,
        sourceName: source.name,
        sourceLean: source.lean,
        title: item.title,
        body: item.body,
        published: item.published,
        ingested: new Date().toISOString(),
        eventId: null,
      }));
  } catch {
    return [];
  }
}

function dedupeArticles(articles: IngestedArticle[]): IngestedArticle[] {
  const seen = new Set<string>();
  const unique: IngestedArticle[] = [];
  for (const article of articles) {
    const key = `${article.sourceName}:${normalizeTitle(article.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(article);
  }
  return unique;
}

function classifyUrgency(headline: string, catalog: Awaited<ReturnType<typeof loadUrgencyCatalog>>): 1 | 2 | 3 {
  const lower = normalizeTitle(headline);
  if (catalog.exclusions.some((term) => lower.includes(term))) return 1;
  if (catalog.critical.some((term) => lower.includes(term)) || catalog.high.some((term) => lower.includes(term))) return 3;
  if (catalog.medium.some((term) => lower.includes(term))) return 2;
  return 1;
}

function classifyTopic(headline: string): PulseTopic {
  const lower = normalizeTitle(headline);
  if (/(fed|inflation|rate|yield|jobs|payroll|cpi|gdp|recession|unemployment)/.test(lower)) return 'MACRO';
  if (/(earnings|guidance|ipo|quarter|revenue|buyback|merger|acquisition)/.test(lower)) return 'EARNINGS';
  if (/(semiconductor|chip|ai|software|cyber|datacenter|openai|nvidia|microsoft|google)/.test(lower)) return 'TECH';
  if (/(oil|gas|rare earth|lithium|copper|gold|shipping|freight|opec|lng|commodity)/.test(lower)) return 'COMMODITIES';
  return 'GEOPOLITICS';
}

function buildClusters(articles: IngestedArticle[]): ArticleCluster[] {
  const clusters: ArticleCluster[] = [];
  const sorted = [...articles].sort((a, b) => new Date(b.published).getTime() - new Date(a.published).getTime());

  for (const article of sorted) {
    const titleTokens = tokenize(article.title);
    let bestCluster: ArticleCluster | null = null;
    let bestScore = 0;

    for (const cluster of clusters) {
      const score = jaccard(titleTokens, cluster.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestCluster = cluster;
      }
    }

    if (bestCluster && bestScore >= 0.28) {
      bestCluster.articles.push(article);
      for (const token of titleTokens) bestCluster.tokens.add(token);
      continue;
    }

    clusters.push({
      id: crypto.randomUUID(),
      articles: [article],
      tokens: titleTokens,
    });
  }

  return clusters;
}

function buildRelativeTime(dateString: string): string {
  const ms = Date.now() - new Date(dateString).getTime();
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.round(hours / 24);
  return `${days}d`;
}

function sourceRiskPenalty(risk: SourceCatalogItem['propagandaRisk']): number {
  if (risk === 'high') return 10;
  if (risk === 'medium') return 5;
  return 0;
}

function buildObjectivityScore(cluster: ArticleCluster, sourceCatalog: SourceCatalogItem[]): number {
  const sourceCount = new Set(cluster.articles.map((article) => article.sourceName)).size;
  const leans = cluster.articles.reduce(
    (acc, article) => {
      acc[article.sourceLean] += 1;
      return acc;
    },
    { left: 0, center: 0, right: 0 },
  );

  const agreement = cluster.articles.reduce((sum, article) => {
    return sum + jaccard(tokenize(article.title), cluster.tokens);
  }, 0) / cluster.articles.length;

  const leanBalance = 1 - (Math.abs(leans.left - leans.right) / Math.max(cluster.articles.length, 1));
  const riskPenalty = cluster.articles.reduce((sum, article) => {
    const source = sourceCatalog.find((candidate) => candidate.name === article.sourceName);
    return sum + sourceRiskPenalty(source?.propagandaRisk ?? 'low');
  }, 0) / Math.max(cluster.articles.length, 1);

  const score = 32 + (sourceCount * 8) + (agreement * 28) + (leanBalance * 18) - riskPenalty;
  return Math.max(35, Math.min(97, Math.round(score)));
}

function buildBiasDistribution(cluster: ArticleCluster) {
  const counts = cluster.articles.reduce(
    (acc, article) => {
      acc[article.sourceLean] += 1;
      return acc;
    },
    { left: 0, center: 0, right: 0 },
  );
  const total = Math.max(cluster.articles.length, 1);
  return {
    left: Math.round((counts.left / total) * 100),
    center: Math.round((counts.center / total) * 100),
    right: Math.round((counts.right / total) * 100),
  };
}

function buildHeuristicViewpoints(headline: string, topic: PulseTopic) {
  const noun = topic === 'MACRO'
    ? 'policy, inflation, and rates'
    : topic === 'TECH'
      ? 'platform power and execution risk'
      : topic === 'COMMODITIES'
        ? 'supply, pricing, and downstream cost pressure'
        : topic === 'EARNINGS'
          ? 'corporate performance and forward guidance'
          : 'strategic positioning and second-order market effects';

  return {
    left: `Left-leaning coverage frames ${headline.toLowerCase()} through labor, fairness, and public-policy consequences around ${noun}.`,
    center: `Centrist coverage focuses on the most corroborated facts behind ${headline.toLowerCase()} and how quickly the market may need to reprice them.`,
    right: `Right-leaning coverage interprets ${headline.toLowerCase()} as a strategic or policy signal with clear implications for capital allocation and risk posture.`,
  };
}

function buildSectorImpacts(topic: PulseTopic, headline: string): SectorImpact[] {
  const lower = normalizeTitle(headline);
  if (topic === 'MACRO') {
    return [
      { sector: 'Real Estate', impact: -6.1, color: '#FF3B30' },
      { sector: 'Financials', impact: 2.4, color: '#34C759' },
    ];
  }
  if (topic === 'TECH') {
    return [
      { sector: 'Technology', impact: 4.1, color: '#34C759' },
      { sector: 'Communication Services', impact: 1.9, color: '#34C759' },
    ];
  }
  if (topic === 'EARNINGS') {
    return [
      { sector: 'Consumer Discretionary', impact: 3.4, color: '#34C759' },
      { sector: 'Industrials', impact: -1.1, color: '#FF3B30' },
    ];
  }
  if (topic === 'COMMODITIES' || /rare earth|oil|shipping|freight/.test(lower)) {
    return [
      { sector: 'Materials', impact: 6.8, color: '#34C759' },
      { sector: 'Energy', impact: 4.3, color: '#34C759' },
      { sector: 'Semiconductors', impact: -2.4, color: '#FF3B30' },
    ];
  }
  return [
    { sector: 'Energy', impact: 3.8, color: '#34C759' },
    { sector: 'Industrials', impact: -1.7, color: '#FF3B30' },
  ];
}

function buildRelatedTickers(headline: string, sectorImpact: SectorImpact[], symbols: Awaited<ReturnType<typeof loadMarketReference>>['symbols']): RelatedTicker[] {
  const lower = normalizeTitle(headline);
  const matches: RelatedTicker[] = [];

  for (const symbol of symbols) {
    const companyName = normalizeTitle(symbol.name);
    const display = normalizeTitle(symbol.display);
    const displayMatch = display.length >= 3 && new RegExp(`\\b${escapeRegExp(display)}\\b`).test(lower);
    const companyMatch = companyName.length >= 4 && new RegExp(`\\b${escapeRegExp(companyName)}\\b`).test(lower);
    if (companyMatch || displayMatch) {
      matches.push({ symbol: symbol.display, change: 2.2 });
    }
  }

  const sectorMap: Record<string, string> = {
    Technology: 'XLK',
    Financials: 'XLF',
    Energy: 'XLE',
    Materials: 'XLB',
    'Real Estate': 'XLRE',
    'Communication Services': 'XLC',
    Semiconductors: 'SMH',
    Industrials: 'XLI',
    'Consumer Discretionary': 'XLY',
  };

  for (const sector of sectorImpact) {
    const ticker = sectorMap[sector.sector];
    if (!ticker) continue;
    matches.push({ symbol: ticker, change: Number(sector.impact.toFixed(1)) });
  }

  return matches.slice(0, 4);
}

function buildBrief(headline: string, sourceCount: number, topic: PulseTopic): string {
  const topicLine = topic === 'MACRO'
    ? 'The setup points to a macro repricing with clear rate and dollar implications.'
    : topic === 'TECH'
      ? 'The immediate question is whether the story changes platform, semiconductor, or software earnings expectations.'
      : topic === 'EARNINGS'
        ? 'The story matters because guidance and cross-sector read-through can move expectations faster than the headline itself.'
        : topic === 'COMMODITIES'
          ? 'The main market consequence is tighter supply or transport pressure filtering into commodity-sensitive assets.'
          : 'The key market consequence is how geopolitical stress changes sector winners, losers, and volatility.';

  return `${headline} ${sourceCount} independent sources are already converging on the core facts. ${topicLine}`;
}

async function clusterToEvent(
  cluster: ArticleCluster,
  sourceCatalog: SourceCatalogItem[],
  marketReference: Awaited<ReturnType<typeof loadMarketReference>>,
  urgencyCatalog: Awaited<ReturnType<typeof loadUrgencyCatalog>>,
  useAi: boolean,
): Promise<FeedEvent> {
  const representative = cluster.articles[0];
  const topic = classifyTopic(representative.title);
  const biasDistribution = buildBiasDistribution(cluster);
  const sourceCount = new Set(cluster.articles.map((article) => article.sourceName)).size;
  const sectorImpact = buildSectorImpacts(topic, representative.title);
  const aiAnalysis = useAi
    ? await analyzeClusterWithMinimax(cluster.articles.map((article) => article.title).slice(0, 5))
    : null;
  const heuristicViewpoints = buildHeuristicViewpoints(representative.title, topic);

  return {
    id: cluster.id,
    headline: representative.title,
    topic: aiAnalysis?.topic ?? topic,
    topicColor: TOPIC_COLORS[aiAnalysis?.topic ?? topic],
    time: buildRelativeTime(representative.published),
    objectivity: buildObjectivityScore(cluster, sourceCatalog),
    sources: sourceCount,
    urgency: classifyUrgency(representative.title, urgencyCatalog),
    brief: aiAnalysis?.brief ?? buildBrief(representative.title, sourceCount, topic),
    viewpoints: [
      { label: 'LEFT', pct: biasDistribution.left, color: '#4DA3FF', take: aiAnalysis?.viewpoints?.left ?? heuristicViewpoints.left },
      { label: 'CENTER', pct: biasDistribution.center, color: '#9AA5B1', take: aiAnalysis?.viewpoints?.center ?? heuristicViewpoints.center },
      { label: 'RIGHT', pct: biasDistribution.right, color: '#FF8A65', take: aiAnalysis?.viewpoints?.right ?? heuristicViewpoints.right },
    ],
    biasDistribution,
    sectorImpact,
    relatedTickers: buildRelatedTickers(representative.title, sectorImpact, marketReference.symbols),
  };
}

export async function ingestArticles(): Promise<IngestedArticle[]> {
  const sources = await loadSourceCatalog();
  const chunks = await Promise.all(sources.map((source) => fetchSourceItems(source)));
  return dedupeArticles(chunks.flat());
}

export async function analyzeArticles(articles: IngestedArticle[]): Promise<FeedEvent[]> {
  const [sourceCatalog, marketReference, urgencyCatalog] = await Promise.all([
    loadSourceCatalog(),
    loadMarketReference(),
    loadUrgencyCatalog(),
  ]);

  const clusters = buildClusters(articles)
    .sort((a, b) => {
      const clusterSize = b.articles.length - a.articles.length;
      if (clusterSize !== 0) return clusterSize;
      return new Date(b.articles[0]?.published ?? 0).getTime() - new Date(a.articles[0]?.published ?? 0).getTime();
    })
    .slice(0, 20);

  const aiBudget = 5;
  const events = await Promise.all(
    clusters.map((cluster, index) => clusterToEvent(cluster, sourceCatalog, marketReference, urgencyCatalog, index < aiBudget)),
  );

  return events
    .sort((a, b) => {
      const urgencyDelta = b.urgency - a.urgency;
      if (urgencyDelta !== 0) return urgencyDelta;
      return b.objectivity - a.objectivity;
    })
    .slice(0, 20);
}

export async function refreshFeedPipeline(force = false): Promise<{ articles: IngestedArticle[]; events: FeedEvent[]; stale: boolean }> {
  const store = await storeRepo.read();
  const lastAnalyzed = store.meta?.lastAnalyzedAt ? new Date(store.meta.lastAnalyzedAt).getTime() : 0;
  const freshEnough = Date.now() - lastAnalyzed < 15 * 60_000;

  if (process.env.VITEST && !force) {
    return { articles: store.articles, events: store.events, stale: false };
  }

  if (!force && freshEnough && store.events.length > 0) {
    return { articles: store.articles, events: store.events, stale: false };
  }

  const articles = await ingestArticles();
  if (articles.length === 0) {
    return { articles: store.articles, events: store.events, stale: true };
  }

  const events = await analyzeArticles(articles);

  await storeRepo.write({
    ...store,
    articles,
    events,
    meta: {
      ...store.meta,
      lastIngestedAt: new Date().toISOString(),
      lastAnalyzedAt: new Date().toISOString(),
    },
  });

  return { articles, events, stale: false };
}

export async function runIngestStep(): Promise<IngestedArticle[]> {
  const store = await storeRepo.read();
  const articles = await ingestArticles();
  await storeRepo.write({
    ...store,
    articles,
    meta: {
      ...store.meta,
      lastIngestedAt: new Date().toISOString(),
    },
  });
  return articles;
}

export async function runAnalyzeStep(articles: IngestedArticle[]): Promise<FeedEvent[]> {
  const store = await storeRepo.read();
  const events = await analyzeArticles(articles);
  await storeRepo.write({
    ...store,
    articles,
    events,
    meta: {
      ...store.meta,
      lastAnalyzedAt: new Date().toISOString(),
    },
  });
  return events;
}
