import { join } from 'node:path';
import type { FeedEvent, TradeSignal } from '../contracts.js';
import { readJsonFile } from '../lib/json-file.js';
import { RuntimeStoreRepository } from '../lib/runtime-store.js';
import { generateClaudeJson } from './claude.js';
import { refreshFeedPipeline } from './feed-pipeline.js';
import { loadFallbackSignals } from './fallback-data.js';
import { syncSignalsToInsforge } from './insforge-sync.js';
import { assertStrictLive } from './live-mode.js';

const storeRepo = new RuntimeStoreRepository();

interface PatternRecord {
  id: string;
  keywords: string[];
  preferredTickers: string[];
  direction: 'LONG' | 'SHORT' | 'HEDGE';
  timeframe: string;
  expectedMove: string;
  description: string;
}

const patternsPath = join(process.cwd(), 'backend', 'data', 'patterns.json');

function normalize(text: string) {
  return text.toLowerCase();
}

function firstPatternMatch(event: FeedEvent, patterns: PatternRecord[]) {
  const text = normalize(`${event.headline} ${event.brief}`);
  return patterns.find((pattern) => pattern.keywords.some((keyword) => text.includes(keyword)));
}

function formatMove(value: number) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

function deriveTicker(event: FeedEvent, pattern?: PatternRecord) {
  if (pattern?.preferredTickers?.length) {
    const preferred = pattern.preferredTickers.find((ticker) =>
      event.relatedTickers.some((related) => related.symbol.toUpperCase() === ticker.toUpperCase()),
    );
    if (preferred) return preferred;
    return pattern.preferredTickers[0];
  }
  return event.relatedTickers[0]?.symbol ?? 'UUP';
}

function deriveSignalHeuristically(event: FeedEvent, pattern?: PatternRecord): TradeSignal {
  const topImpact = [...event.sectorImpact].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))[0];
  const action = pattern?.direction
    ?? (((topImpact?.impact ?? 0) > 0)
      ? 'LONG'
      : ((topImpact?.impact ?? 0) < 0)
        ? 'SHORT'
        : 'HEDGE');
  const ticker = deriveTicker(event, pattern);
  const relatedMove = event.relatedTickers.find((related) => related.symbol === ticker)?.change ?? topImpact?.impact ?? 0;
  const expectedMove = pattern?.expectedMove ?? formatMove(relatedMove);
  const confidence = Math.max(55, Math.min(92, Math.round((event.objectivity * 0.55) + (event.sources * 2.5) + (event.urgency * 6))));

  return {
    id: crypto.randomUUID(),
    action,
    ticker,
    name: ticker,
    rationale: `${event.headline} changes the setup for ${ticker} by repricing ${topImpact?.sector ?? event.topic.toLowerCase()} risk and opportunity.`,
    expectedMove,
    timeframe: pattern?.timeframe ?? (event.urgency === 3 ? '15-45d' : '30-90d'),
    confidence,
    triggeringStory: event.headline,
    historicalMatch: pattern?.description ?? `Similar ${event.topic.toLowerCase()} shocks have historically moved ${ticker} over the following ${event.urgency === 3 ? 'weeks' : 'months'}.`,
  };
}

async function refineSignalWithClaude(event: FeedEvent, baseSignal: TradeSignal, pattern?: PatternRecord): Promise<TradeSignal | null> {
  const response = await generateClaudeJson<TradeSignal>(
    [
      'Return JSON with keys: action, ticker, name, rationale, expectedMove, timeframe, confidence, triggeringStory, historicalMatch.',
      `Event headline: ${event.headline}`,
      `Event brief: ${event.brief}`,
      `Bias distribution: ${JSON.stringify(event.biasDistribution)}`,
      `Sector impact: ${JSON.stringify(event.sectorImpact)}`,
      `Related tickers: ${JSON.stringify(event.relatedTickers)}`,
      `Heuristic proposal: ${JSON.stringify(baseSignal)}`,
      pattern ? `Historical pattern: ${pattern.description}` : '',
      'Keep rationale to one sentence and confidence between 0 and 100.',
    ].filter(Boolean).join('\n'),
    'pulse-signal-engine',
  );

  if (!response) return null;
  return {
    ...baseSignal,
    ...response,
    id: baseSignal.id,
    triggeringStory: event.headline,
  };
}

export async function generateSignals(force = false): Promise<TradeSignal[]> {
  const store = await storeRepo.read();
  const lastSignals = store.meta?.lastSignalsAt ? new Date(store.meta.lastSignalsAt).getTime() : 0;
  const freshEnough = Date.now() - lastSignals < 15 * 60_000;

  if (process.env.VITEST && !force) {
    return store.signals.length > 0 ? store.signals : await loadFallbackSignals();
  }

  if (!force && freshEnough && store.signals.length > 0) {
    return store.signals;
  }

  const { events } = await refreshFeedPipeline(false);
  const activeEvents = events.length > 0 ? events : store.events;
  assertStrictLive(
    activeEvents.length > 0,
    'Cannot generate live signals without active live events. Strict live mode is enabled.',
  );
  if (activeEvents.length === 0) return loadFallbackSignals();

  const patterns = await readJsonFile<PatternRecord[]>(patternsPath, []);
  const topEvents = activeEvents.slice(0, 8);
  const signals: TradeSignal[] = [];

  for (let index = 0; index < topEvents.length; index += 1) {
    const event = topEvents[index];
    const pattern = firstPatternMatch(event, patterns);
    const heuristic = deriveSignalHeuristically(event, pattern);
    const refined = index < 3 ? await refineSignalWithClaude(event, heuristic, pattern) : null;
    const signal = refined ?? heuristic;
    if (signals.some((existing) => existing.ticker === signal.ticker && existing.action === signal.action)) continue;
    signals.push(signal);
  }

  const nextStore = {
    ...store,
    signals,
    meta: {
      ...store.meta,
      lastSignalsAt: new Date().toISOString(),
    },
  };

  await storeRepo.write(nextStore);
  await syncSignalsToInsforge(signals);

  assertStrictLive(
    signals.length > 0,
    'Signal generation produced no live signals. Strict live mode is enabled.',
  );
  return signals.length > 0 ? signals : await loadFallbackSignals();
}
