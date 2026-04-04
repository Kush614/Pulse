import { join } from 'node:path';
import type { BriefingResponse, FeedEvent, TradeSignal } from '../contracts.js';
import { readJsonFile } from '../lib/json-file.js';

const dataPath = (...parts: string[]) => join(process.cwd(), 'backend', 'data', ...parts);

export async function loadFallbackEvents(): Promise<FeedEvent[]> {
  return readJsonFile<FeedEvent[]>(dataPath('cached-events.json'), []);
}

export async function loadFallbackSignals(): Promise<TradeSignal[]> {
  return readJsonFile<TradeSignal[]>(dataPath('cached-signals.json'), []);
}

export async function loadFallbackBriefing(): Promise<BriefingResponse | null> {
  return readJsonFile<BriefingResponse | null>(dataPath('cached-briefings', 'today.json'), null);
}
