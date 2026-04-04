import { env } from '../env.js';
import type {
  BriefingResponse,
  FeedEvent,
  PortfolioHoldingImpact,
  PortfolioImpactRequest,
  PortfolioImpactResponse,
  ProcessMemoryEntry,
  TradeSignal,
} from '../contracts.js';
import { RuntimeStoreRepository } from '../lib/runtime-store.js';
import { refreshFeedPipeline } from './feed-pipeline.js';
import { loadFallbackBriefing, loadFallbackEvents, loadFallbackSignals } from './fallback-data.js';

const storeRepo = new RuntimeStoreRepository();

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function parseExpectedMove(move: string): number {
  const numeric = Number(move.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
}

function holdingNameFromTicker(ticker: string): string {
  return ticker.toUpperCase();
}

async function remember(entry: Omit<ProcessMemoryEntry, 'id' | 'recordedAt'>): Promise<void> {
  const store = await storeRepo.read();
  const memoryEntry: ProcessMemoryEntry = {
    id: crypto.randomUUID(),
    recordedAt: new Date().toISOString(),
    ...entry,
  };
  store.memoryEntries.push(memoryEntry);
  await storeRepo.write(store);
}

export async function getFeed(): Promise<FeedEvent[]> {
  const store = await storeRepo.read();
  const refreshed = await refreshFeedPipeline(false);
  const events = refreshed.events.length > 0
    ? refreshed.events
    : store.events.length > 0
      ? store.events
      : await loadFallbackEvents();
  await remember({
    scope: 'pipeline',
    title: 'Feed requested',
    details: `Returned ${events.length} events from ${refreshed.events.length > 0 ? 'live pipeline' : store.events.length > 0 ? 'runtime store' : 'fallback cache'}.`,
    metadata: { count: events.length, memoriEnabled: Boolean(env.MEMORI_API_KEY), stale: refreshed.stale },
  });
  return events;
}

export async function getSignals(): Promise<TradeSignal[]> {
  const store = await storeRepo.read();
  const signals = store.signals.length > 0 ? store.signals : await loadFallbackSignals();
  await remember({
    scope: 'signals',
    title: 'Signals requested',
    details: `Returned ${signals.length} trade signals from ${store.signals.length > 0 ? 'runtime store' : 'fallback cache'}.`,
    metadata: { count: signals.length },
  });
  return signals;
}

export async function getBriefing(): Promise<BriefingResponse | null> {
  const store = await storeRepo.read();
  const briefing = store.briefings[0] ?? await loadFallbackBriefing();
  if (!briefing) return null;
  await remember({
    scope: 'briefing',
    title: 'Briefing requested',
    details: `Served briefing generated at ${briefing.generatedAt}.`,
    metadata: { storiesCount: briefing.storiesCount },
  });
  return briefing;
}

export async function getPortfolioImpact(request: PortfolioImpactRequest): Promise<PortfolioImpactResponse> {
  const feed = await getFeed();
  const signals = await getSignals();
  const totalValue = request.holdings.reduce((sum, holding) => sum + holding.shares * holding.avgCost, 0);

  const holdings: PortfolioHoldingImpact[] = request.holdings.map((holding) => {
    const relatedFeed = feed.filter((event) =>
      event.relatedTickers.some((ticker) => ticker.symbol.toUpperCase() === holding.ticker.toUpperCase())
      || signals.some((signal) => signal.ticker.toUpperCase() === holding.ticker.toUpperCase() && signal.triggeringStory === event.headline),
    );

    const signalMatch = signals.find((signal) => signal.ticker.toUpperCase() === holding.ticker.toUpperCase());
    const directMove = signalMatch ? parseExpectedMove(signalMatch.expectedMove) * (signalMatch.action === 'SHORT' ? -1 : 1) : 0;
    const storyImpact = relatedFeed.reduce((sum, event) => {
      const directTicker = event.relatedTickers.find((ticker) => ticker.symbol.toUpperCase() === holding.ticker.toUpperCase());
      return sum + (directTicker?.change ?? 0);
    }, 0);
    const geoImpact = round(directMove + storyImpact);
    const value = round(holding.shares * holding.avgCost);
    const weight = totalValue > 0 ? round((value / totalValue) * 100) : 0;

    return {
      ticker: holding.ticker.toUpperCase(),
      name: holdingNameFromTicker(holding.ticker),
      weight,
      value,
      geoImpact,
      exposedTo: relatedFeed.map((event) => ({
        headline: event.headline,
        impact: round(
          event.relatedTickers.find((ticker) => ticker.symbol.toUpperCase() === holding.ticker.toUpperCase())?.change
          ?? directMove
          ?? 0,
        ),
      })),
    };
  });

  const aggregateRisk = round(
    holdings.reduce((sum, holding) => sum + Math.abs(holding.geoImpact) * (holding.weight / 100), 0),
  );
  const totalImpact = round(
    holdings.reduce((sum, holding) => sum + (holding.geoImpact * holding.weight / 100), 0),
  );

  await remember({
    scope: 'portfolio',
    title: 'Portfolio impact calculated',
    details: `Calculated exposure for ${request.holdings.length} holdings.`,
    metadata: { aggregateRisk, totalImpact },
  });

  return {
    totalValue: round(totalValue),
    aggregateRisk,
    totalImpact,
    holdings,
  };
}
