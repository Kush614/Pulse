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
import { generateBriefing } from './briefing.js';
import { refreshFeedPipeline } from './feed-pipeline.js';
import { loadFallbackBriefing, loadFallbackEvents, loadFallbackSignals } from './fallback-data.js';
import { calculatePortfolioImpact } from './portfolio-impact.js';
import { generateSignals } from './signals.js';

const storeRepo = new RuntimeStoreRepository();

function round(value: number, digits = 2): number {
  return Number(value.toFixed(digits));
}

function parseExpectedMove(move: string): number {
  const numeric = Number(move.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numeric) ? numeric : 0;
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
  const signals = await generateSignals(false);
  await remember({
    scope: 'signals',
    title: 'Signals requested',
    details: `Returned ${signals.length} trade signals from ${signals.length > 0 ? 'live generator' : store.signals.length > 0 ? 'runtime store' : 'fallback cache'}.`,
    metadata: { count: signals.length },
  });
  return signals.length > 0 ? signals : await loadFallbackSignals();
}

export async function getBriefing(): Promise<BriefingResponse | null> {
  const briefing = await generateBriefing(false);
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
  const [feed, signals] = await Promise.all([getFeed(), getSignals()]);
  const result = await calculatePortfolioImpact(request, feed, signals);

  await remember({
    scope: 'portfolio',
    title: 'Portfolio impact calculated',
    details: `Calculated exposure for ${request.holdings.length} holdings.`,
    metadata: { aggregateRisk: result.aggregateRisk, totalImpact: result.totalImpact },
  });

  return result;
}
